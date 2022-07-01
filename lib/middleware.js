
const _ = require('lodash')
const _express = require('express') 
const helmet = require('helmet')
const compression = require('compression')
const busboyParser = require('./busboy')
const bodyParser = require('body-parser')
const expressSession = require('express-session')

module.exports = (express, httpConfig) => {

    // Registering JSON & URLEncoded Parsers
    express.use(bodyParser.json())
    express.use(bodyParser.urlencoded({ extended: true, limit: _.get(httpConfig, 'post.limit', '2mb') }))

    // trust first proxy
    if (_.get(httpConfig, 'trustProxy', true))
        express.set('trust proxy', 1) 
        
    // Multipart Parser (busboy-body-parser)
    express.use(busboyParser(_.get(httpConfig, 'uploads', {})))
    
    // Static Files
    express.use(_express.static('public'))

    // Always wear a helmet
    express.use(helmet(_.get(httpConfig, 'helmet', { })))

    // Session
    SessionSetup(express, httpConfig.sessionSecret)

    // Gzip compression
    if (_.get(httpConfig, 'gzip', true))
        express.use(compression())

}


function SessionSetup (express, secret) {

    express.use(expressSession({
        secret,
        resave: false,
        saveUninitialized: false,
        unset: 'destroy',
        cookie: {
            httpOnly: true,
            sameSite: true,
            secure: false
        },
        proxy: true,
    }))

}

