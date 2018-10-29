'use strict';

const restify = require('restify');
const restifyErrors = require('restify-errors');
const validator = require('restify-ajv-middleware');
const Promise = require('bluebird');

function bindRoutes(server, db, monitor) {

    // check access token and get user document for all routes
    server.use(async (req, res, next) => {

        const auth = req.header('Authorization');
        const accessToken = auth ? auth.split(' ')[1] : null;

        if (!accessToken || accessToken.length !== 36) {
            return next(new restifyErrors.NotAuthorizedError('Missing or invalid access token'));
        }

        const user = (await db.find('Users', { access_token: accessToken }))[0];

        if (!user) {
            return next(new restifyErrors.NotAuthorizedError('Missing or invalid access token'));
        }

        req.user = user;
        next();
    });

    // CRUD for MonitoredEndpoints
    // Create
    server.post({
        path: '/MonitoredEndpoint',
        validation: {
            body: {
                type: 'object',
                properties: {
                    'name': { type: 'string', 'minLength': 3, 'maxLength': 40 },
                    'url': { type: 'string', 'minLength': 3, 'maxLength': 1024, format: 'uri' },
                    'check_interval': { type: 'number' }
                },
                required: ['name', 'url', 'check_interval'],
                additionalProperties: false
            }
        }
    }, async (req, res, next) => {

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
    server.get({
        path: '/MonitoredEndpoints'
    }, async (req, res, next) => {

        const endpoints = (await db.find('MonitoredEndpoints', { user_id: req.user.id }));
        res.send(endpoints);
        next();
    });

    // Read
    server.get({
        path: '/MonitoredEndpoint/:id',
        validation: {
            params: {
                type: 'object',
                properties: {
                    'id': { type: 'number' }
                },
                required: ['id'],
                additionalProperties: false
            }
        }
    }, async (req, res, next) => {

        const id = req.params.id;
        const endpoint = (await db.find('MonitoredEndpoints', { id, user_id: req.user.id }))[0];
        res.send(endpoint);
        next();
    });

    // Update
    server.put({
        path: '/MonitoredEndpoint/:id',
        validation: {
            params: {
                type: 'object',
                properties: {
                    'id': { type: 'number' }
                },
                required: ['id'],
                additionalProperties: false
            },
            body: {
                type: 'object',
                properties: {
                    'name': { type: 'string', 'minLength': 3, 'maxLength': 40 },
                    'url': { type: 'string', 'minLength': 3, 'maxLength': 1024, format: 'uri' },
                    'check_interval': { type: 'number' }
                },
                additionalProperties: false
            }
        }
    }, async (req, res, next) => {

        const id = req.params.id;
        await db.update('MonitoredEndpoints', { id, user_id: req.user.id }, req.body);
        res.send({ updatedId: id });
        next();
    });

    // Delete
    server.del({
        path: '/MonitoredEndpoint/:id',
        validation: {
            params: {
                type: 'object',
                properties: {
                    'id': { type: 'number' }
                },
                required: ['id'],
                additionalProperties: false
            }
        }
    }, async (req, res, next) => {

        const id = req.params.id;
        await db.remove('MonitoredEndpoints', { id, user_id: req.user.id });
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
        server.use(restify.plugins.bodyParser({ mapParams: !true }));
        server.use(restify.plugins.acceptParser(server.acceptable));


        const val = validator({
            coerceTypes: true,
            allErrors: true,
            // TODO: make errors more friendly for the client (there is option 'info' in restify-errors, make it work)
            errorTransformer: (validationInput, errors) => JSON.stringify({ validationInput, errors }, null, 2),
            errorResponder: (transformedErr, req, res, next) =>
                next(new restifyErrors.BadRequestError(transformedErr)),
            // changes the request keys validated
            keysToValidate: ['params', 'body', 'query'/*, 'user', 'headers', 'trailers'*/]
        });

        // TODO - FIX: this middleware expects to have validation object in req.route.validation
        // I don't know, if this is just mismatch of versions,
        // but unfortunately I don't have time to investigate it further
        const fixedValidator = (req, res, next) => {

            if (!req.route.validation && req.route.spec && req.route.spec.validation) {
                req.route.validation = req.route.spec.validation;
            }

            return val(req, res, next);
        };

        // use AJV for validation
        server.use(fixedValidator);

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
