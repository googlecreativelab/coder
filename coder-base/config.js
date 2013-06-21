
exports.listenIP = null; //Defaults to *
exports.listenPort = '443'; //the SSL port things run on
exports.httpListenPort = '80'; //this will all be redirected to SSL
exports.cacheApps = true;


//SSL Info
exports.country = "US";
exports.state = "New York";
exports.locale = "New York";
exports.commonName = "coder.local";
exports.subjectAltName = "DNS:192.168.0.1";


//Experimental
//
//Status Server
//  This can be used in conjundtion with the sample findcoder
//  appengine project. It allows multiple Coders on the same
//  NAT network to be discoverable. Coder devices will ping the
//  external server with their internal IP, and the server
//  will list the devices for any requesting machine that
//  originates from the same external IP.
exports.statusServer = '[yourpingserver].appspot.com';
exports.enableStatusServer = false;
