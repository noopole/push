require( 'dotenv').config()
var express = require( 'express' )
var morgan = require( 'morgan' )

var app = express()

app.use( morgan( 'dev' ) )

app.use( express.static( 'public') )

app.use( '/api', require( './api' ) ) 

app.listen( process.env.PORT || 80 )
