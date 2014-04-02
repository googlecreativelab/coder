var SPI = require('pi-spi');


// The SPI linux device. Either /dev/spidev0.0 or /dev/spidev0.1
var spidev = '/dev/spidev0.0';

// The handle to the device driver
var spiDevice = null;



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
// 2. initialize the SPI device if this is the first time a socket has connected.
//
exports.on_socket_connect = function( socket, data ) {
    console.log( 'socket connect from ID: ' + socket.socketID );
    console.log( data );
    
    // Enable the SPI device if this is the first connection
    if ( Object.keys( connections ).length <= 0 ) {
        enableSPI();
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
            disableSPI();
            connected = false;
            spiDevice = null;
        }
    });
    
};





//
// This is called once from our first socket connection.
// - set up the SPI device
// - read input from the device and send spiupdate events
//
var updateInterval;
var enableSPI = function() {
    
    // Set up the SPI device
    console.log("Setting up SPI on " + spidev );
    spiDevice = SPI.initialize( spidev );


    //Poll the device for updates once a second.
    updateInterval = setInterval( readADCData, 1000 );    


};

//
// This is called when the last socket disconnects.
// It releases our GPIO pins so they can be used by another program.
//
var disableSPI = function() {

    console.log("Disabling SPI device" + spidev );

    clearInterval( updateInterval );
    spiDevice.close();
    
};

var toBin = function( d ) {
    return ("00000000" + d.toString(2)).substr( -8 );
};

//
// Reads channel 0 analog value from an MCP3008 ADC chip
//
var readADCData = function() {
    // Recall that this code is running on the device. We need to send a
    // socket message with the data to our javascript in the
    // web browser. In fact, we need to send this data to every connected
    // socket, since there may be more than one browser window looking at
    // this page.
    
    // The message used to tell an MCP3008 ADC chip to return the 
    // analog reading of channel 0;
    var channel = 0;
    var message = new Buffer([1, (8+channel)<<4, 0]);
    
    spiDevice.transfer( message, message.length, function( error, data ) {
        if ( error ) {
            console.log( "read error " + error );
        } else {
            
            //last 2 bits of 2nd byte, shifted left 8 bits, added to all 8 bits of third byte = 10 data bits.
            var val = ((data[1]&3) << 8) + data[2];
            //val = data[2];
            console.log( "raw data: " + toBin( data[0] ) + " " + toBin( data[1] ) + " " + toBin( data[2] ) );
            //console.log( "value: " + val );

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
                    key: "analogdata",
                    data: val
                });
            }


        }
    });
    
};


//
// Called by Coder whenever this module is reloaded. This usually happens when
// you save your code in the editor. This is a good place to destroy any intervals
// or clean up any long running code or handles.
//
exports.on_destroy = function() {
    if ( spiDevice !== null ) {
        disableSPI();
    }

};



