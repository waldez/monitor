'use strict';

'use strict';
const chai = require('chai');
const chaiExclude = require('chai-exclude');
const expect = chai.expect;

const config = require('../src/config');
const Db = require('../src/db');

chai.use(chaiExclude);

describe('Db', function() {

    let db = null;
    let batmanId = null;
    let batmanUser = {
        'user_name': 'Batman',
        'email': 'batman@example.com',
        'access_token': 'dcb20f8a-5657-4f1b-9f7f-ce65739b359e'
    };

    before(async ()=> {

        config.mysql.database = 'testdb';
        db = new Db(config.mysql);
        await db.initialize();
    });

    after(async ()=> {

        await db.removeTables();
        await db.end();
    });

    it('should insert Batman user', async ()=> {

        batmanId = await db.insert('Users', batmanUser);

        expect(batmanId).to.be.a('number');
    });

    it('should find Batman user using access token', async ()=> {

        const result = await db.find('Users', { access_token: batmanUser.access_token });

        expect(result[0]).excluding('id').to.deep.equal(batmanUser);
    });

    it('should update Batman with new email', async ()=> {

        const result = await db.update(
            'Users', { access_token: batmanUser.access_token }, { email: 'bruce@wayne.com' });

        expect(result.changedRows).to.equal(1);
    });
});
