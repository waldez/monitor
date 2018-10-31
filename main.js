'use strict';

async function start(config, Db, Monitor, Server, action) {

    const db = new Db(config.mysql);
    const monitor = new Monitor();
    const serverOptions = Object.assign({}, config.server, { db, monitor });

    const server = new Server(serverOptions);
    await server.start();

    if (action === 'clearDb') {
        await db.removeTables();
        return await server.stop();
    }

    if (action === 'fakeUsers') {
        const users = await db.find('Users');
        if (users.length === 0) {
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

            await db.insert('Users', initialUsers[0]);
            await db.insert('Users', initialUsers[1]);
        }

        return await server.stop();
    }

    console.log(`Server listening at port: ${config.server.port}`);
}

start(
    require('./src/config'),
    require('./src/db'),
    require('./src/monitor'),
    require('./src/server'),
    process.argv[2]
);
