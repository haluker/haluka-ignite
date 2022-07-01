const FactoryExpressDispatcher = require('haluka-express').default

class ExpressDispatcher extends FactoryExpressDispatcher {

    errorHandler(err, req, res, next) {
        app('Events').emit('Http.Error.*', err, req, res)
    }

    onRequest(req, res) {
        app('Events').fire('Http.RequestReceived', req, res)
    }

    onResponse(req, res, output) {
        app('Events').fire('Http.ResponseServed', req, res)
    }
}

exports.default = ExpressDispatcher