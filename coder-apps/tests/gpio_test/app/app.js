var gpio = require("gpio");
gpio.logging = true;

var gpioID = 4; //actually pin 7, 4 down on left header
var gpioDevice;
var connected = false; //ensure only one process talks to us at a time.

exports.settings={};
//These are dynamically updated by the runtime
//settings.appname - the app id (folder) where your app is installed
//settings.viewpath - prefix to where your view html files are located
//settings.staticurl - base url path to static assets /static/apps/appname
//settings.appurl - base url path to this app /app/appname
//settings.device_name - name given to this coder by the user, Ie."Billy's Coder"
//settings.coder_owner - name of the user, Ie. "Suzie Q."
//settings.coder_color - hex css color given to this coder.

exports.get_routes = [
    { path:'/', handler:'index_handler' },
];

exports.post_routes = [
];

exports.socketio_routes = [
    { key:'connect', handler:'on_socket_connect' },
    { key:'gpio', handler:'on_socket_gpio' },
];


var connections = {};

exports.index_handler = function( req, res ) {
    var tmplvars = {};
    tmplvars['static_url'] = exports.settings.staticurl;
    tmplvars['app_name'] = exports.settings.appname;
    tmplvars['app_url'] = exports.settings.appurl;
    tmplvars['device_name'] = exports.settings.device_name;

    res.render( exports.settings.viewpath + '/index', tmplvars );
};


var enableGPIO = function() {
    console.log("Enabling GPIO " + gpioID );
    gpioDevice = gpio.export( gpioID, {
        ready: function() {
            //Pause briefly after pin is exported.
            //There seems to be an error if you try to immediately access it.
            setTimeout( function() {
                console.log("GPIO  value: on");
                gpioDevice.setDirection("out");
                gpioDevice.set(1, function() {
                    console.log("GPIO should be on");
                });
                //blinkLED();
            }, 100 );
        }
    });
};
var disableGPIO = function() {
    console.log("Disabling GPIO" + gpioID );
    gpioDevice.removeAllListeners();
    gpioDevice.reset();
    gpioDevice.unexport();
};

var ledval = 0;
var blinkLED = function() {
    if ( !connected ) {
        return;
    }
    
    gpioDevice.set( ledval );
    if ( ledval == 0 ) {
        ledval = 1;
    } else {
        ledval = 0;
    }

    //run this method again after half a second
    setTimeout( blinkLED, 500 );
};



exports.on_socket_connect = function( socket, data ) {
    console.log( 'socket connect from ID: ' + socket.socketID );
    console.log( data );
    
    if ( !connected ) {
        enableGPIO();
        connected = true;
    }
    
    connections[socket.socketID] = {
        socket: socket,
        name: data.name,
        id: socket.socketID
    };
    socket.on('disconnect', function() {
        console.log( 'socket disconnect from ID: ' + socket.socketID );
        delete connections[socket.socketID];
        
        //Free up the GPIO when the last socket disconnects
        if ( Object.keys( connections ).length <= 0 ) {
            disableGPIO();
            connected = false;
        }
    });
    
};


exports.on_socket_gpio = function( socket, data ) {
    switch (data.command) {
        case "set":
            setGPIO( data.value );
            break;
        case "direction":
            setDirection( data.direction );
            break;
        case "value":
            sendValue( socket );
            break;
    }
};

var setGPIO = function( val ) {
    val = parseInt( val );
    if ( val != 0 ) {
        val = 1;
    }
    gpioDevice.set( val );
};
var setDirection = function( dir ) {
    if ( dir !== "in") {
        dir = "out";
    }
    gpioDevice.setDirection( dir );
};
var sendValue = function( socket ) {
    socket.emit( "apdata", {
        key: "gpiovalue",
        data: gpioDevice.value
    });
};

exports.on_destroy = function() {
};

