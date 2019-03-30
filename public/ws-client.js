customElements.define( 'ws-client', class extends HTMLElement {
    constructor() {
        super()
        var shadow = this.attachShadow( { mode: 'open' } )
        shadow.innerHTML = `
            <link rel="stylesheet" href="client.css">
            <h1>Client</h1>
            <section>
                <label for="firstname">Pseudo</label>
                <input id="firstname">
            </section>
            <section class="channel">Sélectionnez un ou plusieurs canaux : 
                <ul id="channel_list">
                </ul>
            </section>
            <section>Message reçus :
                <ul id="msg">
                </ul>
            </section>
            <button class="x" title="Fermer">X</button>
        `
        var firstname = shadow.querySelector( 'input#firstname')
        var channel_list = shadow.querySelector( 'ul#channel_list' )
        var msg = shadow.querySelector( '#msg' )
        var close = shadow.querySelector( 'button.x' )
        var connect_button = shadow.querySelector( ' button#connect' )
        
        var worker = new Worker( 'wsi.js')

        
        let connect = () => {
            let url = this.getAttribute( 'url' )
            worker.postMessage( { action: 'connect', url: url } )
            //désactiver le bouton
            firstname.disabled = true
        }

        //connect_button.onclick = connect
        firstname.onchange = connect 

        channel_list.onclick = ev => {
            if ( ev.target.localName === 'li' ) {
                let selected = ev.target.classList.toggle( 'selected' ) 
                worker.postMessage( { action: selected ? 'subscribe' : "unsubscribe", channel: ev.target.textContent } )
            }
        }

        worker.onmessage = ev => {
            var li 
            var message = ev.data 
            console.info( 'Message reçu par client',  message )
            switch ( message.action ) {

                case 'add_channel':
                    li = document.createElement( 'li' )
                    li.textContent = message.channel
                    channel_list.appendChild( li )
                    break 

                case 'write': 
                    li = document.createElement( 'li' )
                    li.textContent = `#${message.channel} : ${message.message}` 
                    msg.appendChild( li )
                    break 

                case 'remove_channel':
                    let lis = channel_list.querySelectorAll( 'li' )
                    lis.forEach( li => li.textContent == message.channel && channel_list.removeChild( li ) )
                    break

                case 'add_user':
                    li = document.createElement( 'li' )
                    li.textContent = `@${message.name} connecté`
                    msg.appendChild( li )
                    break

                case 'remove_user':
                    li = document.createElement( 'li' )
                    li.textContent = `@${message.name} déconnecté`
                    msg.appendChild( li )
                    break

                case 'connection':
                    console.info( 'Connexion : %i', message.state )
                    if ( message.state === 1 )
                        worker.postMessage( { action: 'client', name: firstname.value } )
                    else
                        firstname.disabled = false
                    break 
                
                default:
                    console.warn( 'INCONNU' )
            }
        }

        close.onclick = () => {
            console.log( 'fermer la connexion' )
            worker.postMessage( { action: 'close' } )
            this.parentElement.removeChild( this )
        }
    }
})