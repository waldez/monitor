'use strict';

'use strict';
const http = require('http');
const urlUtil = require('url');

const chai = require('chai');
const chaiExclude = require('chai-exclude');
const expect = chai.expect;
const Promise = require('bluebird');

const Monitor = require('../src/monitor');

chai.use(chaiExclude);

describe('Monitor', function() {

    const monitor = new Monitor();
    let targetServer = null;


    before(async ()=> {

        targetServer = http.createServer((req, res) => {

            const url = urlUtil.parse(req.url, true);
            const {
                statusCode = 200,
                contentType = 'text/plain; charset=UTF-8',
                message = 'Ok'
            } = url.query;

            res.writeHead(statusCode, {'Content-Type': contentType});
            res.end(message);
        }).listen(1337);

    });

    after(async ()=> {

        monitor.destroy();
        targetServer.close();
    });

    it('should add the endpoint, receive message and remove the endpoint', async ()=> {

        const endpointId = 1;

        monitor.addEndpoint({
            'id': endpointId,
            'name': 'Ok',
            'url': 'http://localhost:1337?message=' + encodeURIComponent('I\'m Bitman!'),
            'checked': null,
            'created': new Date(),
            'check_interval': 1,
            'user_id': 1
        });

        const result = await new Promise((resolve, reject) => {
            monitor.once('monitorResult', (monitoringResult, endpoint) => {
                return endpoint.id === endpointId ? resolve(monitoringResult) : reject('Wrong endpoint result!');
            });
        });
        monitor.removeEndpoint(endpointId);

        expect(result).excluding('timestamp').to.deep.equal({
            status_code: 200,
            payload: 'I\'m Bitman!'
        });
    });

    it('should add the endpoint, receive message, change the endpoint and remove it', async ()=> {

        const endpointId = 2;

        monitor.addEndpoint({
            'id': endpointId,
            'name': 'OkDouky',
            'url': 'http://localhost:1337?contentType=' + encodeURIComponent('application/json')
                + '&statusCode=500&message=' + encodeURIComponent('{"error":"Huston, we\'ve got a problem"}'),
            'checked': null,
            'created': new Date(),
            'check_interval': 1,
            'user_id': 1
        });

        let result = await new Promise((resolve, reject) => {
            monitor.once('monitorResult', (monitoringResult, endpoint) => {
                return endpoint.id === endpointId ? resolve(monitoringResult) : reject('Wrong endpoint result!');
            });
        });

        expect(result).excluding('timestamp').to.deep.equal({
            status_code: 500,
            payload: '{"error":"Huston, we\'ve got a problem"}'
        });

        monitor.changeEndpoint(endpointId, {
            url: 'http://localhost:1337'
        });

        result = await new Promise((resolve, reject) => {
            monitor.once('monitorResult', (monitoringResult, endpoint) => {
                return endpoint.id === endpointId ? resolve(monitoringResult) : reject('Wrong endpoint result!');
            });
        });

        expect(result).excluding('timestamp').to.deep.equal({
            status_code: 200,
            payload: 'Ok'
        });

        monitor.removeEndpoint(endpointId);
    });
});
