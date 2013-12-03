
$(document).ready( function() {

    //This code will run after your page loads
    Coder.socketConnection.init(function(){
        console.log("connected with ID: " + Coder.socketConnection.socketID);
        
        Coder.socketConnection.sendData( 'connect', {'name':'jimmy'} );

        Coder.socketConnection.addListener( 'message', function( d ){
            console.log("message from: " + d.name + " : " + d.message);
        });
    });

});

