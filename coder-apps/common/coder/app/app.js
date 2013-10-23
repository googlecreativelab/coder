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
var spawn = require('child_process').spawn;

//hack to make fs.existsSync work between different node versions
if ( !fs.existsSync ) {
    var path = require('path');
    fs.existsSync = path.existsSync;
}

exports.settings={};
//These are dynamically updated by the runtime
//settings.appname - the app id (folder) where your app is installed
//settings.viewpath - prefix to where your view html files are located
//settings.staticurl - base url path to static assets /static/apps/appname
//settings.appurl - base url path to this app /app/appname
//settings.device_name
//settings.coder_owner
//settings.coder_color

exports.get_routes = [
    { path:'/', handler:'index_handler' },
    { path: /^\/export\/download\/(\w+\.zip)$/, handler:'export_download_handler' },
];


exports.post_routes = [
    { path: '/api/app/create', handler:'api_app_create_handler' },
    { path: /^\/api\/app\/remove\/(\w+)$/, handler:'api_app_remove_handler' },
    { path: /^\/api\/app\/export\/(\w+)$/, handler:'api_app_export_handler' },
    { path: /^\/api\/app\/import$/, handler:'api_app_import_handler' },
];

exports.on_destroy = function() {
};

exports.index_handler = function( req, res ) {
    var tmplvars = {};
    tmplvars['static_url'] = exports.settings.staticurl;
    tmplvars['app_name'] = exports.settings.appname;
    tmplvars['app_url'] = exports.settings.appurl;
    tmplvars['device_name'] = exports.settings.device_name;
    tmplvars['coder_color'] = exports.settings.coder_color;
    tmplvars['coder_owner'] = exports.settings.coder_owner;

    res.render( exports.settings.viewpath + '/index', tmplvars );
};

var getAppIDFromTitle = function( apptitle ) {
    var newappid = apptitle.toLowerCase();
    newappid = newappid.replace(/\./g, "_");
    newappid = newappid.replace(/[^\w]/g, "_");
    newappid = newappid.replace(/_+/g, "_");
    return newappid;
};

var getAvailableNewAppID = function( newappid ) {
    //scan for an available id if this one exists already
    var idavailable = false;
    var iteration = 0;
    var appdir = process.cwd() + "/apps/";
    var allfiles = fs.readdirSync(appdir);
    while ( !idavailable ) {
        var potential = newappid;
        if ( iteration > 0 ) {
            potential = potential + '_' + iteration;
        }
        if ( allfiles.indexOf( potential ) >= 0 ) {
            iteration++;
        } else {
            newappid = potential;
            idavailable = true;
        }
    }
    return newappid;
};

exports.api_app_create_handler = function( req, res ) {

    var apptitle = req.param('app_title');
    var appcolor = req.param('app_color');
    
    if ( typeof apptitle === 'undefined' || apptitle === "" 
            || typeof appcolor === 'undefined' || appcolor === "" ) {
        res.json({
            status: 'error',
            error: 'invalid parameters'
        });
        return;
    }

    var newappid = getAppIDFromTitle( apptitle );
    
    if ( newappid === "" ) {
        res.json({
            status: 'error',
            error: 'invalid app id'
        });
    }

    newappid = getAvailableNewAppID( newappid );
    
    buildFolderStructure( newappid );
    cloneApp( 'boilerplate', newappid );

    var metainfo = {
        created: getDateString( new Date() ),
        modified: getDateString( new Date() ),
        color: appcolor,
        author: exports.settings.coder_owner,
        name: apptitle,
        hidden: false,
    };
    var metapath = process.cwd() + '/apps/' + newappid + '/meta.json';
    fs.writeFileSync(  metapath, JSON.stringify(metainfo, null, 4), 'utf8' );

    res.json({
        status: 'success',
        appname: newappid
    });

};

exports.export_download_handler = function( req, res, pathmatches ) {

    var exportname = "export.zip";
    if ( pathmatches && pathmatches[1] !== "" ) {
        exportname = pathmatches[1];
    } else {
        res.json({
            status: 'error',
            error: 'invalid parameters'
        });
        return;
    }

    var exportfile = 'appexport.zip';
    var path = process.cwd();
    if ( !fs.existsSync( path + '/tmp/' + exportfile ) ) {
        res.json({
            status: "error",
            error: "Export file doesn't exist"
        });
        return;        
    }
    
    res.download( path + '/tmp/' + exportfile, exportname );
    
    
};


exports.api_app_import_handler = function( req, res, pathmatches ) {

    if ( !req.files || !req.files['import_file'] ) {
        res.json({
            status: 'error',
            error: 'invalid parameters'
        });
        return;
    }

    if ( !req.files['import_file'].type == 'application/zip' ) {
        res.json({
            status: 'error',
            error: 'invalid file type'
        });
        return;
    }

    var path = process.cwd();
    var success = true;
    var importkey = 'appimport'; //TODO: maybe this should be random and auto-cleaned
    var tmpfolder = path + '/tmp/' + importkey;
    try { forceRemoveDir( tmpfolder ); } catch (e) {}
    try { fs.mkdirSync( tmpfolder ); } catch (e) { success = false; }


    var completeImport = function() {

        if ( !fs.existsSync( tmpfolder + '/app/meta.json' ) 
                || !fs.existsSync( tmpfolder + '/app/app.js') 
                || !fs.existsSync( tmpfolder + '/views/index.html') 
                || !fs.existsSync( tmpfolder + '/static/css/index.css') 
                || !fs.existsSync( tmpfolder + '/static/js/index.js') ) {

            res.json({
                status: "error",
                error: "Invalid application bundle"
            });
            return;        
        }


        var importfile = fs.readFileSync( tmpfolder + '/app/meta.json', 'utf-8' );
        var importinfo = JSON.parse(importfile);
        
        if ( !importinfo || !importinfo.color  
                || typeof(importinfo.author) === 'undefined' || !importinfo.name 
                || !importinfo.created || !importinfo.modified ) {

            res.json({
                status: "error",
                error: "invalid project file"
            });
            return;
        }


        var metainfo = {
            created: importinfo.created,
            modified: importinfo.modified,
            color: importinfo.color,
            author: importinfo.author,
            name: importinfo.name,
            hidden: false,
        };

        var newappid = getAppIDFromTitle( metainfo.name );
        if ( newappid === "" ) {
            res.json({
                status: 'error',
                error: 'invalid app id'
            });
        }
        newappid = getAvailableNewAppID( newappid );
        buildFolderStructure( newappid );

        //app meta.json file
        var metapath = process.cwd() + '/apps/' + newappid + '/meta.json';
        fs.writeFileSync(  metapath, JSON.stringify(metainfo, null, 4), 'utf8' );
    
        //app node.js file
        copyFile( tmpfolder + '/app/app.js', path + '/apps/' + newappid + '/app.js' );
        //html view
        copyFile( tmpfolder + '/views/index.html', path + '/views/apps/' + newappid + '/index.html' );
        //css data
        copyFile( tmpfolder + '/static/css/index.css', path + '/static/apps/' + newappid + '/css/index.css' );
        //index.js file
        copyFile( tmpfolder + '/static/js/index.js', path + '/static/apps/' + newappid + '/js/index.js' );
       
        var mediadir = tmpfolder + '/static/media/';
        var mediafiles = fs.readdirSync( mediadir );
        for ( var x in mediafiles ) {
            var filename = mediafiles[x];
            var info = fs.statSync( mediadir + filename );
            if ( typeof info !== 'undefined' && info && info.isFile() ) {
                copyFile( mediadir + filename, path + "/static/apps/" + newappid + "/media/" + filename );
            }
        }


        res.json({
            status: "success",
            name: metainfo.name,
            appname: newappid
        });
    };


    var uploadPath = tmpfolder + '/appimport.zip';
    fs.readFile(req.files['import_file'].path, function (err, data) {
        fs.writeFile(uploadPath, data, function (err) {
            
            var unzip = spawn('unzip', ['appimport.zip'], { cwd: tmpfolder });
            unzip.stdout.on('data', function (data) {
            });
            unzip.stderr.on('data', function (data) {
            });
            unzip.on('exit', function (code) {
                if(code !== 0) {
                    res.json({
                        status: "error",
                        error: "unzip error: " + code
                    });
                } else {                    
                    completeImport();
                }
            });
            
        });
    });



};

exports.api_app_export_handler = function( req, res, pathmatches ) {
	
    var apptoexport = "";
    if ( pathmatches && pathmatches[1] !== "" ) {
        apptoexport = pathmatches[1];
    } else {
        res.json({
            status: 'error',
            error: 'invalid parameters'
        });
        return;
    }

    var path = process.cwd();
    if ( !fs.existsSync( path + '/apps/' + apptoexport + '/app.js' ) ) {
        res.json({
            status: "error",
            error: "Application doesn't exist"
        });
        return;        
    }
    
    var success = true;
    var exportkey = 'appexport'; //TODO: maybe this should be random and auto-cleaned
    var tmpfolder = path + '/tmp/' + exportkey;
    try { forceRemoveDir( tmpfolder ); } catch (e) {}
    try { fs.unlinkSync( path + '/tmp/' + exportkey + '.zip' ); } catch (e) {}
    try { fs.mkdirSync( tmpfolder ); } catch (e) { success = false; }
    try { fs.mkdirSync( tmpfolder + '/app' ); } catch (e) { success = false; }
    try { fs.mkdirSync( tmpfolder + '/static' ); } catch (e) { success = false; }
    try { fs.mkdirSync( tmpfolder + '/static/css' ); } catch (e) { success = false; }
    try { fs.mkdirSync( tmpfolder + '/static/js' ); } catch (e) { success = false; }
    try { fs.mkdirSync( tmpfolder + '/static/media' ); } catch (e) { success = false; }
    try { fs.mkdirSync( tmpfolder + '/views' ); } catch (e) { success = false; }
    
    if ( !success ) {
        res.json({
            status: "error",
            error: "Cannot create export directory."
        });
        return;        
    }
    
    
    //app node.js file
    copyFile( path + '/apps/' + apptoexport + '/app.js', tmpfolder + '/app/app.js' );
    //app meta.json file
    copyFile( path + '/apps/' + apptoexport + '/meta.json', tmpfolder + '/app/meta.json' );
    //html view
    copyFile( path + '/views/apps/' + apptoexport + '/index.html', tmpfolder + '/views/index.html' );
    //css data
    copyFile( path + '/static/apps/' + apptoexport + '/css/index.css', tmpfolder + '/static/css/index.css' );
    //index.js file
    copyFile( path + '/static/apps/' + apptoexport + '/js/index.js', tmpfolder + '/static/js/index.js' );
   
    var mediadir = path + "/static/apps/" + apptoexport + "/media/";
    var mediafiles = fs.readdirSync( mediadir );
    for ( var x in mediafiles ) {
        var filename = mediafiles[x];
        var info = fs.statSync( mediadir + filename );
        if ( typeof info !== 'undefined' && info && info.isFile() ) {
            copyFile( mediadir + filename, tmpfolder + '/static/media/' + filename );
        }
    }

    var zip = spawn('zip', ['-r', '../appexport.zip', '.', '-i', '*'], { cwd: tmpfolder });
    zip.stdout.on('data', function (data) {
        //console.log('coder::api_app_export_handler zip: ' + data );
    });
    zip.stderr.on('data', function (data) {
        //console.log('coder::api_app_export_handler zip error: ' + data );
    });
    zip.on('exit', function (code) {
        if(code !== 0) {
            res.json({
                status: "error",
                error: "zip error: " + code
            });
        } else {
            res.json({
                status: "success",
                file: apptoexport + ".zip"
            });
        }
    });

};

exports.api_app_remove_handler = function( req, res, pathmatches ) {
    var apptoremove = "";
    if ( pathmatches && pathmatches[1] !== "" ) {
        apptoremove = pathmatches[1];
    } else {
        res.json({
            status: 'error',
            error: 'invalid parameters'
        });
        return;
    }

    var path = process.cwd();
    if ( !fs.existsSync( path + '/apps/' + apptoremove + '/app.js' ) ) {
        res.json({
            status: "error",
            error: "Application doesn't exist"
        });
        return;        
    }
    
    try { forceRemoveDir( path + '/static/apps/' + apptoremove ); } catch (e) {}
    try { forceRemoveDir( path + '/views/apps/' + apptoremove ); } catch (e) {}
    try { forceRemoveDir( path + '/apps/' + apptoremove ); } catch (e) {}

    res.json({
        status: "success",
        data: "Application " + apptoremove + " removed."
    });

};


var copyFile = function( from, to ) {
    //cpdata = fs.readFileSync( from, 'utf-8' );
    //fs.writeFileSync( to, cpdata, 'utf-8' );
    cpdata = fs.readFileSync( from );
    fs.writeFileSync( to, cpdata );
};


var buildFolderStructure = function( appid ) {
    var path = process.cwd();
    var success = true;
    try { fs.mkdirSync( path + '/static/apps/' + appid ); } catch (e) { success = false; }
    try { fs.mkdirSync( path + '/static/apps/' + appid + '/css' ); } catch (e) { success = false; }
    try { fs.mkdirSync( path + '/static/apps/' + appid + '/js' ); } catch (e) { success = false; }
    try { fs.mkdirSync( path + '/static/apps/' + appid + '/media' ); } catch (e) { success = false; }
    try { fs.mkdirSync( path + '/views/apps/' + appid ); } catch (e) { success = false; }
    try { fs.mkdirSync( path + '/apps/' + appid ); } catch (e) { success = false; }
    return success;
};

var cloneApp = function( fromapp, toapp ) {
    var path = process.cwd();
    var cpdata = "";

    //app node.js file
    copyFile( path + '/apps/' + fromapp + '/app.js', path + '/apps/' + toapp + '/app.js' );
    //html view
    copyFile( path + '/views/apps/' + fromapp + '/index.html', path + '/views/apps/' + toapp + '/index.html' );
    //css data
    copyFile( path + '/static/apps/' + fromapp + '/css/index.css', path + '/static/apps/' + toapp + '/css/index.css' );
    //index.js file
    copyFile( path + '/static/apps/' + fromapp + '/js/index.js', path + '/static/apps/' + toapp + '/js/index.js' );

    //TODO: not currently cloning anything in media directory.
};


var getDateString = function( d ) {
    var now = new Date();
    var twodigits = function( x ) {
        return x<10 ? '0' + x: x;
    };
    return d.getFullYear() + "-" + twodigits(d.getMonth()+1) + '-' + twodigits(d.getDate());
};

//recursively delete a directory
var forceRemoveDir = function( path ) {
    util.log( 'PURGING ' + path );
    try {
        var contents = fs.readdirSync(path); 
        for (var i = 0; i < contents.length; i++) {
            var fp = path + "/" + contents[i];
            if ( fs.statSync( fp ).isDirectory() ) {
                forceRemoveDir( fp );
            } else {
                //util.log( 'delete ' + fp );
                fs.unlinkSync( fp );
            }
        }
    }
    catch(e) 
    { 
    }
    //util.log( 'remove directory ' + path );
    fs.rmdirSync( path );
};
