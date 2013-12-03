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
    { key:'message', handler:'on_socket_message' }
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

exports.on_socket_connect = function( socket, data ) {
    console.log( 'socket connect from ID: ' + socket.socketID );
    console.log( data );
    
    connections[socket.socketID] = {
        socket: socket,
        name: data.name,
        id: socket.socketID
    };
    socket.on('disconnect', function() {
        console.log( 'socket disconnect from ID: ' + socket.socketID );
        delete connections[socket.socketID];
    });
    
};

exports.on_socket_message = function( socket, data ) {
    console.log( 'socket message from: ' );
 
    console.log( socket.handshake.sessionID );
    var me = connections[data.id];
    if ( me ) {
        var updated = {};
        for ( var k in connections ) {
            console.log( connections[k].name );
            
            if ( !connections[k].socket.disconnected ) {
                updated[k] = connections[k];
                if ( connections[k] !== me ) {
                    var s = connections[k].socket;
                    s.emit('appdata', {
                        key: 'message',
                        data: {
                            name: me.name,
                            message: data.message
                        }
                    });
                }
            }
        }
        connections = updated;
    }
    
};


exports.on_destroy = function() {
};