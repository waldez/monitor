'use strict';

async function start(config, Db) {

    const db = new Db(config.mysql);
    await db.initialize();

    await db.destroy();
}

start(
    require('./src/config'),
    require('./src/db')
);
