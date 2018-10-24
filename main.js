'use strict';

async function start(config, Db) {

    const db = new Db(config.mysql);
    await db.initialize();

    // TODO: temporary - remove when finished
    if (false) {

        await db.removeTables();
        return await db.end();
    }

    const initialUsers = [
        {
            'user_name': 'Applifting',
            'email': 'info@applifting.cz',
            'access_token': '93f39e2f-80de-4033-99ee-249d92736a25'
        },
        {
            'user_name': 'Batman',
            'email': 'batman@example.com',
            'access_token': 'dcb20f8a-5657-4f1b-9f7f-ce65739b359e'
        }
    ];

    const insertResult = await db.insert('Users', initialUsers[0]);

    console.log('!W! - insertResult:\n', JSON.stringify(insertResult, null, 2));

    // TODO: temporary - remove when finished
    await db.end();
}

start(
    require('./src/config'),
    require('./src/db')
);
