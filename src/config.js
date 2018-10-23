'use strict';

function getEnvVar(name, defaultValue, parser) {

    let envVar = process.env[name];
    return envVar ? (typeof parser === 'function' ? parser(envVar) : envVar) : defaultValue;
}

module.exports = {
    mysql: {
        host: getEnvVar('DB_HOST', 'localhost'),
        port: getEnvVar('DB_PORT', 3306, parseInt),
        user: getEnvVar('DB_USER', 'root'),
        database : getEnvVar('DB_DATABASE', 'monitor'),
        password: getEnvVar('DB_PWD', 'einZweiDrei')
    }
};
