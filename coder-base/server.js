/**
 * Coder for Raspberry Pi
 * A simple platform for experimenting with web stuff.
 * http://goo.gl/coder
 *
 * Copyright 2013 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var express = require('express');
var io = require('socket.io');
var net = require('http');
var http = require('http');
var https = require('https');
var crypto = require('crypto');
var path = require('path');
var config = require('./config');
var fs = require('fs');
var util = require('util');
var cons = require('consolidate');
var params = require('express-params');
var querystring = require('querystring');

var loadApp = function( loadpath ) {

    var userapp = null;
    if ( config.cacheApps ) {
        userapp = require(loadpath);
    } else {

        var cached = require.cache[loadpath + '.js'];
        if ( cached ) {
            userapp = require(loadpath);
            if ( userapp.on_destroy ) {
                userapp.on_destroy();
            }
            delete require.cache[loadpath + ".js"];
        }
        userapp = require(loadpath);
    }
    return userapp;
};


var apphandler = function( req, res, appdir ) {

    var appname = req.params[0];
    var apppath = req.params[1];
    var modpath = appdir + appname;
    var userapp = loadApp( modpath + "/app" );
    

    util.log( "GET: " + apppath + " " + appname );

    //Redirect to sign-in for unauthenticated users
    publicAllowed = ["auth"]; //apps that are exempt from any login (should only be auth)
    auth = require(appdir + "auth" + "/app");
    user = auth.isAuthenticated(req, res);
    if ( !user && publicAllowed.indexOf( appname ) < 0) {
        res.redirect("https://" + getHost(req) + ":" + config.httpsVisiblePort  + '/app/auth' ); 
        return;
    }


    if ( !apppath ) {
        apppath = "/";  
    } else {
        apppath = "/" + apppath;        
    }

    userapp.settings.appname = appname;
    userapp.settings.viewpath="apps/" + appname;
    userapp.settings.appurl="/app/" + appname;
    userapp.settings.staticurl = "/static/apps/" + appname;
    userapp.settings.device_name = auth.getDeviceName();
    userapp.settings.coder_owner = auth.getCoderOwner();
    userapp.settings.coder_color = auth.getCoderColor();
    if ( userapp.settings.device_name === "" ) {
        userapp.settings.device_name = "Coder";
    }
    if ( userapp.settings.coder_color === "" ) {
        userapp.settings.coder_color = "#3e3e3e";
    }

    var routes = [];
    if ( req.route.method === 'get' ) {
        routes = userapp.get_routes;
    } else if ( req.route.method === 'post' ) {
        routes = userapp.post_routes;
    }
        
    if ( routes ) {
        var found = false;
        for ( var i in routes ) {
            route = routes[i];
            if ( route['path'] instanceof RegExp ) {
                var m = route['path'].exec( apppath );
                if ( m ) {      
                    userapp[route['handler']]( req, res, m );
                    found = true;
                    break;
                }
                        
            } else if ( route['path'] === apppath ) {
                userapp[route['handler']]( req, res );
                found = true;
                break;
            }       

        }

        if ( !found ) {
            res.status( 404 );
            res.render('404', {
                title: 'error'
            });
        }
    }
};

var startSSLRedirect = function() {
    http.createServer( redirectapp ).listen( config.httpListenPort, config.listenIP );
};

var startSSL = function() {

    var privateKey="";
    var certificate="";
    try {
        privateKey = fs.readFileSync('certs/server.key').toString();
        certificate = fs.readFileSync('certs/server.cert').toString();
    } catch ( e ) {
        util.print( "no certificate found. generating self signed cert.\n" );
    }
    
    if ( privateKey !== "" && certificate !== "" ) {
        https.createServer({ key: privateKey, cert: certificate }, sslapp).listen( config.listenPort, config.listenIP );
    } else {
        var spawn = require('child_process').spawn;
        
        var genSelfSignedCert = function() {
            var genkey = spawn( 'openssl', [
                'req', '-x509', '-nodes',
                '-days', '365',
                '-newkey', 'rsa:2048',
                '-keyout', 'certs/server.key',
                '-out', 'certs/server.cert',
                '-subj',
                '/C=' + config.country + '/ST=' + config.state + "/L=" + config.locale + "/CN=" + config.commonName + "/subjectAltName=" + config.subjectAltName
            ]);
            genkey.stdout.on('data', function(d) { util.print(d) } );
            genkey.stderr.on('data', function(d) { util.print(d) } );
            genkey.addListener( 'exit', function( code, signal ) {
                fs.chmodSync('certs/server.key', '600');
                loadServer();
            });
        };        
        var loadServer = function() {
            privateKey = fs.readFileSync('certs/server.key').toString();
            certificate = fs.readFileSync('certs/server.cert').toString();
            https.createServer({ key: privateKey, cert: certificate }, sslapp).listen( config.listenPort, config.listenIP );
        };

        genSelfSignedCert();
    }
};

var pingEnabled = config.enableStatusServer;
var pingStatusServer = function() {
    var server = config.statusServer;
    var auth = auth = require(process.cwd() + "/apps/auth/app"); //needed for DeviceName
    var devicename = auth.getDeviceName();

    if ( typeof server === 'undefined' || server === "" || !pingEnabled ) {
        return;
    }
        
    if ( typeof devicename === 'undefined' || devicename === "" ) {
        devicename = "Unconfigured Coder";
    }
        
    var options = {
        host: server,
        port: '80',
        method: 'POST',
        path: '/api/coder/status',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };
    var postreq = http.request( options, function( postres ) {
        postres.on('data', function(d) {
            util.log( 'ping data: ' + d );
        });
        //TODO: do we do anything with response?
    });
    postreq.on('socket', function( postsocket ) {
        postsocket.setTimeout(10 * 1000);
        postsocket.on('connect', function( postconnection ) {
            var data = {
                ip: postreq.socket.address().address,
                coder_name: devicename,
                network: ''
            };
            var postdata = querystring.stringify( data );
            postreq.setHeader( 'Content-Length', postdata.length );
            postreq.write( postdata );
            postreq.end();
        });
    });
    postreq.on('error', function(e) {
        util.log('PING ERROR: ' + e );
    });

    setTimeout( pingStatusServer, 30 * 1000 );
};

var getHost = function( req ) {
    var host = req.connection.address().address;
    if ( typeof req.headers.host !== "undefined" ) {
        host = req.headers.host;
    }
    return host;
};

//HTTPS handles all normal traffic
var sslapp = express();
params.extend( sslapp );
sslapp.engine( 'html', cons.mustache );
sslapp.set( 'view engine', 'html' );
sslapp.set( 'views', __dirname + '/views' );
sslapp.use( express.bodyParser() );
sslapp.use( express.cookieParser() );
sslapp.use( express.session({ 
    secret: crypto.randomBytes(16).toString('utf-8'),
    store: new express.session.MemoryStore()
}));
sslapp.use( '/static', express.static( __dirname + '/static' ) );
sslapp.get( '/', function( req, res ) {
    util.log( 'GET: /' );
    res.redirect( '/app/auth' );
});
sslapp.all( /^\/app\/(\w+)\/(.*)$/, function( req, res ) { apphandler( req, res,  __dirname + '/apps/'); } );
sslapp.all( /^\/app\/(\w+)\/$/, function( req, res ) { apphandler( req, res,  __dirname + '/apps/'); } );
sslapp.all( /^\/app\/(\w+)$/, function( req, res ) { apphandler( req, res,  __dirname + '/apps/'); } );


//HTTP is all redirected to HTTPS
var redirectapp = express();
params.extend( redirectapp );
redirectapp.engine( 'html', cons.mustache );
redirectapp.all( /.*/, function( req, res ) {
    util.log( 'redirect: ' + getHost(req) + " " + config.httpsVisiblePort + " " + req.url );
    res.redirect("https://" + getHost(req) + ":" + config.httpsVisiblePort  + req.url); 
});

startSSL();
startSSLRedirect();
pingStatusServer();

process.on('uncaughtException', function(err) {
    console.log('WARNING: unhandled exception: ' + err );
});

