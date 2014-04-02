///////////////////////
// SPI Test
// Sample code to interact with Raspberry Pi hardware, talk to an
// MCP3008 ADC chip and return the analog value of channel 0.
//
// This part of the code runs in your web browser. It's responsible 
// for handling user input from the web browser, sending commands
// to the Raspberry Pi, and listening for updates that the device
// sends back.
//
// The code here communicates with another program that runs directly
// on the Pi (not in your browser). That device-side code can be found 
// in the Node tab.
////////////////////////

$(document).ready( function() {

    // Connection can take a second. Let the user know what's happening.
    addOutputMessage( "Connecting... see the debug console for log messages." );

    // This establishes a socket connection to the Coder device. A
    // socket conection stays open while the user is viewing this page,
    // which allows us to send a receive data very quickly from the device
    // instead of checking for updates multiple times a second.
    // 
    // Coder.socketConnection.init takes a callback function that will
    // be executed once the connection is established. Anything that
    // requires an established connection in order to function 
    // correctly should be placed in here.
    Coder.socketConnection.init(function(){

        // Each connection gets a unique ID.
        addOutputMessage( "Connected with ID: " + Coder.socketConnection.socketID );
        
        // Send a "connect" message to our Node page when we first connect.
        Coder.socketConnection.sendData( 'connect', {} );


        
        Coder.socketConnection.addListener( 'analogdata', function( d ){
            console.log("analog value: " + d);
            $('#analogdata').text( d );
            //addOutputMessage( "Analog value: " + d );
        });


        
    });

});




// Append a new P tag to the #output DIV
var addOutputMessage = function( text ) {
    var $output = $("#output");
    $output.append( $("<p/>").text( text ) );
    console.log( text );
};

