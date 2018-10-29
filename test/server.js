'use strict';

'use strict';
const chai = require('chai');
const chaiExclude = require('chai-exclude');
const expect = chai.expect;

const request = require('request-promise');

const config = require('../src/config');
const Db = require('../src/db');
const Server = require('../src/server');

chai.use(chaiExclude);

describe('Server', function() {

    let server = null;
    let db = null;
    const port = 8888;
    const baseUrl = `http://localhost:${port}`;
    const batmanUser = {
        'user_name': 'Batman',
        'email': 'batman@example.com',
        'access_token': 'dcb20f8a-5657-4f1b-9f7f-ce65739b359e'
    };

    const auth = { 'bearer': batmanUser['access_token'] };

    before(async ()=> {

        this.timeout(10000);

        config.mysql.database = 'testdb';
        db = new Db(config.mysql);
        await db.initialize();

        const batmanId = await db.insert('Users', batmanUser);
        expect(batmanId).to.be.a('number');

        server = new Server({
            port,
            db,
            monitor: {}
        });
        await server.start();
    });

    after(async ()=> {

        await server.stop();
        await db.removeTables();
        await db.end();
    });

    it('should return NotAuthorizedError', async ()=> {

        try {
            await request(baseUrl + '/MonitoredEndpoints');
        } catch (error) {
            expect(error['statusCode']).to.equal(403);
            return;
        }
        throw new Error('Request returned value, insted of error.');
    });

    it('should create Google endpoint', async ()=> {

        const result = await request(baseUrl + '/MonitoredEndpoint', {
            method: 'POST',
            auth,
            json: true,
            body: {
                name: 'Google',
                url: 'http://google.com',
                'check_interval': 30
            }
        });

        expect(result.createdId).to.deep.equal(1);
    });

    it('should return validation error', async ()=> {

        try {
            await request(baseUrl + '/MonitoredEndpoint', {
                method: 'POST',
                auth,
                json: true,
                body: {
                    // missing name
                    // name: 'Google',
                    url: 'http://google.com',
                    'check_interval': 30
                }
            });
        } catch ({error}) {
            const expectedError = [
                {
                    'keyword': 'required',
                    'dataPath': '.body',
                    'schemaPath': '#/properties/body/required',
                    'params': {
                        'missingProperty': 'name'
                    },
                    'message': 'should have required property \'name\''
                }
            ];
            expect(JSON.parse(error.message).errors).to.deep.equal(expectedError);
            return;
        }
        throw new Error('Request returned value, insted of error.');
    });

    it('should find Google endpoint', async ()=> {

        const result = await request(baseUrl + '/MonitoredEndpoint/1', {
            auth,
            json: true
        });

        expect(result).excluding('created').to.deep.equal({
            id: 1,
            name: 'Google',
            url: 'http://google.com',
            checked: null,
            'check_interval': 30,
            user_id: 1
        });
    });

    it('should create Applifting endpoint', async ()=> {

        const result = await request(baseUrl + '/MonitoredEndpoint', {
            method: 'POST',
            auth,
            json: true,
            body: {
                name: 'Applifting',
                url: 'http://www.applifting.cz',
                'check_interval': 25
            }
        });

        expect(result.createdId).to.deep.equal(2);
    });

    it('should list endpoints', async ()=> {

        const result = await request(baseUrl + '/MonitoredEndpoints', {
            auth,
            json: true
        });

        expect(result).excluding('created').to.deep.equal([
            {
                'id': 1,
                'name': 'Google',
                'url': 'http://google.com',
                'checked': null,
                'check_interval': 30,
                'user_id': 1
            }, {
                'id': 2,
                'name': 'Applifting',
                'url': 'http://www.applifting.cz',
                'checked': null,
                'check_interval': 25,
                'user_id': 1
            }
        ]);
    });

    it('should update Google endpoint', async ()=> {

        let result = await request(baseUrl + '/MonitoredEndpoint/1', {
            method: 'PUT',
            auth,
            json: true,
            body: {
                url: 'http://google.cz',
                'check_interval': 60
            }
        });

        expect(result.updatedId).to.equal(1);

        result = await request(baseUrl + '/MonitoredEndpoint/1', {
            auth,
            json: true
        });

        expect(result).excluding('created').to.deep.equal({
            id: 1,
            name: 'Google',
            url: 'http://google.cz',
            checked: null,
            check_interval: 60,
            user_id: 1
        });
    });

    it('should remove Google endpoint', async ()=> {

        let result = await request(baseUrl + '/MonitoredEndpoint/1', {
            method: 'DELETE',
            auth,
            json: true
        });

        expect(result.removedId).to.deep.equal(1);

        result = await request(baseUrl + '/MonitoredEndpoints', {
            auth,
            json: true
        });

        expect(result).excluding('created').to.deep.equal([
            {
                'id': 2,
                'name': 'Applifting',
                'url': 'http://www.applifting.cz',
                'checked': null,
                'check_interval': 25,
                'user_id': 1
            }
        ]);
    });
});
