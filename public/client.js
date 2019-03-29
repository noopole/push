customElements.define( 'push-client', class extends HTMLElement {
    constructor() {
        super()
        var shadow = this.attachShadow( { mode: 'open' } )
        shadow.innerHTML = `
            <link rel="stylesheet" href="client.css">
            <h1>Client</h1>
            <section class="channel">Sélectionnez un ou plusieurs canaux : 
                <ul id="list">
                </ul>
            </section>
            <section>Message reçus :
                <ul id="msg">
                </ul>
            </section>
            <button class="x" title="Fermer">X</button>
        `
        var client = new WebSocket( 'ws://localhost:8080/' )
        var list = shadow.querySelector( '#list' )
        var msg = shadow.querySelector( '#msg' )
        var close = shadow.querySelector( 'button' )

        list.onclick = ev => {
            if ( ev.target.localName === 'li' ) {
                ev.target.classList.add( 'selected' ) 
                client.send( JSON.stringify( { action: 'subscribe', channel: ev.target.textContent } ) )
            }
        }

        client.onopen = () => {
            console.info( 'Abonné connecté' )
            client.send( JSON.stringify( { action: 'client' } ) )
        }

        client.onmessage = ev => {
            console.info( 'Message reçu par client' )
            var li 
            if ( typeof ev.data === 'string' ) {
                var message = JSON.parse( ev.data )
                console.log( message )
                switch ( message.action ) {

                    case 'add':
                        li = document.createElement( 'li' )
                        li.textContent = message.channel
                        list.appendChild( li )
                        break 

                    case 'write': 
                        li = document.createElement( 'li' )
                        li.textContent = `#${message.channel} : ${message.message}` 
                        msg.appendChild( li )
                        break 

                    case 'remove':
                        let lis = list.querySelectorAll( 'li' )
                        lis.forEach( li => li.textContent == message.channel && list.removeChild( li ) )
                        break

                    default:
                        console.warn( 'INCONNU' )
                }
            }
        }

        close.onclick = () => {
            console.log( "fermer le canal" )
            client.close() 
            this.parentElement.removeChild( this )
        }
    }
})