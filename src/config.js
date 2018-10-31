'use strict';

function getEnvVar(name, defaultValue, parser) {

    let envVar = process.env[name];
    return envVar ? (typeof parser === 'function' ? parser(envVar) : envVar) : defaultValue;
}

const schemaPath = getEnvVar('DB_SCHEMA_PATH', './tablesSchema.json');

module.exports = {
    mysql: {
        host: getEnvVar('DB_HOST', 'localhost'),
        port: getEnvVar('DB_PORT', 3306, parseInt),
        user: getEnvVar('DB_USER', 'root'),
        database : getEnvVar('DB_DATABASE', 'monitor'),
        password: getEnvVar('DB_PWD', 'einZweiDrei'),
        tablesSchema: require(schemaPath)
    },
    server: {
        port: getEnvVar('SERVER_PORT', 8888, parseInt)
    }
};
