'use strict';

const restify = require('restify');
const errors = require('restify-errors');
const Promise = require('bluebird');

function bindRoutes(server, db, monitor) {

    // check access token and get user document for all routes
    server.use(async (req, res, next) => {

        const auth = req.header('Authorization');
        const accessToken = auth ? auth.split(' ')[1] : null;

        if (!accessToken || accessToken.length !== 36) {
            return next(new errors.NotAuthorizedError('Missing or invalid access token'));
        }

        const user = (await db.find('Users', { access_token: accessToken }))[0];

        if (!user) {
            return next(new errors.NotAuthorizedError('Missing or invalid access token'));
        }

        req.user = user;
        next();
    });

    // CRUD for MonitorEndpoints
    // Read - list
    server.get('/MonitorEndpoints/list', (req, res, next) => {

        // TODO:
        res.send('hello ' + req.user['user_name']);
        next();
    });


}

class Server {

    constructor({ db, port = 8080, monitor }) {

        if (!db) throw new Error('Missing parameter db!');
        if (!monitor) throw new Error('Missing parameter monitor!');

        const server = restify.createServer();

        this.port = port;
        this.server = server;

        server.listenAsync = Promise.promisify(server.listen, { context: server });
        server.closeAsync = Promise.promisify(server.close, { context: server });

        bindRoutes(server, db, monitor);
    }

    start() {

        return this.server.listenAsync(this.port);
    }

    stop() {

        return this.server.closeAsync();
    }
}

module.exports = Server;
