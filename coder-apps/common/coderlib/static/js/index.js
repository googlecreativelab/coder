/**
 * Coder for Raspberry Pi
 * A simple platform for experimenting with web stuff.
 * http://g.co/coder
 *
 * Copyright 2013 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

if (typeof console === "undefined" || typeof console.log === "undefined") {
    console = {};
    console.log = function() {};
}




var Coder = {
    coderlib_url: "/app/coderlib",
    appname: '',
    appurl: '',
    
    listApps: function( callback ) {
        $.get( Coder.coderlib_url + "/api/app/list", function(data){
            callback( data.apps );
        });
    },

    addBasicNav: function( ) {
        $(document).ready( function() {
            //ignore this menu if we're in the editor
            if ( window.location.href.match(/\?ineditor/) ) {
                return;
            }
            
            var navhtml = '<div id="coder_basicnav"><div class="coder_home"><a href="/app/coder/">Coder</a></div><div class="coder_editbutton">&lt;/&gt;</div></div>';
            var $nav = $(navhtml);
            $('body').find('#coder_basicnav').remove();
            $('body').append( $nav );
            $nav.find('.coder_editbutton').click(function() {
                window.location.href= '/app/editor/edit/' + Coder.appname;
            });
        });
    },
    
    
    socketConnection: {
        socket: null,
        listeners: {},
        socketReady: false,
        onSocketReady: null,

        init: function( callback ) {
            var doConnect = function() {
                var socket = io.connect(window.location.protocol + window.location.hostname + ':' + window.location.port +'/' );
                Coder.socketConnection.socket = socket;
                socket.on('connect', function() {
                    console.log('socket connected');
                    
                    socket.on('SOCKETID', function(socketid) {
                        Coder.socketConnection.socketID = socketid;
                        if ( callback ) {
                            callback(socketid);
                        }
                    });
                });
                socket.on('SERVERLOG', function(d) {
                    console.log('SERVERLOG: ' + JSON.stringify(d));
                });
                socket.on('appdata', function(data) {
                    console.log('appdata received');
                    console.log( data );
                    if ( data && data.key !== undefined ) {
                        if ( Coder.socketConnection.listeners[data.key] !== undefined ) {
                            for ( var x=0; x<Coder.socketConnection.listeners[data.key].length; x++ ) {
                                var handler = Coder.socketConnection.listeners[data.key][x];
                                var appdata = data.data;
                                handler( appdata );
                            }
                        }
                    }
                });
            };
            
            if ( Coder.socketConnection.socketReady ) {
                doConnect();
            } else {
                Coder.socketConnection.onSocketReady = doConnect;
            }
        }, //end socket init
        
        //Sends [data] to the current [appid]'s socket handler for [key]
        sendData: function( key, data ) {
            if ( Coder.socketConnection.socket !== null ) {
                Coder.socketConnection.socket.emit( 'appdata', { 
                    appid: Coder.appname,
                    key: key,
                    data: data
                });
            }
        },
        
        //Listens on the socket for [key] and calls [handler](data)
        addListener: function( key, handler ) {
            if ( Coder.socketConnection.listeners[key] === undefined ) {
                Coder.socketConnection.listeners[key] = [];
            }
            Coder.socketConnection.listeners[key].push( handler );
        },
        removeListener: function( key, handler ) {
            if ( Coder.socketConnection.listeners[key] !== undefined && handler !== null ) {
                var updated = [];
                for ( var x=0; x<Coder.socketConnection.listeners[key].length; x++ ) {
                    if ( Coder.socketConnection.listeners[key][x] !== handler ) {
                        updated.push( Coder.socketConnection.listeners[key][x] );
                    }
                    Coder.socketConnection.listeners[key] = updated;
                }
            } else if ( Coder.socketConnection.listeners[key] !== undefined ) {
                Coder.socketConnection.listeners[key] = [];
            }
        },           
        
    }, //End Coder.socketConnection
    
};

if ( typeof appname != 'nothing' ) {
    Coder.appname = appname;
}
if ( typeof appurl != 'nothing' ) {
    Coder.appurl = appurl;
}


var getParams = (function(qs){
    var params = {};
    if ( typeof qs !== 'undefined' ) {
        for ( var x=0; x<qs.length; x++ ) {
            var param = qs[x].split('=');
            if (param.length == 2) {
                params[param[0]] = decodeURIComponent(param[1].replace(/\+/g, " "));
            } else {
                params[param[0]] = '';
            }
        }
    }
    return params;
})(window.location.search.substr(1).split('&'));



//Load Socket IO Scripts
(function() {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '/socket.io/socket.io.js';
 
    var socketIOReady = function() {
        Coder.socketConnection.socketReady = true;
        if ( Coder.socketConnection.onSocketReady ) {
            Coder.socketConnection.onSocketReady();
        }
    };
 
    script.onreadystatechange = socketIOReady;
    script.onload = socketIOReady;
    head.appendChild(script);
})();

