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

    // CRUD for MonitoredEndpoints
    // Create
    server.post('/MonitoredEndpoint', async (req, res, next) => {

        // TODO: joi (ajv?) validation... & remove parseInt()
        // req.body

        const result = await db.insert('MonitoredEndpoints', {
            name: req.body.name,
            url: req.body.url,
            created: new Date(),
            'check_interval': req.body['check_interval'],
            'user_id': req.user.id
        });

        // TODO:
        // monitor.addEndpoint(...);

        res.send({ createdId: result });
        next();
    });

    // Read - list
    server.get('/MonitoredEndpoints', async (req, res, next) => {

        const endpoints = (await db.find('MonitoredEndpoints', { user_id: req.user.id }));
        res.send(endpoints);
        next();
    });

    // Read
    server.get('/MonitoredEndpoint/:id', async (req, res, next) => {

        const id = req.params.id;
        const endpoint = (await db.find('MonitoredEndpoints', { id, user_id: req.user.id }))[0];
        res.send(endpoint);
        next();
    });

    // Update
    server.put('/MonitoredEndpoint/:id', async (req, res, next) => {

        // TODO: joi (ajv?) validation... & remove parseInt()
        const id = parseInt(req.params.id);
        await db.update('MonitoredEndpoints', { id, user_id: req.user.id }, req.body);
        res.send({ updatedId: id });
        next();
    });

    // Delete
    server.del('/MonitoredEndpoint/:id', async (req, res, next) => {

        // TODO: joi (ajv?) validation... & remove parseInt()
        const id = parseInt(req.params.id);
        await db.remove('MonitoredEndpoints', { id, user_id: req.user.id }, req.body);
        res.send({ removedId: id });
        next();
    });
}

class Server {

    constructor({ db, port = 8080, monitor }) {

        if (!db) throw new Error('Missing parameter db!');
        if (!monitor) throw new Error('Missing parameter monitor!');

        const server = restify.createServer();
        server.use(restify.plugins.queryParser({ mapParams: true }));
        server.use(restify.plugins.bodyParser({ mapParams: true }));
        server.use(restify.plugins.acceptParser(server.acceptable));

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
