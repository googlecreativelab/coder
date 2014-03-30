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

var mustache = require('mustache');
var util = require('util');
var fs = require('fs');

exports.settings={};
//These are dynamically updated by the runtime
//settings.appname - the app id (folder) where your app is installed
//settings.viewpath - prefix to where your view html files are located
//settings.staticurl - base url path to static assets /static/apps/appname
//settings.appurl - base url path to this app /app/appname

exports.get_routes = [
    { path:'/', handler:'index_handler'},
    { path: '/api/app/list', handler: 'api_app_list_handler' }
];


exports.post_routes = [
    { path: '/api/data/get', handler: 'api_data_get_handler' },
    { path: '/api/data/set', handler: 'api_data_set_handler' },
];

exports.on_destroy = function() {
};

exports.api_app_list_handler = function( req, res ) {
    apps = exports.listApps();
    res.json({ apps: apps });
};

exports.api_reboot_handler = function( req, res ) {
    var spawn = require('child_process').spawn;
    var rebootproc = spawn( '/sbin/shutdown', ['-r', 'now'] );
    rebootproc.addListener( 'exit', function( code, signal ) {
        res.json( { status: 'success' } );
    });        
};

exports.index_handler = function( req, res ) {
    var tmplvars = {};
    tmplvars['static_url'] = exports.settings.staticurl;
    tmplvars['app_name'] = exports.settings.appname;
    tmplvars['app_url'] = exports.settings.appurl;

    res.render( exports.settings.viewpath + '/index', tmplvars );
};

exports.listApps = function() {
    var path = process.cwd(); //root application path. different from __dirname
    var appdir = path + "/apps/";
    var apps = {};
    var files = fs.readdirSync(appdir);
    for ( var x in files ) {
        var filename = files[x];
        var info = fs.statSync( appdir + filename );
        if ( info.isDirectory() ) {
            var appinfo = null;
            var metastat = null;
            try {
                appinfo = fs.statSync( appdir + filename + "/app.js" );
                metastat = fs.statSync( appdir + filename + "/meta.json" );
            } catch ( e ) {
            }
            if ( typeof appinfo !== 'undefined' && appinfo && appinfo.isFile() ) {
                var metainfo = {
                    created: getDateString( new Date() ),
                    modified: getDateString( new Date() ),
                    color: "#1abc9c",
                    author: "",
                    name: "",
                    hidden: false
                };
                try {
                    metafile = JSON.parse(fs.readFileSync( appdir + filename + "/meta.json", 'utf-8' ));
                    metainfo.created = metafile.created;
                    metainfo.modified = metafile.modified;
                    metainfo.color = metafile.color ? metafile.color : metainfo.color;
                    metainfo.author = metafile.author ? metafile.author : metainfo.author;
                    metainfo.name = metafile.name ? metafile.name : metainfo.name;
                    metainfo.hidden = (typeof metafile.hidden !== 'undefined') ? metafile.hidden : metainfo.hidden;
                } catch( e ) {
                }
                apps[filename] = { appname: filename, metadata: metainfo, ctime: metastat.ctime.getTime() };
            }
        }
    }
    return apps;
};

var getDateString = function( d ) {
    var now = new Date();
    var twodigits = function( x ) {
        return x<10 ? '0' + x: x;
    };
    return d.getFullYear() + "-" + twodigits(d.getMonth()+1) + '-' + twodigits(d.getDate());
};
