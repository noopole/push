const express = require( 'express' )
const router = express.Router()

//Identifiant unique de tâche
var count = 0

//Client WebSocket
const W3CWebSocket = require( 'websocket' ).w3cwebsocket
var client = new W3CWebSocket( 'ws://localhost:8080/' )
client.onerror = function() {
    console.log('Connection Error');
};

client.onopen = function() {
    console.log('WebSocket Client Connected');      
}

client.onclose = function() {
    console.log('echo-protocol Client Closed');
};

client.onmessage = function(e) {
    if (typeof e.data === 'string') {
        console.log("Received: '" + e.data + "'");
    }
}

//API
router.get( '/', ( req, res ) => {
    res.status( 200 ).send( 'Example : <a href="/api/work/5">/api/work/5</a> pour exécuter une tâche de 5 secondes' )
} )

router.get( '/work/:timer', ( req, res ) => {
    let timer = req.params.timer 
    console.log( timer )
    let task = 'Task_' + ++count  
    res.status( 200 ).json( { duration: timer, task: task, channel: task } )  
    
    client.send( JSON.stringify( { action: 'create_channel', channel: task } ) )
    console.log( 'Démarrer la tâche ' + task )  
    

    let interval = setInterval( () => {
        console.log( 'Tâche terminée') 
        if ( --timer === 0 ) {
            clearInterval( interval )
            client.send( JSON.stringify( { action: 'push', channel: task, message: 'terminée' } ) )
            client.send( JSON.stringify( { action: 'remove_channel', channel: task } ) )      
        }
        else
            client.send( JSON.stringify( { action: 'push', channel: task, message: `encore ${timer} secondes` } ) )
    }, 1000 )


} )

module.exports = router