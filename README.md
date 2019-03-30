# push

## Démarrage 

Installation des dépendances :

> npm install

Démarrage du serveur Web Socket :

> node wss

Démarrage du serveur Web :

> node server


___

## Usage côté client

Chargement du script

`var worker = new Worker( 'wsi.js' )`


### Envoi d'une commande

`worker.postmessage( message )`


### Liste des messages à envoyer

    { action: 'connect', url: '//localhost:8080' }                  // connexion
    { action: 'client', name: 'Toto' }                              // utilisateur
    { action: 'create_channel', channel: 'Canal1' }                 // canal
    { action: 'push', channel; 'Canal1', message: 'Hellow World' }  // diffusion d'un message
    { action: 'subscribe', channel: 'Canal1' }                      // abonnement au canal
    { action: 'unsubscribe', channel: 'Canal1' }                    // désabonnement du canal
    { action: 'close' }                                             // fermture de la connexion


### Réception d'un message

    worker.onmessage = e => {
        let { action, name, channel, message, state } = e.data

        switch ( action ) {
            case 'add_channel':
            case 'remove_channel':
                console.log( channel )
                break 

            case 'write': 
                console.log( channel, message )
                break 

            case 'add_user':
            case 'remove_user':
                console.log( name )
                break

            //attendre l'action 'connection' avant d'envoyer des messages vers le serveur
            case 'connection':
                if ( state === 1 )
                    worker.postMessage( { 
                        action:'client', 
                        name:'toto'
                    } )
                break
        }
    }





