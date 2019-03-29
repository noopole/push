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

//identifiant unique de la connexion
var idcount = 0

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

//Canaux
var channels = new Map      // Canaux par nom de canal
var subscribers = new Map   // Abonnés par nom d'abonné
var connections = new Map   // Connexion par id de connexion
//Canal     // { connection (id), subscribers }      
//Abonné    // { connection (id), subscriptions }
//Connexion // { connection, channel, subscriber }

wsServer.on( 'request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept( null, request.origin )
    connection.id = ++idcount
    connections.set( connection.id, { connection: connection } )
    console.log( ( new Date().toLocaleTimeString() ) + ' Connexion acceptée. Id=%i', connection.id )

    connection.on( 'message', function(message) {
        if (message.type === 'utf8') {
            var command = JSON.parse( message.utf8Data )
            console.log ( command )
            switch ( command.action ) {

                case 'create_channel':
                    console.log( 'Cnx %i : Création du canal %s', connection.id, command.channel )
                    channels.set( command.channel, { connection: connection.id, subscribers: new Set } )
                    connections.get( connection.id ).channel = command.channel
                    subscribers.forEach( subscriber => {
                        connections.get( subscriber.connection ).connection.send( JSON.stringify( { action: 'add', channel: command.channel } ) ) 
                    } )
                    break

                case 'push':
                    console.log( 'push %s vers %s', command.message, command.channel )
                    let channel = channels.get( command.channel )
                    if ( !channel ) 
                        console.info( 'Canal inconnu' )
                    if ( channel.subscribers.size === 0 ) 
                        console.info( 'Pas d\'abonné' )
                    else { 
                        channel.subscribers.forEach( s =>  { 
                            console.log( 'Abonné %o', s )
                            connections.get( subscribers.get( s ).connection ).connection.send( JSON.stringify( { action: 'write', message: command.message, channel: command.channel } ) ) 
                        } ) 
                    }
                    break

                case 'subscribe':
                    console.log( 'Abonnement à %s', command.channel )
                    var name = connections.get( connection.id ).client 
                    //Ajout à la liste des abonnés du canal
                    channels.get( command.channel ).subscribers.add( name )
                    //Ajout à la liste des canaux de l'abonné
                    subscribers.get( name ).subscriptions.add( command.channel )
                    break

                case 'unsubscribe':
                    break

                case 'client': 
                    name = command.name || 'Anonyme_' + connection.id
                    console.log( 'Abonné %s connecté', name )
                    subscribers.set( name, { subscriptions: new Set, connection: connection.id } )
                    connections.get( connection.id ).client = name
                    for ( let ch of channels.keys() ) {
                        connection.send( JSON.stringify( { action: 'add', channel: ch } ) )
                    }
                    break

                default:
                    console.log( 'INCONNU' ) 
            }
        }
    } )

    
    connection.on( 'close', ( reasonCode, description ) => {
        console.log( ( new Date().toLocaleTimeString() ) + ' Connexion %i fermée [%s=%s]', connection.id, reasonCode, description )

        //Si c'est un canal qui est coupé
        let channel = connections.get(connection.id).channel
        if ( channel ) {
            //Désabonnement des aboonés
            subscribers.forEach( s => {
                connections.get( s.connection ).connection.send( JSON.stringify( { action: 'remove', channel: channel } ) ) 
                s.subscriptions.delete( channel )      
            } )
            let res = channels.delete( channel )
            console.log( 'Fermeture du Canal %s', channel, res? 'OK' : 'Echec' )
        }

        //Si c'est un client qui est coupé
        var client = connections.get( connection.id ).client
        if ( client ) {
            let subscriptions = subscribers.get( client ).subscriptions
            subscriptions.forEach( s => channels.get( s ).subscribers.remove( client ) )
            let res = subscribers.delete( client)            
            console.log( 'Déconnexion de l\'abonné %s', client, res? 'OK' : 'Echec' )
        }

    } )
} )