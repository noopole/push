console.debug( 'Worker WSI démarré' )

//APPELS WEB SOCKET SERVER
class SoConn {

    constructor( url ) {
        console.debug( 'SoCon( %s )', url )
        url = 'ws:' + ( url || '//localhost:8080/' )
        console.debug( `WebSocket en cours de connexion à ${url}` )
        let s = new WebSocket( url )
        s.onopen = () => {
            this.connected( s )
            postMessage( { action: 'connection', state: s.readyState } )  
        }
        s.onerror = () =>
            postMessage( { action: 'connection', state: s.readyState } )  
    }

    connected( socket ) {        
        //Message reçus
        socket.onmessage = ev => {
            console.debug( 'Message reçu par WebSocket' )
            if ( typeof ev.data === 'string' ) {
                var message = JSON.parse( ev.data )
                console.debug( message )
                switch ( message.action ) {

                    case 'add_channel':
                    case 'remove_channel':
                    case 'add_user':
                    case 'remove_user':
                    case 'write':
                    case 'error':
                        postMessage( message )
                        break 
                }
            }
        }

        //Méthodes
        let send = ( jso ) => {
            socket.send( JSON.stringify( jso ) )
        }

        let close = () => {
            socket.close()
        }

        //API
        this.send = send
        this.close = close
    }
}


var s

//APPELS NAVIGATEUR 
onmessage = /*async*/ e => {
    var msg = e.data
    console.debug( 'Message du navigateur :', msg )
    let { action, username, url } = msg

    switch ( action ) {

        case 'connect':
            s = new SoConn( url )        
            break

        case 'close':
            s && s.close()
            break
        
        case 'push':
        case 'create_channel':
        case 'client':
        case 'subscribe':
        case 'unsubscribe':
            s.send( msg )
            break

        default:
            console.warn( 'INCONNU' )
    }
}


