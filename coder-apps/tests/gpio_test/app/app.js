var gpio = require("gpio");
gpio.logging = true;


// The gpio ids we're using. Note that these aren't the pin numbers, but
// the IDs exposed by the Pi. Search for Pi GPIO pinout for details.
var ledGPIOID = 4; //actually pin 7, 4 down on left header
var buttonGPIOID = 17;

// Handles for our connected gpio devices
var ledDevice;
var buttonDevice;

// A collection of all connected sockets.
// Maps socketid => { socket: sockethandle, id: socketid }
var connections = {};

exports.settings={};
//These are dynamically updated by the runtime
//settings.appname - the app id (folder) where your app is installed
//settings.viewpath - prefix to where your view html files are located
//settings.staticurl - base url path to static assets /static/apps/appname
//settings.appurl - base url path to this app /app/appname
//settings.device_name - name given to this coder by the user, Ie."Billy's Coder"
//settings.coder_owner - name of the user, Ie. "Suzie Q."
//settings.coder_color - hex css color given to this coder.

// Incoming get routes that our app knows how to respond to
exports.get_routes = [
    { path:'/', handler:'index_handler' }, // Render out main html page
];

// Incoming post routes that our app knows how to respond to
// (None in this example)
exports.post_routes = [
];

// Incoming socket events that this module will expose.
exports.socketio_routes = [
    { key:'connect', handler:'on_socket_connect' }, // sent by client once socket is loaded
    { key:'setled', handler:'on_socket_setled' }, // sent by client to turn on/off the led
];



//
// Handles sending the HTML page to the browser
//
exports.index_handler = function( req, res ) {
    // Set up some template variables that are substituted in our HTML.
    // Look in the HTML head tag to see where these are inserted.
    var tmplvars = {};
    tmplvars['static_url'] = exports.settings.staticurl;
    tmplvars['app_name'] = exports.settings.appname;
    tmplvars['app_url'] = exports.settings.appurl;
    tmplvars['device_name'] = exports.settings.device_name;

    // Send the HTML document to the web browser.
    res.render( exports.settings.viewpath + '/index', tmplvars );
};


//
// Respond to the "connect" message sent by a new socket client.
//
// We do two things here:
// 1. save the socket object into the "connections" variable so we can talk to it later.
// 2. initialize the GPIO pins if this is the first time a socket has connected.
//
exports.on_socket_connect = function( socket, data ) {
    console.log( 'socket connect from ID: ' + socket.socketID );
    console.log( data );
    
    // Enable the GPIO pins if this is the first connection
    if ( Object.keys( connections ).length <= 0 ) {
        enableGPIO();
    }
    
    // Store information about this socket so we can communicate with
    // all connected sockets in the future.
    connections[socket.socketID] = {
        socket: socket,
        id: socket.socketID
    };
    
    // Watch for this socket to disconnect so that we can remove it from
    // our collection of connected sockets.
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

//
// Respond to a "setled" message from a socket connection to update the LED value
//
exports.on_socket_setled = function( socket, data ) {
    if ( data.value !== "undefined" ) {
        setLED( data.value );
    }
};



//
// This is called once from our first socket connection.
// - set up the LED GPIO as an output
// - set up the Button GPIO as an input and tie it to send a "change" message
//
var enableGPIO = function() {
    
    // Set up the LED output GPIO
    console.log("Setting up LED as an output on GPIO " + ledGPIOID );
    ledDevice = gpio.export( ledGPIOID, {
        ready: function() {
            // This works around a bug in gpio, where sometimes this device
            // doesn't become immediately available.
            setTimeout( function() {
                ledDevice.setDirection("out");
            }, 100); //wait 100 ms before setting direction
        }
    });
    
    // Set up the button input GPIO
    console.log("Setting up Button as an input on GPIO" + buttonGPIOID);
    buttonDevice = gpio.export( buttonGPIOID, {
        direction: "in",
        ready: function() {
            
            // Set up buttonDevice to call the buttonChange  
            // function (below) whenever its value changes.
            buttonDevice.on("change", buttonChange);
        }
    });

};

//
// This is called when the last socket disconnects.
// It releases our GPIO pins so they can be used by another program.
//
var disableGPIO = function() {
    console.log("Disabling GPIO" + ledGPIOID );
    ledDevice.removeAllListeners();
    ledDevice.reset();
    ledDevice.unexport();

    console.log("Disabling GPIO" + buttonGPIOID );
    buttonDevice.removeAllListeners();
    buttonDevice.reset();
    buttonDevice.unexport();
};

//
// This is triggered by the GPIO "change" event on buttonDevice. This was
// set up inside emabledGPIO().
//
// The change event sends this function a value, either 0 (off) or 1 (on).
//
var buttonChange = function( val ) {
    // Recall that this code is running on the device. We need to send a
    // socket message with the button data to our javascript in the
    // web browser. In fact, we need to send this data to every connected
    // socket, since there may be more than one browser window looking at
    // this page.
    
    console.log( "buttonChange event with value: " + val );
    
    // Iterate through all of our socket connections
    for ( var socketid in connections ) {
        // Get the socket object for this socket
        var socket = connections[socketid].socket;
        
        // The "appdata" event will be received by the Coder.socketConnection 
        // object in the front end code and sent to the appropriate listener 
        // that we've defined.    
        // The "buttonupdate" key refers to a listener we set up on the front
        // end with the code:
        // Coder.socketConnection.addListener( "buttonupdate", function... )
        socket.emit( "appdata", {
            key: "buttonupdate",
            data: val
        });
    }
};

//
// Set the value on the LED GPIO device, either 0 (off) or 1 (on).
//
var setLED = function( val ) {
    val = parseInt( val );
    if ( val != 0 ) {
        val = 1;
    }
    ledDevice.set( val );
};

//
// Called by Coder whenever this module is reloaded. This usually happens when
// you save your code in the editor. This is a good place to destroy any intervals
// or clean up any long running code or handles.
//
exports.on_destroy = function() {
};



