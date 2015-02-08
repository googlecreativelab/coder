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
var bcrypt = require('bcrypt');

//stores cache of password hash and device name
var device_settings = {
    password_hash: '',
    device_name: '',
    hostname: '',
    coder_owner: '',
    coder_color: '#3e3e3e'
};


exports.settings={};
//These are dynamically updated by the runtime
//settings.appname - the app id (folder) where your app is installed
//settings.viewpath - prefix to where your view html files are located
//settings.staticurl - base url path to static assets /static/apps/appname
//settings.appurl - base url path to this app /app/appname
//settings.device_name - name the user gave to their coder "Susie's Coder"


exports.get_routes = [
    { path:'/', handler:'index_handler'},
    { path:'/login', handler:'login_handler'},
    { path:'/logout', handler:'logout_handler'},
    { path:'/configure', handler:'configure_handler'},
    { path:'/addpassword', handler:'addpassword_handler'},
    { path:'/changepassword', handler:'changepassword_handler'},
    { path: '/api/devicename/get', handler: 'api_devicename_get_handler' },
    { path: '/api/codercolor/get', handler: 'api_codercolor_get_handler' },
    { path: '/api/coderowner/get', handler: 'api_coderowner_get_handler' }
];


exports.post_routes = [
    { path: '/api/login', handler: 'api_login_handler' },
    { path: '/api/logout', handler: 'api_logout_handler' },
    { path: '/api/devicename/set', handler: 'api_devicename_set_handler' },
    { path: '/api/codercolor/set', handler: 'api_codercolor_set_handler' },
    { path: '/api/coderowner/set', handler: 'api_coderowner_set_handler' },
    { path: '/api/addpassword', handler: 'api_addpassword_handler' },
    { path: '/api/changepassword', handler: 'api_changepassword_handler' }
];

exports.on_destroy = function() {
};


exports.isAuthenticated = function( req ) {
    if ( typeof req.session !== 'undefined' && typeof req.session.authenticated !== 'undefined' ) {
        return req.session.authenticated === true;
    }
    return false;
};

exports.isConfigured = function() {
    if ( typeof device_settings.device_name !== 'undefined' && device_settings.device_name !== '' &&
            typeof device_settings.hostname !== 'undefined' && device_settings.hostname !== '' ) {
        return true;
    } else {
        return false;
    }
};

exports.hasPassword = function() {
    if ( typeof device_settings.password_hash !== 'undefined' && device_settings.password_hash !== '' ) {
        return true;
    } else {
        return false;
    }
};

exports.getDeviceName = function() {
    return device_settings.device_name;
};
exports.getCoderOwner = function() {
    return device_settings.coder_owner;
};
exports.getCoderColor = function() {
    return device_settings.coder_color;
};

exports.authenticate = function( req, password ) {

    var authenticated = bcrypt.compareSync( password, device_settings.password_hash );
    if ( authenticated ) {
        req.session.authenticated = true;
    }

    return authenticated;
};

exports.logout = function( req ) {
    
    req.session.authenticated = false;
};


exports.index_handler = function( req, res ) {
    
    var firstuse = "?firstuse";
    if ( typeof( req.param('firstuse') ) === 'undefined' ) {
        firstuse = "";
    }
    
    if ( !exports.isConfigured() ) {
        res.redirect('/app/auth/configure?firstuse');
    } else if ( !exports.hasPassword() ) {
        res.redirect('/app/auth/addpassword?firstuse');
    } else if ( !exports.isAuthenticated(req) ) {
        res.redirect('/app/auth/login' + firstuse);
    } else {
        res.redirect('/app/coder' + firstuse);
    }
};

exports.addpassword_handler = function( req, res ) {
    var tmplvars = {};
    tmplvars['static_url'] = exports.settings.staticurl;
    tmplvars['app_name'] = exports.settings.appname;
    tmplvars['app_url'] = exports.settings.appurl;
    tmplvars['device_name'] = exports.settings.device_name;
    tmplvars['page_mode'] = "addpassword";
    
    //only allow this step if they have not yet set a password
    if ( !exports.hasPassword() ) {
        res.render( exports.settings.viewpath + '/index', tmplvars );
    } else {
        res.redirect('/app/auth/login');
    }
};

exports.changepassword_handler = function( req, res ) {
    var tmplvars = {};
    tmplvars['static_url'] = exports.settings.staticurl;
    tmplvars['app_name'] = exports.settings.appname;
    tmplvars['app_url'] = exports.settings.appurl;
    tmplvars['device_name'] = exports.settings.device_name;
    tmplvars['page_mode'] = "changepassword";
    
    //only allow this step if they are authenticated
    if ( exports.isAuthenticated(req) ) {
        res.render( exports.settings.viewpath + '/index', tmplvars );
    } else {
        res.redirect('/app/auth/login');
    }
};

exports.configure_handler = function( req, res ) {
    var tmplvars = {};
    tmplvars['static_url'] = exports.settings.staticurl;
    tmplvars['app_name'] = exports.settings.appname;
    tmplvars['app_url'] = exports.settings.appurl;
    tmplvars['device_name'] = exports.settings.device_name;
    tmplvars['page_mode'] = "configure";
    
    //only allow this step if they are authenticated or have not yet set a password
    if ( exports.isAuthenticated(req) || !exports.hasPassword() ) {
        res.render( exports.settings.viewpath + '/index', tmplvars );
    } else {
        res.redirect('/app/auth/login');
    }
};

exports.api_devicename_get_handler = function( req, res ) {
    res.json({
        device_name: exports.getDeviceName()
    });
};
exports.api_codercolor_get_handler = function( req, res ) {
    res.json({
        coder_color: exports.getCoderColor()
    });
};
exports.api_coderowner_get_handler = function( req, res ) {
    //only allow this step if they are authenticated or have not yet set a password
    if ( !exports.isAuthenticated(req) && exports.hasPassword() ) {
        res.json({
            status: "error",
            error: "not authenticated"
        });
        return;
    }
    res.json({
        coder_owner: exports.getCoderOwner()
    });
};

exports.api_devicename_set_handler = function( req, res ) {

    //only allow this step if they are authenticated or have not yet set a password
    if ( !exports.isAuthenticated(req) && exports.hasPassword() ) {
        res.json({
            status: "error",
            error: "not authenticated"
        });
        return;
    }

    var devicename = req.param('device_name');
    if ( !devicename || devicename === "" || !isValidDeviceName( devicename ) ) {
        res.json({
            status: 'error', 
            error: "invalid device name" 
        });
        return;
    }

    device_settings.device_name = devicename;
    device_settings.hostname = hostnameFromDeviceName( devicename );
    
    err = saveDeviceSettings();

    if ( !err ) {
        res.json({
            status: "success",
            device_name: device_settings.device_name,
            hostname: device_settings.hostname
        });
    } else {
        res.json({
            status: "error",
            error: "could not save device settings"
        });
    }
    
};


exports.api_coderowner_set_handler = function( req, res ) {

    //only allow this step if they are authenticated or have not yet set a password
    if ( !exports.isAuthenticated(req) && exports.hasPassword() ) {
        res.json({
            status: "error",
            error: "not authenticated"
        });
        return;
    }

    var owner = req.param('coder_owner');
    if ( typeof owner === 'undefined' ) {
        res.json({
            status: 'error', 
            error: "invalid owner name" 
        });
        return;
    }

    device_settings.coder_owner = owner;
    
    err = saveDeviceSettings();

    if ( !err ) {
        res.json({
            status: "success",
            coder_owner: device_settings.coder_owner
        });
    } else {
        res.json({
            status: "error",
            error: "could not save device settings"
        });
    }
    
};

exports.api_codercolor_set_handler = function( req, res ) {

    //only allow this step if they are authenticated or have not yet set a password
    if ( !exports.isAuthenticated(req) && exports.hasPassword() ) {
        res.json({
            status: "error",
            error: "not authenticated"
        });
        return;
    }

    var color = req.param('coder_color');
    if ( typeof color === 'undefined' || !isValidColor( color ) ) {
        res.json({
            status: 'error', 
            error: "invalid color" 
        });
        return;
    }

    device_settings.coder_color = color;
    
    err = saveDeviceSettings();

    if ( !err ) {
        res.json({
            status: "success",
            coder_color: device_settings.coder_color
        });
    } else {
        res.json({
            status: "error",
            error: "could not save device settings"
        });
    }
    
};

exports.api_addpassword_handler = function( req, res ) {

    //only allow this step if they have not yet set a password
    if ( exports.hasPassword() ) {
        res.json({
            status: "error",
            error: "not authenticated"
        });
        return;
    }

    var pass = req.param('password');
    if ( !pass || pass === "" || !isValidPassword( pass ) ) {
        res.json({
            status: 'error', 
            error: getPasswordProblem( pass ) 
        });
        return;
    }

    var spawn = require('child_process').spawn;
    var err=0;
    //device_settings.device_name = devicename;
    var erroutput = "";
    var output = "";
    var setpipass = process.cwd() + '/sudo_scripts/setpipass';
    var setpass = spawn( '/usr/bin/sudo', [setpipass] );
    setpass.stdout.on( 'data', function( d ) {
        output += d;
    });
    setpass.stderr.on( 'data', function( d ) {
        erroutput += d;
    });

    setpass.addListener( 'exit', function( code, signal ) {
        err = code;
        
        
        if ( err ) {
            res.json({
                status: "error",
                error: erroutput
            });
            return;
        }

        //TODO - Load hashed password
        var s = bcrypt.genSaltSync(10);
        var h = bcrypt.hashSync( pass, s );
        util.log("PASSWORD INITIALIZED");
        device_settings.password_hash = h;
        err = saveDeviceSettings();
    
        if ( !err ) {
            res.json({
                status: "success"
            });
        } else {
            res.json({
                status: "error",
                error: "Could not save device settings."
            });
        }
        
    });
    setpass.stdin.write(pass + '\n');
    setpass.stdin.write(pass + '\n');
    setpass.stdin.end();

};



exports.api_changepassword_handler = function( req, res ) {

    //only allow this step if they are authenticated
    if ( !exports.isAuthenticated(req) ) {
        res.json({
            status: "error",
            error: "not authenticated"
        });
        return;
    }

    var oldpass = req.param('oldpassword');
    var pass = req.param('password');
    
    //Make sure old pass is set and matches
    if ( typeof oldpass === 'undefined' || oldpass === "" 
            || !bcrypt.compareSync( oldpass, device_settings.password_hash ) ) {
        res.json({
            status: 'error', 
            error: "old password was incorrect" 
        });
        return;
    }
    
    if ( !pass || pass === "" || !isValidPassword( pass ) ) {
        res.json({
            status: 'error', 
            error: getPasswordProblem( pass ) 
        });
        return;
    }

    var spawn = require('child_process').spawn;
    var err=0;
    //device_settings.device_name = devicename;
    var erroutput = "";
    var output = "";
    var setpipass = process.cwd() + '/sudo_scripts/setpipass';
    var setpass = spawn( '/usr/bin/sudo', [setpipass] );
    setpass.stdout.on( 'data', function( d ) {
        output += d;
    });
    setpass.stderr.on( 'data', function( d ) {
        erroutput += d;
    });

    setpass.addListener( 'exit', function( code, signal ) {
        err = code;
        
        
        if ( err ) {
            res.json({
                status: "error",
                error: erroutput
            });
            return;
        }

        //TODO - Load hashed password
        var s = bcrypt.genSaltSync(10);
        var h = bcrypt.hashSync( pass, s );
        util.log("PASSWORD INITIALIZED");
        device_settings.password_hash = h;
        err = saveDeviceSettings();
    
        if ( !err ) {
            res.json({
                status: "success"
            });
        } else {
            res.json({
                status: "error",
                error: "Could not save device settings."
            });
        }
        
    });
    setpass.stdin.write(pass + '\n');
    setpass.stdin.write(pass + '\n');
    setpass.stdin.end();

};


exports.login_handler = function( req, res ) {
    var tmplvars = {};
    tmplvars['static_url'] = exports.settings.staticurl;
    tmplvars['app_name'] = exports.settings.appname;
    tmplvars['app_url'] = exports.settings.appurl;
    tmplvars['device_name'] = exports.settings.device_name;
    tmplvars['page_mode'] = "login";
    

    //TODO - should this log you out automatically?
    req.session.authenticated = false;
    res.render( exports.settings.viewpath + '/index', tmplvars );
};

exports.logout_handler = function( req, res ) {
    var tmplvars = {};
    tmplvars['static_url'] = exports.settings.staticurl;
    tmplvars['app_name'] = exports.settings.appname;
    tmplvars['app_url'] = exports.settings.appurl;
    tmplvars['device_name'] = exports.settings.device_name;
    tmplvars['page_mode'] = "logout";

    req.session.authenticated = false;
    res.render( exports.settings.viewpath + '/index', tmplvars );
};

exports.api_login_handler = function( req, res ) {
    if ( typeof req.body.password !== 'undefined' && req.body.password !== "" ) {
        var authenticated = exports.authenticate( req, req.body.password );
        if ( authenticated === true ) {
            res.json( { status: 'success'} );
            return;
        }
    } 
    res.json( { 
        status: 'error',
        error: 'invalid password'
    } );
};
exports.api_logout_handler = function( req, res ) {
    req.session.authenticated = false;

    res.json( { status: 'success'} );
};

var saveDeviceSettings = function() {
    err = fs.writeFileSync( process.cwd() + "/device.json", JSON.stringify(device_settings, null, 4), 'utf8' );
    fs.chmodSync(process.cwd() + '/device.json', '600');
    return err;
};

var reloadDeviceSettings = function() {
    var settings = {
        password_hash: '',
        device_name: '',
        hostname: '',
        coder_owner: '',
        coder_color: ''
    };
    
    var loadedsettings = JSON.parse(fs.readFileSync( process.cwd() + "/device.json", 'utf-8' ));
    settings.password_hash = ( typeof loadedsettings.password_hash !== 'undefined' && loadedsettings.password_hash !== '' ) ? loadedsettings.password_hash : settings.password_hash;
    settings.device_name = ( typeof loadedsettings.device_name !== 'undefined' && loadedsettings.device_name !== '' ) ? loadedsettings.device_name : settings.device_name;
    settings.hostname = ( typeof loadedsettings.hostname !== 'undefined' && loadedsettings.hostname !== '' ) ? loadedsettings.hostname : settings.hostname;
    settings.coder_owner = ( typeof loadedsettings.coder_owner !== 'undefined' && loadedsettings.coder_owner !== '' ) ? loadedsettings.coder_owner : settings.coder_owner;
    settings.coder_color = ( typeof loadedsettings.coder_color !== 'undefined' && loadedsettings.coder_color !== '' ) ? loadedsettings.coder_color : settings.coder_color;
    
    device_settings = settings;
}
reloadDeviceSettings();


var isValidDeviceName = function( name ) {
    if ( !name || name === '' ) {
        return false;
    }
    //starts with an ascii word char. can contain word char's spaces and '
    if ( !name.match(/^[a-zA-Z0-9][\w ']*$/) ) {
        return false;
    }
    //ends in an ascii word char
    if ( !name.match(/[a-zA-Z0-9]$/) ) {
        return false;
    }
    return true;
};
var hostnameFromDeviceName = function( name ) {
    var hostname = name;
    hostname = hostname.toLowerCase();
    hostname = hostname.replace(/[^a-z0-9\- ]/g, '');
    hostname = hostname.replace(/[\- ]+/g,'-');
    return hostname;
};

var getPasswordProblem = function( pass ) {
    if ( !pass || pass === '' ) {
        return "the password is empty";
    }
    if ( pass.length < 6 ) {
        return "the password should contain at least 6 characters";
    }
    if ( !pass.match(/[a-z]/) || 
        !pass.match(/[A-Z0-9\-\_\.\,\;\:\'\"\[\]\{\}\!\@\#\$\%\^\&\*\(\)\\].*[A-Z0-9\-\_\.\,\;\:\'\"\[\]\{\}\!\@\#\$\%\^\&\*\(\)\\]/) ) {
        return "your password must contain a lower case letter and at least two upper case letters or numbers";
    }
};

var isValidPassword = function( pass ) {
    if ( !pass || pass === '' ) {
        return false;
    }
    //at least 6 characters
    if ( pass.length < 6 ) {
        return false;
    }
    //contains lower case
    if ( !pass.match(/[a-z]/) ) {
        return false;
    }
    //contains two upper case or numbers
    if ( !pass.match(/[A-Z0-9\-\_\.\,\;\:\'\"\[\]\{\}\!\@\#\$\%\^\&\*\(\)\\].*[A-Z0-9\-\_\.\,\;\:\'\"\[\]\{\}\!\@\#\$\%\^\&\*\(\)\\]/) ) {
        return false;
    }
    return true;
};

var isValidColor = function( color ) {
    if ( !color || color === '' ) {
        return false;
    }
    color = color.toLowerCase();
    if ( !color.match(/^\#[a-f0-9]{6}$/) ) {
        return false;
    }
    return true;
}




