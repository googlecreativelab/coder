var id;

$(document).ready( function() {

    id=randomID();

    //This code will run after your page loads
    Coder.connectSocket(function(){
        console.log("connected!");
        Coder.sendData( appname, 'connect', {'name':'jimmy','id': id } );
        
        Coder.addSocketListener( 'message', function( d ){
            console.log("message from: " + d.name + " : " + d.message);
        });
    });

});

var randomID = function()
{
    var id = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 32; i++ )
        id += possible.charAt(Math.floor(Math.random() * possible.length));

    return id;
}