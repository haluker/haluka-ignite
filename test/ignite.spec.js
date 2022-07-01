
const Blaze = require('..')
const http = require('http')

const request = require('supertest')

const opts = {
    prettyBoot: false,
    bootMessage: false,
    appPath: './test/support',
    appData: 'app.js',
    // customDispatcher: {},
    httpConfig: {
        sessionSecret: 'lol',
    },
    useRecommended: false,
    // UserModel: {}
}

// process.env.ENV_PATH = opts.appPath + '/.env'

test('ignite haluka app', (done) => {
    Blaze.Ignite(opts)
        .then(h => {
            let server = http.createServer(h)
            app().save('server', server)
            let port = env('PORT') || 3000
            server.listen(port)
            use('Events').fire('Http.StartedListening', server, port, opts.bootMessage)
            return request('http://localhost:' + port)
        }).then((request) => {
            // check route
            request
                .get('/')
                .expect(200)
                .expect('Content-Length', '5')
                .then(resp => {
                    expect(resp.text).toBe('Hello')
                    done()
                })
                .catch(err => { done(err) })
                .finally(() => {
                    app().terminate()
                })

        })
})