'use strict'
var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

var wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

var channels = []
var subscribers = []
var subscriptions = {}

wsServer.on( 'request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept( null, request.origin )
    console.log( ( new Date().toLocaleTimeString() ) + ' Connexion acceptée.' )

    connection.on( 'message', function(message) {
        if (message.type === 'utf8') {
            var command = JSON.parse( message.utf8Data )
            console.log ( command )
            switch ( command.action ) {

                case 'create_channel':
                    console.log( 'create %s', command.channel )
                    channels.push( command.channel )
                    for( let s of subscribers ) {
                        s.send( JSON.stringify( { action: 'add', channel: command.channel } ) ) 
                    }
                    break

                case 'push':
                    console.log( 'push %s', command.message )
                    if ( !subscriptions[command.channel] ) 
                        console.info( 'Pas d\'abonné' )
                    else 
                        for( let s of subscriptions[command.channel] ) {   
                            s.send( JSON.stringify( { action: 'write', message: command.message, channel: command.channel } ) ) 
                        }
                    break

                case 'subscribe':
                    console.log( 'Abonnement à %s', command.channel )
                    if ( ! subscriptions[command.channel] )
                        subscriptions[command.channel] = []
                    subscriptions[command.channel].push( connection )
                    break

                case 'client': 
                    console.log( 'Abonné connecté' )
                    subscribers.push( connection )
                    for ( let ch of channels ) {
                        connection.send( JSON.stringify( { action: 'add', channel: ch } ) )
                    }

                default:
                    console.log( 'INCONNU' ) 
            }
        }
    } )

    
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    } )
} )