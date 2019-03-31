class Session {
    
    get channels() {
        let c = sessionStorage.getItem( 'socket:channels' )
        return c? c.split( ',' ) : []
    }

    add_channel( value ) {
        var channels = this.channels 
        channels.push( value )
        sessionStorage.setItem( 'socket:channels', channels )
    }

    set name( name ) {
        sessionStorage.setItem( 'socket:name', name )
    }

    get name() {
        return sessionStorage.getItem( 'socket:name' )
    }

    set_last_message( channel, message ) {
        sessionStorage.setItem( 'message:' + channel , message )
    }
    
    last_message( channel ) {
        return sessionStorage.getItem( 'message:' + channel )
    }

    close_channel( channel ) {
        let channels = this.channels
        let output = channels.filter( c =>  c !== channel  )
        sessionStorage.setItem( 'socket:channels', output )        
    }
}