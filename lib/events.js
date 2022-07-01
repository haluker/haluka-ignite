const chalk = require('chalk')
const Youch = require('youch')
const fs = require('fs')

 // Event Service
 let Event = use('Events')
 
 // Core Providers Resolved
 Event.on('Application.CoreProvidersResolved', /* istanbul ignore next */ function () {
     console.log(chalk.green('Core Service Providers Loaded...'))
 })
 
 // App Providers Resolved
 Event.on('Application.Booted', /* istanbul ignore next */ function () {
     console.log(chalk.green('Application Loaded...'))
 })
 
 // App Providers Resolved
 Event.on('Database.Connected', /* istanbul ignore next */ function (event, conn) {
     console.log(chalk.green(`Database successfully connected for '${conn}'`))
 })
 
 // Server Listening
 Event.on('Http.StartedListening', /* istanbul ignore next */ function (event, http, port) {
     console.log(chalk.green(`Server started listening at port ${port}`))
 })
 
 app().terminating(() => {
     console.log(chalk.red(`Execution ended. Your app is terminating gracefully.`))
 })


// On Request Received and Route Found
Event.on('Http.RequestReceived', function (event, req) {
	// if (config('core.app.debug')) 
	console.log(`${chalk.bold.yellowBright(req.method)} ${chalk.magentaBright(req.url)}`)
})

// On Response Served
Event.on('Http.ResponseServed', function (event, req, res) {
	if (config('core.app.debug')) 
		console.log(`Responded with Status Code: ${res.statusCode != 200 ? `${chalk.bold.redBright(res.statusCode)}` :  `${chalk.bold.greenBright(res.statusCode)}`}`)
})

// On HTTP Error
Event.on('Http.Error.*', async function (event, err, req, res) {
	if (config('core.app.env') === 'production') {
		let code = (err.status == 404) ? 404 : 500
		if (req.is('application/json'))
			req.status(code).json({ status: "error", code: code, message: err.message })
		else
			res.send(Errors[code])
		console.log(err)
	} else {
		if (req.is('application/json')) {
			res.send(await new Youch(err, req).toJSON())
		}
		else {
			res.send(await new Youch(err, req).toHTML())
		}
		console.log(`Error Code: ${chalk.bold.redBright(res.statusCode)}`)
	}
})


const Errors = {
	404: fs.readFileSync('./assets/404.html').toString(),
	500: fs.readFileSync('./assets/500.html').toString()
}