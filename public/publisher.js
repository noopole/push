customElements.define( 'push-publisher', class extends HTMLElement {
    constructor() {
        super()
        var shadow = this.attachShadow( { mode: 'open' } )
        shadow.innerHTML = `
                <link rel="stylesheet" href="publisher.css">
                <h1>Canal de publication

                <section>
                    <input id="channel" placeholder="Nom de canal"><button id="register_channel">Créer</button>
                </section>
                <section>
                    <input id="message_editor" placeholder="Message"><button id="send_message">Diffuser</button>
                </section>
                <section>
                    <div id="output"></div>
                </section>
                <button class="x" title="Fermer">X</button>
            `
        
        var channel = shadow.querySelector( '#channel' )
        var register_channel = shadow.querySelector( '#register_channel' )
        var message_editor = shadow.querySelector( '#message_editor' )
        var send_message = shadow.querySelector( '#send_message' )
        var close = shadow.querySelector( 'button.x' )
        
        register_channel.onclick = create_channel
        send_message.onclick = push_message

        var client 

        function create_channel() {
            console.info( 'création du canal %s', channel.value )
            client = new WebSocket( 'ws://localhost:8080/' )
            
            client.onerror = function() {
                console.log( 'Erreur WebSocket' )
            }
            
            client.onopen = function() {
                console.log( 'Client WebSocket connecté' )
            
                var message = { 
                    action: 'create_channel',
                    channel: channel.value
                } 

                client.send( JSON.stringify( message ) )
                register_channel.style.visibility = "hidden"
            }
            
            client.onclose = function() {
                console.log('Connexion fermée')
            }
            
            client.onmessage = function( e ) {
                if ( typeof e.data === 'string' ) {
                    console.info( 'Reçu : %o', JSON.parse( e.data ) )
                }
            }
        }

        function push_message() {
            console.info( 'push on #%s %s', channel.value, message_editor.value )
            
            var message = {
                action: 'push',
                channel: channel.value,
                message: message_editor.value
            }

            client.send( JSON.stringify( message ) )
        }

        close.onclick = () => {
            console.log( "fermer le canal" )
            client.close() 
            this.parentElement.removeChild( this )
        }
    }
})