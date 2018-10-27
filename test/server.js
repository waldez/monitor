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
            await request(baseUrl + '/MonitorEndpoints/list');
        } catch (error) {
            expect(error['statusCode']).to.equal(403);
            return;
        }
        throw new Error('Request returned value, insted of error.');
    });

    it('should do something', async ()=> {

        const result = await request(baseUrl + '/MonitorEndpoints/list', {
            'auth': {
                'bearer': batmanUser['access_token']
            }
        });

        console.log('!W! - result:', result);

    });
});
