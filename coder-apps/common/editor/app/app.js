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
        { path: /^\/edit\/(\w+)$/, handler:'index_handler'},
        { path: /^\/api\/getcode\/(\w+)$/, handler:'api_getcode_handler'},
        { path: /^\/api\/media\/list\/(\w+)$/, handler:'api_media_list_handler'},
        { path: /^\/api\/metadata\/get\/(\w+)$/, handler:'api_metadata_get_handler'},
];

exports.post_routes = [
        { path: /^\/api\/savecode\/(\w+)$/, handler:'api_savecode_handler'},
        { path: /^\/api\/savesettings\/(\w+)$/, handler:'api_savesettings_handler'},
        { path: '/api/media/upload', handler:'api_media_upload_handler' },
        { path: '/api/media/remove', handler:'api_media_remove_handler' },
];





exports.index_handler = function( req, res, pathmatches ) {
    var tmplvars = {};
    tmplvars['static_url'] = exports.settings.staticurl;
    tmplvars['app_name'] = exports.settings.appname;
    tmplvars['app_url'] = exports.settings.appurl;
    

    var edit_appname;
    if ( pathmatches && pathmatches[1] != "" ) {
        tmplvars['edit_app_name'] = pathmatches[1];
    } else {
        //TODO: error
        res.end();
        return;
    }

    res.render( exports.settings.viewpath + '/index', tmplvars );
};


exports.api_metadata_get_handler = function( req, res, pathmatches ) {
    var apptoedit = "";
    if ( pathmatches && pathmatches[1] != "" ) {
        apptoedit = pathmatches[1];
    } else {
        //TODO: error
        return;
    }
    
    res.json({
        appname: apptoedit,
        metadata: getMetaInfo( apptoedit )
    });
};

exports.api_getcode_handler = function( req, res, pathmatches ) {

    var path = process.cwd(); //root application path. different from __dirname
    var apptoedit = "";
    if ( pathmatches && pathmatches[1] != "" ) {
        apptoedit = pathmatches[1];
    } else {
        //TODO: error
        return;
    }
    var outdata = {
        htmldata: getFile( path + '/views/apps/' + apptoedit + '/index.html' ),
        jsdata:  getFile(  path + '/static/apps/' + apptoedit + '/js/index.js' ),
        cssdata: getFile( path + '/static/apps/' + apptoedit + '/css/index.css' ),
        appdata: getFile( path + '/apps/' + apptoedit + '/app.js' )
    };

    res.json( outdata );
};

exports.api_media_list_handler = function( req, res, pathmatches ) {
    media = exports.listMedia( pathmatches[1] );
    res.json({ media: media });
};


exports.api_media_remove_handler = function( req, res ) {
    
    var appname = req.param('appname');
    if ( !appname || appname === "" || !appname.match(/^(\w+)$/) ) {
        res.json( {status: 'error', error: "bad app name" } );
        return;
    }

    var fname = req.param('filename');
    if ( !fname || fname === "" || fname === "." || fname === ".." || !fname.match(/^([\w_\-\.])*$/) ) {
        res.json( {status: 'error', error: "bad file name" } );
        return;
    }
    
    var fpath = process.cwd() + '/static/apps/' + appname + '/media/' + fname;
    util.log("MEDIA DELETE: " + fpath );
    err = fs.unlinkSync( fpath );
    if ( !err ) {
        res.json( {status: 'success'} );
    } else {
        res.json( {status: 'error', error: "couldn't delete file"} );
    }
};

exports.api_media_upload_handler = function( req, res ) {
    
    var appname = req.param('appname');
    if ( !appname || appname === "" || !appname.match(/^(\w+)$/) ) {
        res.json( {status: 'error', error: "bad app name" } );
        return;
    }

    if ( req.files && req.files['mediaUpload'] ) {
        var file = req.files.mediaUpload;
        var fname = file.name;
        fname = fname.substr( fname.lastIndexOf('/') + 1);
        fname = fname.replace(/[^\w_\-\.]/g, "_");
        
        if ( fname && fname != "" && fname != "." && fname != ".." ) {
            fs.readFile(file.path, function (err, data) {
                if ( err ) {
                    res.json( {status: 'error', error: "couldn't read file"} );
                    return;
                }
                var path = process.cwd() + '/static/apps/' + appname + '/media/' + fname;
                fs.writeFile(path, data, function (err) {
                    if ( !err ) {
                        res.json({ 
                            status: 'success',
                            filename: fname
                        });
                    } else {
                        res.json( {status: 'error', error: "couldn't save file"} );
                        return;
                    }
                });
            });
        } else {
            res.json( {status: 'error', error: "bad filename"} );
            return;
        }
    } else {
        res.json( {status: 'error', error: "missing attachment" } );
        return;
    }

};


exports.api_savecode_handler = function( req, res, pathmatches ) {
    var path = process.cwd();
    var apptoedit = "";
    if ( pathmatches && pathmatches[1] != "" ) {
        apptoedit = pathmatches[1];
    } else {
        //TODO: error
        return;
    }

    try {
        var datatype = req.param('type');
        var data = req.param('data');
        var err = "";
        
        var metainfo = getMetaInfo(apptoedit);
        try {
            metainfo.modified = getDateString( new Date() );
            //??anything to update from this??
            //var metadata = JSON.parse(req.param('metadata'));
            
        } catch( e ) {
        }
                
        if ( datatype === 'css' ) {
            err = fs.writeFileSync( path + '/static/apps/' + apptoedit + '/css/index.css', data, 'utf8' );
        } else if ( datatype === 'html' ) {
            err = fs.writeFileSync( path + '/views/apps/' + apptoedit + '/index.html', data, 'utf8' );
        } else if ( datatype === 'js' ) {
            err = fs.writeFileSync( path + '/static/apps/' + apptoedit + '/js/index.js', data, 'utf8' );
        } else if ( datatype === 'app' ) {
            err = fs.writeFileSync( path + '/apps/' + apptoedit + '/app.js', data, 'utf8' );
        }

        if ( err && err !== "" ) {
            res.json({
                result: "error",
                type: datatype,
                data: data,
                metadata: metainfo,
                error: err
            });
        }
        

        
        err = fs.writeFileSync( path + '/apps/' + apptoedit + '/meta.json', JSON.stringify(metainfo, null, 4), 'utf8' );
        
        
        if ( err && err !== "" ) {
            res.json({
                result: "metadata error",
                type: datatype,
                data: data,
                metadata: metainfo,
                error: err
            });
        } else {
            res.json({
                result: "saved",
                type: datatype,
                data: data,
                metadata: metainfo,
            });
            
            util.log('app: ' + apptoedit + ' saved. flushing cache.');
            //flush app from cache
            var cached = require.cache[path + '/apps/' + apptoedit + '/app.js'];
            if ( cached ) {
                var theapp = require(path + '/apps/' + apptoedit + '/app');
                if ( theapp.on_destroy ) {
                    theapp.on_destroy();
                }
                delete require.cache[path + '/apps/' + apptoedit + '/app.js'];
            }
        }
                

    } catch ( e ) {
        res.json({
            result: "error saving"
        });
    }   
            

};


exports.api_savesettings_handler = function( req, res, pathmatches ) {
    var path = process.cwd();
    var apptoedit = "";
    if ( pathmatches && pathmatches[1] != "" ) {
        apptoedit = pathmatches[1];
    } else {
        //TODO: error
        return;
    }
    
    var metadata = getMetaInfo( apptoedit );
    var newmetadata = JSON.parse(req.param('metadata'));

    var idchanged = (metadata.name !== newmetadata.name);
    var newappid = apptoedit;
    if ( idchanged ) {
        util.log( "Name Change: " + newmetadata.name );
        newappid = newmetadata.name.toLowerCase();
        newappid = newappid.replace(/\./g, "_");
        newappid = newappid.replace(/[^\w]/g, "_");
        newappid = newappid.replace(/_+/g, "_");
        
        if ( newappid === apptoedit ) {
            idchanged = false;
        } else {
            //this is a real id change
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
        }
    }

    metadata.modified = getDateString( new Date() );
    metadata.color = newmetadata.color;
    metadata.author = newmetadata.author;
    metadata.name = newmetadata.name;

    err = fs.writeFileSync( path + '/apps/' + apptoedit + '/meta.json', JSON.stringify(metadata, null, 4), 'utf8' );

    if ( idchanged && newappid !== "" ) {
        util.log( "APP RENAME: " + apptoedit + " > " + newappid);
        moveProject( apptoedit, newappid );
    }

    res.json({
        metadata: metadata,
        appname: newappid
    });

};


exports.listMedia = function( appname ) {
    var path = process.cwd(); //root application path. different from __dirname
    var mediadir = path + "/static/apps/" + appname + "/media/";
    var media = {};
    var files = fs.readdirSync(mediadir);
    for ( var x in files ) {
        var filename = files[x];
        var info = fs.statSync( mediadir + filename );
        if ( typeof info !== 'undefined' && info && info.isFile() && filename !== '.gitignore' ) {
            var metainfo = {
                created: getDateString( info.mtime ),
                size: info.size,
            };
            
            media[filename] = { filename: filename, metadata: metainfo };
        }
    }
    return media;
};

var moveProject = function( fromid, toid ) {
    var path = process.cwd();
    fs.renameSync( path + "/apps/" + fromid, path + "/apps/" + toid );
    fs.renameSync( path + "/static/apps/" + fromid, path + "/static/apps/" + toid );
    fs.renameSync( path + "/views/apps/" + fromid, path + "/views/apps/" + toid );
};

var getMetaInfo = function( appname ) {
    var appdir = process.cwd() + "/apps/" + appname;
    var metainfo = {
        created: getDateString( new Date() ),
        modified: getDateString( new Date() ),
        color: "#66ddaa",
        author: "",
        name: "",
        hidden: false,
    };
    try {
        metafile = JSON.parse(fs.readFileSync( appdir + "/meta.json", 'utf-8' ));
        metainfo.created = metafile.created;
        metainfo.modified = metafile.modified;
        metainfo.color = metafile.color ? metafile.color : metainfo.color;
        metainfo.author = metafile.author ? metafile.author : metainfo.author;
        metainfo.name = metafile.name ? metafile.name : metainfo.name;
        metainfo.hidden = (typeof metafile.hidden !== 'undefined') ? metafile.hidden : metainfo.hidden;
    } catch( e ) {
    }
    return metainfo;
};

var getFile = function( fpath ) {
    try {
        return fs.readFileSync( fpath, 'utf8' );
    } catch (e) {
        return "";
    }
};

var getDateString = function( d ) {
    var now = new Date();
    var twodigits = function( x ) {
        return x<10 ? '0' + x: x;
    };
    return d.getFullYear() + "-" + twodigits(d.getMonth()+1) + '-' + twodigits(d.getDate());
};
