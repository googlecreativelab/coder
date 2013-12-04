
$(document).ready( function() {

    //This code will run after your page loads
    Coder.socketConnection.init(function(){
        
        addOutputMessage( "Connected with ID: " + Coder.socketConnection.socketID );
        
        
        Coder.socketConnection.sendData( 'connect', {'name':'testing'} );

        Coder.socketConnection.addListener( 'message', function( d ){
            console.log("message from: " + d.name + " : " + d.message);
        });
    });

    addOutputMessage( "Connecting... see the debug console for log messages." );

});

var addOutputMessage = function( text ) {
    var $output = $("#output");
    $output.prepend( $("<p/>").text( text ) );
    console.log( text );
}

