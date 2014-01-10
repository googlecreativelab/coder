///////////////////////
// GPIO Test
// Sample code to interact with Raspberry Pi hardware, blink an LED,
// and detect a physical button press.
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


        // Listen for a "buttonupdate" socket message from the device
        Coder.socketConnection.addListener( 'buttonupdate', function( d ){
            console.log("button gpio value: " + d);
            
            // The data we get should be an integer, 0 (off) or 1 (button pressed). 
            var val = parseInt( d );
            if ( d === 1 ) {
                $("#buttonval").addClass('on');
            } else {
                $("#buttonval").removeClass('on');
            }
        });


        // Set an interval that will repeatedly send LED on and 
        // LED off messages to the device. This will cause the led
        // to blink.
        blinkEnabled = false; // it's off by default
        setInterval( function() {
            // Only blink the LED if the user has 
            // turned this feature on.
            if ( blinkEnabled ) {
                ledToggle(); // toggles the led. see below.
            }
        }, 100 ); // This function is repeatedly called every 100ms
        
        
                
        $("#blinkon").click( function() {
            startBlink();
            ledOn(); // start out with the light in the on state.
        });
        $("#blinkoff").click( function() {
            stopBlink();
            ledOff(); // also make sure the light is off
        });
        $("#toggle").click( function() {
            stopBlink(); // discontinue blinking in case it was running
            ledToggle(); // flip the LED state
        });
        
        // Treat this like a push button that turns the light off while
        // the mouse is pressed, and turns it off immediately on release.
        $("#push").on("mousedown", function() {
            stopBlink();
            ledOn();
        }).on("mouseup", function() {
            stopBlink();
            ledOff();
        });

        
    });

});

// The "ledValue" variable lets us keep track of the LED's
// current state. 1 is on, 0 is off.
var ledValue = 0; 

// Send a "setled" message to the device with a value of 1 (on)
var ledOn = function() {
    ledValue = 1;
    Coder.socketConnection.sendData( 'setled', {
        'value': ledValue
    });
};

// Send a "setled" message to the device with a value of 0 (on)
var ledOff = function() {
    ledValue = 0;
    Coder.socketConnection.sendData( 'setled', {
        'value': ledValue
    });
};

// Switch the led state.
// If it's on, turn it off. If it's off, turn it on.
var ledToggle = function() {
    if ( ledValue === 1 ) {
        ledOff();
    } else {
        ledOn();
    }
};

var blinkEnabled = false;
var startBlink = function() {
    blinkEnabled = true; // enables blinking in our interval timer (above)
    $("#blinkon").hide();
    $("#blinkoff").show();    
};
var stopBlink = function() {
    blinkEnabled = false; // enables blinking in our interval timer (above)
    $("#blinkon").show();
    $("#blinkoff").hide();    
};


// Append a new P tag to the #output DIV
var addOutputMessage = function( text ) {
    var $output = $("#output");
    $output.append( $("<p/>").text( text ) );
    console.log( text );
};

