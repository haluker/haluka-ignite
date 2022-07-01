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
			console.log(chalk.bold.green(`Your app is now available at ${chalk.blue.underline(config('app.url', 'http://localhost') + ':' + env('PORT', 3000))}`))
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
	let code = (err.status == 404) ? 404 : 500
	res.status(code)
	if (config('app.debug')) 
		console.log(`Error Code: ${chalk.bold.redBright(res.statusCode)}`)
	if (config('app.env') === 'production') {
		if (req.is('application/json'))
			res.json({ status: "error", code: code, message: err.message })
		else
			res.send(Errors[code])
	} else {
		if (req.is('application/json')) {
			res.send(await new Youch(err, req).toJSON())
		}
		else {
			res.send(await new Youch(err, req).toHTML())
		}
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

if (!app().isTesting())
	app().terminating(() => {
		console.log(chalk.red(`Execution ended. Your app is terminating gracefully.`))
	})