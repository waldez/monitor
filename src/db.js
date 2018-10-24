'use strict';

const mysql = require('mysql');
const Promise = require('bluebird');

const tablesSchema = require('./tablesSchema.json');

function buildTableSchemaString({ name, columns, constraints }) {

    const columnsStr = columns.map(c => c.name + ' ' + c.specs).join(', ');
    const constraintsStr = Array.isArray(constraints) && constraints.length > 0 ?
        ', ' + constraints.join(', ') :
        '';
    return `${name} ( ${columnsStr}${constraintsStr} )`;
}

class Db {

    constructor(options = {}) {

        const { host, user, password, port } = options;
        this.options = options;
        this.connection = Promise.promisifyAll(mysql.createConnection({
            host,
            user,
            password,
            port
        }), { multiArgs: true }); // because standard query returns result & fields
    }

    async initialize() {

        const con = this.connection;
        await con.connectAsync();

        // ensure DB exists
        await con.queryAsync(`CREATE DATABASE IF NOT EXISTS ${this.options.database}`);

        // switch to our DB
        await con.changeUserAsync({ database : this.options.database });

        // ensure tables exist
        await Promise.map(
            tablesSchema,
            schema => con.queryAsync('CREATE TABLE IF NOT EXISTS ' + buildTableSchemaString(schema))
        );
    }

    /**
     * Just for testing
     * @return {Promise<Array>}
     */
    removeTables() {

        // feel the destructive power of reverse!
        const tablesStr = [...tablesSchema].reverse().map(t => t.name).join(', ');
        return this.connection.queryAsync('DROP TABLE IF EXISTS ' + tablesStr);
    }

    async end() {

        return this.connection.endAsync();
    }
}

module.exports = Db;
