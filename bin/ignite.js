#!/usr/bin/env node

const ignite = require('..').Ignite
const http = require('http')
const fs = require('fs')

process.env.ENV_PATH = '.env'

let _default = {
    prettyBoot: true,
    bootMessage: true,
    useRecommended: true,
    httpConfig: 'haluka:config'
}
let localOpts = fs.existsSync('ignite.config.js') ? require(process.cwd() + '/ignite.config.js') : {}
let opts = Object.assign(_default, localOpts)
ignite(opts)
    .then(haluka => {
        let server = http.createServer(haluka)
        app().save('server', server)
        let port = env('PORT') || 3000
        server.listen(port)
        use('Events').fire('Http.StartedListening', server, port, opts.bootMessage)
    })