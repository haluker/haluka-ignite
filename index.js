const fs = require('fs')
const _ = require('lodash')
const chalk = require('chalk')
const Youch = require('youch')
const forTerminal = require('youch-terminal')

const Haluka = require('@haluka/core').Application
const Router = require('@haluka/routing').Router

exports.Ignite = async function (opts) {

	
	if (opts.prettyBoot == true)
		console.clear()

	if (opts.bootMessage == true)
		console.log(chalk.green('Preparing to boot Haluka'))

    return new Promise(async (resolve, reject) => {
        try {
            let haluka = Haluka.getInstance(opts.appPath || './')
            require('./lib/events.js')
            // Loads all the event handlers from applciation
            eventLoader(haluka.eventsPath())

            let appData = loadAppData(opts.appData ? haluka.path(opts.appData) : haluka.appPath('app.js'))
            haluka.boot(appData)

            // Database
            if (config('database'))
                await haluka.use('Database').setupAll()

            // Non-CLI Services
            if (!haluka.isCLI()) {
                
                if (opts.httpConfig == 'haluka:config') opts.httpConfig = config('http')

                let r = setupRouter(haluka)

                const HttpDispatcher = opts.customDispatcher || require('./lib/http').default
                const dispatcher = new HttpDispatcher(r, { path: haluka.controllersPath() })
                let http = dispatcher.create(appData, _.get(opts, 'httpConfig.timeout'))

                // Loading middlewares
                if (opts.useRecommended)
                    require('./lib/middleware')(http, opts.httpConfig)

                if (env('AUTH')) {
                    if (opts.UserModel) {
                        haluka.register('UserModel', () => opts.UserModel)
                    }
                    let passport = haluka.use('Auth')
                    http.use(passport.initialize())
                    http.use(passport.session())
                }

                // Load Routes
                fs.readdirSync(haluka.routesPath()).forEach(x => r.group({}, x)) // TODO: check

                // Dispatch HTTP Routes
                dispatcher.dispatch()
                
                if (opts.bootMessage == true) {
                    console.log()
                    console.log(chalk.magenta('Your Haluka App booted successfully.'))
                    console.log(chalk.blue('Thank you for choosing Haluka for your application.'))
                }

                resolve(http)
            }

            resolve()

        } catch (error) {
            new Youch(error, {})
                .toJSON()
                .then((output) => {
                    console.log(forTerminal(output))
                    reject()
                    process.exit(1)
                })
        }
    })

}

const eventLoader = (path) => {
    if (fs.existsSync(path)) {
        requireAll({
            dirname: path,
            filter: /(.*)\.(js|ts)$/,
            excludeDirs: /^\.(git|svn)$/
        })
    }else {
        if (!app().isTesting())
            console.log(chalk.bold.yellow('Warning: Events folder not found in App directory. Ignoring event loading.'))
    }
}

const loadAppData = (appdatapath) => {    
    if (!fs.existsSync(appdatapath)) {
        console.log(chalk.bold.red('Error: App Data file not found.'))
        process.exit(1)
    }

    return require(appdatapath)
    
}

const setupRouter = (haluka) => {
    haluka.register('Route', (_app, opts) => new Router(opts))

    const r = haluka.use('Route', { path: haluka.routesPath() })
    haluka.save({
        name: 'Haluka/Routing/Router',
        alias: 'Router'
    }, r)

    return r
}