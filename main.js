'use strict';

async function start(config, Db) {

    const db = new Db(config.mysql);
    await db.initialize();

    // TODO: temporary - remove when finished
    await db.end();
}

start(
    require('./src/config'),
    require('./src/db')
);
