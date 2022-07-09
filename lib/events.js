const chalk = require('chalk')
const Youch = require('youch')
const fs = require('fs')

 // Event Service
 let Event = use('Events')
 
 // App Providers Resolved
 Event.on('Application.Booted', function () {
		if (!app().isTesting())
			console.log(chalk.green('Application Loaded...'))
 })
 
 // App Providers Resolved
 Event.on('Database.Connected', function (event, conn) {
	if (!app().isTesting())
    	console.log(chalk.green(`Database successfully connected for '${conn}'`))
 })
 
 // Server Listening
 Event.on('Http.StartedListening', function (event, http, port) {
	if (!app().isTesting()) {
		console.log()
		console.log(chalk.green(`Server started listening at port ${port}`))
		if (!app().isCLI()) {
			console.log(chalk.bold.green(`Your app is now available at ${chalk.blue.underline(config('app.url', 'http://localhost' + env('PORT', 3000)))}`))
		}
	}
 })

// On Request Received and Route Found
Event.on('Http.RequestReceived', function (event, req) {
	if (!app().isTesting())
		if (config('app.debug')) 
			console.log(`${chalk.bold.yellowBright(req.method)} ${chalk.magentaBright(req.url)}`)
})

// On Response Served
Event.on('Http.ResponseServed', function (event, req, res) {
	if (!app().isTesting())
		if (config('app.debug')) 
			console.log(`Responded with Status Code: ${res.statusCode != 200 ? `${chalk.bold.redBright(res.statusCode)}` :  `${chalk.bold.greenBright(res.statusCode)}`}`)
})

// On HTTP Error
Event.on('Http.Error.*', async function (event, err, req, res) {
	res.status(err.status)
	if (config('app.debug')) 
		console.log(`Error Code: ${chalk.bold.redBright(res.statusCode)}`)

	if (config('app.env') === 'production') {
		if (err instanceof TypeError) err.message = 'The server encountered an internal error or misconfiguration and was unable to complete your request.'
		res.format({
			html: () => { let code = (err.status == 404) ? 404 : 500; res.send(Errors[code]) },
			json: () => { res.json({ status: "error", code: err.status, message: err.message }) },
			default: () => { res.status(406).json({ status: "error", code: 406, message: `Error Occurred but no any error response could be generated for the accepted type.` }) }
		})
	} else {
		res.format({
			html: async () => { res.send(await (new Youch(err, req)).toHTML()) },
			json: async () => { res.json(await (new Youch(err, req)).toJSON()) },
			default: () => { res.status(406).json({ status: "error", code: 406, message: `Error Occurred but no any error response could be generated for the accepted type.` }) }
		})
	}
})


const Errors = {
	404: fs.readFileSync(__dirname + '/../assets/404.html').toString(),
	500: fs.readFileSync(__dirname + '/../assets/500.html').toString()
}

if (!app().isCLI())
	app().terminating((h) => {
		h.resolve('server').close()
	})

if (config('database') && app().isResolved('Database')) 
	app().terminating(async h => {
		await use('Database').closeAll()
	})

if (!app().isTesting())
	app().terminating(() => {
		console.log(chalk.red(`Execution ended. Your app is terminating gracefully.`))
	})