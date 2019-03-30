customElements.define( 'ws-publisher', class extends HTMLElement {
    constructor() {
        super()
        var shadow = this.attachShadow( { mode: 'open' } )
        shadow.innerHTML = `
                <link rel="stylesheet" href="publisher.css">
                <h1>Canal de publication

                <section>
                    <input id="channel" placeholder="Nom de canal">
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
        setTimeout( () => channel.focus(), 100)
        var message_editor = shadow.querySelector( '#message_editor' )
        var send_message = shadow.querySelector( '#send_message' )
        var close = shadow.querySelector( 'button.x' )
        
        channel.onchange = create_channel
        message_editor.onchange = push_message

        var worker = new Worker( 'wsi.js' ) 

        function create_channel() {
            console.info( 'création du canal %s', channel.value )
            let url = this.getAttribute( 'url' )
            worker.postMessage( { action: 'connect', url: url } )            
            channel.disabled = true
        }

        worker.onmessage = e => {
            var message = e.data 
            console.info( 'Message reçu par client',  message )
            switch ( message.action ) {
                case 'connection':
                    console.info( 'Connexion : %i', message.state )
                    if ( message.state === 1 ) {
                        worker.postMessage( { action: 'create_channel', channel: channel.value } )
                        message_editor.focus()
                    }
                    else
                        channel.disabled = false
                    break        
            }
        }

        function push_message() {
            console.info( 'push on #%s %s', channel.value, message_editor.value )
            
            var message = {
                action: 'push',
                channel: channel.value,
                message: message_editor.value
            }

            worker.postMessage( message )
            message_editor.value = ''
            message_editor.focus()
        }

        close.onclick = () => {
            console.log( "fermer le canal" )
            worker.postMessage( { action: 'close' } )
            this.parentElement.removeChild( this )
        }
    }
})