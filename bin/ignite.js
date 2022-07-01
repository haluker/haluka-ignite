#!/usr/bin/env node

const ignite = require('..').Ignite
const http = require('http')
const fs = require('fs')

process.env.ENV_PATH = '.env'

let opts = fs.existsSync('ignite.config.js') ? require(process.cwd() + '/ignite.config.js') : 
{
    prettyBoot: true,
    bootMessage: true,
    useRecommended: true,
    httpConfig: 'haluka:config'
}
ignite(opts)
    .then(haluka => {
        let server = http.createServer(haluka)
        app().save('server', server)
        let port = env('PORT') || 3000
        server.listen(port)
        use('Events').fire('Http.StartedListening', server, port, opts.bootMessage)
    })