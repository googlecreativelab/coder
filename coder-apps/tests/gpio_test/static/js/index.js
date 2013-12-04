
$(document).ready( function() {

    //This code will run after your page loads
    Coder.socketConnection.init(function(){
        
        addOutputMessage( "Connected with ID: " + Coder.socketConnection.socketID );
        addOutputMessage( "Click ON or OFF to enable blinking" );
        
        Coder.socketConnection.sendData( 'connect', {'name':'testing'} );

        Coder.socketConnection.addListener( 'Received gpio value', function( d ){
            console.log("gpio value: " + d);
        });


        // Blink every 100ms if enabled is on
        // enabled is set below by a button click.
        var blinkval = 0;
        setInterval( function() {
        
            if ( blinkval ) {
                blinkval = 0;
            } else {
                blinkval = 1;
            }

            if ( enabled ) {
                
                Coder.socketConnection.sendData( 'gpio', {
                    command: "set",
                    value: blinkval
                });
            }
        }, 100 );
        
        
        
        //Enable or disable the blinker
        var enabled = false;
        $("#on").click( function() {
            Coder.socketConnection.sendData( 'gpio', {
                command: "set",
                value: 1
            });
            enabled = true;
        });
        $("#off").click( function() {
            Coder.socketConnection.sendData( 'gpio', {
                command: "set",
                value: 0
            });
            enabled = false;
        });
        
    });

    addOutputMessage( "Connecting... see the debug console for log messages." );

});



var addOutputMessage = function( text ) {
    var $output = $("#output");
    $output.prepend( $("<p/>").text( text ) );
    console.log( text );
}

