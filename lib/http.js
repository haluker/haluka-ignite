const FactoryExpressDispatcher = require('haluka-express').default

class ExpressDispatcher extends FactoryExpressDispatcher {

    errorHandler(err, req, res) {
        app('Events').emit('Http.Error.*', err, req, res)
    }

    onRequest({req, res, next}) {
        app('Events').fire('Http.RequestReceived', req, res)
        next()
    }

    onResponse({req, res}) {
        app('Events').fire('Http.ResponseServed', req, res)
    }
}

exports.default = ExpressDispatcher