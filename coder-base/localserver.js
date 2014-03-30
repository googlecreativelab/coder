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
	util.log("redirect: " + "http://" + getHost(req) + ":" + config.httpVisiblePort + '/app/auth');
        res.redirect("http://" + getHost(req) + ":" + config.httpVisiblePort +  '/app/auth' ); 
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


var startLocal = function() {
    http.createServer(localapp).listen( config.httpListenPort, '127.0.0.1' );
};

var getHost = function( req ) {
    var host = req.connection.address().address;
    if ( typeof req.headers.host !== "undefined" ) {
        host = req.headers.host;
        if ( host.match(/:/g) ) {
            host = host.slice( 0, host.indexOf(":") );
        }
    }
    return host;
};

//Traffic on 127.0.0.1 (localhost) only
var localapp = express();
params.extend( localapp );
localapp.engine( 'html', cons.mustache );
localapp.set( 'view engine', 'html' );
localapp.set( 'views', __dirname + '/views' );
localapp.use( express.bodyParser() );
localapp.use( express.cookieParser() );
localapp.use( express.session({ 
    secret: crypto.randomBytes(16).toString('utf-8'),
    store: new express.session.MemoryStore()
}));
localapp.use( '/static', express.static( __dirname + '/static' ) );
localapp.get( '/', function( req, res ) {
    util.log( 'GET: /' );
    res.redirect( '/app/auth' );
});
localapp.all( /^\/app\/(\w+)\/(.*)$/, function( req, res ) { apphandler( req, res,  __dirname + '/apps/'); } );
localapp.all( /^\/app\/(\w+)\/$/, function( req, res ) { apphandler( req, res,  __dirname + '/apps/'); } );
localapp.all( /^\/app\/(\w+)$/, function( req, res ) { apphandler( req, res,  __dirname + '/apps/'); } );


startLocal();

process.on('uncaughtException', function(err) {
    console.log('WARNING: unhandled exception: ' + err );
});

