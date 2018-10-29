'use strict';

'use strict';
const chai = require('chai');
const chaiExclude = require('chai-exclude');
const expect = chai.expect;

// const request = require('request-promise');

// const config = require('../src/config');
// const Db = require('../src/db');
const Monitor = require('../src/monitor');

chai.use(chaiExclude);

describe('Monitor', function() {

    const monitor = new Monitor();

    before(async ()=> {

    });

    after(async ()=> {

    });

    it('should ...', async ()=> {

        monitor.addEndpoint({
            'id': 1,
            'name': 'Google', // TODO: localhost:8888....
            'url': 'http://google.com',
            'checked': null,
            'created': new Date(),
            'check_interval': 30,
            'user_id': 1
        });

        const result = await new Promise((resolve, reject) => {
            monitor.once('monitorResult', (monitoringResult, endpoint) => resolve(monitoringResult));
        });

        console.log('!W! - result:', result);

        // expect(result.createdId).to.deep.equal(1);
    });

    xit('should do something', async ()=> {

        const result = await request(baseUrl + '/MonitoredEndpoints', {
            auth
        });

        console.log('!W! - result:', result);
    });
});
