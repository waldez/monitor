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

        // {
        //     "name": "id",
        //     "specs": "bigint unsigned not null auto_increment"
        // },
        // {
        //     "name": "name",
        //     "specs": "VARCHAR(40)"
        // },
        // {
        //     "name": "url",
        //     "specs": "VARCHAR(1024)"
        // },
        // {
        //     "name": "created",
        //     "specs": "DATETIME"
        // },
        // {
        //     "name": "checked",
        //     "specs": "DATETIME"
        // },
        // {
        //     "name": "check_interval",
        //     "specs": "int unsigned"
        // },
        // {
        //     "name": "user_id",
        //     "specs": "bigint unsigned"
        // }

        // TODO: joi (ajv?) validation...

        const { name, url, interval } = req.body;

        const result = await db.insert('MonitoredEndpoints', {
            name,
            url,
            created: new Date(),
            'check_interval': interval,
            'user_id': req.user.id
        });

        // TODO:
        // monitor.addEndpoint(...);

        res.send({ monitoredEndpointId: result });
        next();
    });

    // Read
    server.get('/MonitoredEndpoint/:id', async (req, res, next) => {

        const id = parseInt(req.params.id);
        const endpoint = (await db.find('MonitoredEndpoints', { id, user_id: req.user.id }))[0];
        res.send(endpoint);
        next();
    });

    // Read - list
    server.get('/MonitoredEndpoints/list', async (req, res, next) => {

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
