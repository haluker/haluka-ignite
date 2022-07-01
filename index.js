const fs = require('fs')
const JSON5 = require('json5')
const chalk = require('chalk')
const Youch = require('youch')
const forTerminal = require('youch-terminal')

const Haluka = require('@haluka/core').Application
const Router = require('@haluka/routing').Router

exports.Ignite = async function (opts, callback) {

	
	if (opts.prettyBoot == 'true')
		console.clear()

	if (opts.bootMessage == 'true')
		console.log(chalk.green('Preparing to boot Haluka'))

	try {
		let haluka = Haluka.getInstance(opts.appPath)
		require('./lib/events.js')
        // Loads all the event handlers from applciation
        eventLoader(haluka.eventsPath())

		let appData = loadAppData(haluka)
        haluka.boot(appData)

        // Database
        if (config('database'))
            await haluka.use('Database').setupAll()

        // Non-CLI Services
        if (!haluka.isCLI()) {
            let r = setupRouter(haluka)

            const HttpDispatcher = opts.customDispatcher || require('./lib/http').default
            const dispatcher = new HttpDispatcher(r, { path: haluka.controllersPath() })
            let http = dispatcher.create(appData)

            // Loading middlewares

            if (env('AUTH')) {
                haluka.register('UserModel', () => opts.UserModel)
                let passport = use('Auth')
                http.use(passport.initialize())
                http.use(passport.session())
            }

            // Load Routes
            fs.readdirSync(haluka.routesPath()).forEach(x => r.group({}, x)) // TODO: check

            // Dispatch HTTP Routes
            dispatcher.dispatch(http, config('http.express.timeout'))

            // Start listening
            let port = env('PORT') || 3000
            http.listen({ port }, () => {
                app('Events').fire('Http.StartedListening', http, port)
            })
        }
        
		// Load Events here
		if (typeof(callback) === 'function')
            await callback(haluka)

		if (opts.bootMessage == 'true') {
			console.log()
			console.log(chalk.magenta('Your Haluka App booted successfully.'))
			console.log(chalk.blue('Thank you for choosing Haluka for your application.'))
			console.log()
			console.log(chalk.bold.green(`Your app is now available at ${chalk.blue.underline(config('app.url', 'http://localhost') + ':' + env('PORT', 3000))}`))
		}
	} catch (error) {
		new Youch(error, {})
            .toJSON()
            .then((output) => {
                console.log(forTerminal(output))
                process.exit(1)
            })
	}

}

const eventLoader = (path) => {
    if (fs.existsSync(path)) {
        requireAll({
            dirname: path,
            filter: /(.*)\.(js|ts)$/,
            excludeDirs: /^\.(git|svn)$/
        })
    }else {
        console.log(chalk.bold.yellow('Warning: Events folder not found in App directory. Ignoring event loading.'))
    }
}

const loadAppData = (haluka) => {    
    if (!fs.existsSync(haluka.appPath('app.js'))) {
        console.log(chalk.bold.red('Error: App Data file (app.js) not found in app directory.'))
        process.exit(1)
    }

    return require(haluka.appPath('app'))
    
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