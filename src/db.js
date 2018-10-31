'use strict';

// using https://www.npmjs.com/package/sequelize or similar would be good idea,
// but for training purposes, let's go with bare mysql
const mysql = require('mysql');
const Promise = require('bluebird');

function buildTableSchemaString({ name, columns, constraints }) {

    const columnsStr = columns.map(c => c.name + ' ' + c.specs).join(', ');
    const constraintsStr = Array.isArray(constraints) && constraints.length > 0 ?
        ', ' + constraints.join(', ') :
        '';
    return `${name} ( ${columnsStr}${constraintsStr} )`;
}

function jsonToValuesClause(json, separator = ',') {

    return Object.keys(json).map(col => `\`${col}\` = ${mysql.escape(json[col])}`).join(' ' + separator + ' ');
}

function buildWhereClause(what) {

    return (what && Object.keys(what).length > 0) ? 'WHERE ' + jsonToValuesClause(what, 'AND') : '';
}

class Db {

    constructor(options = {}) {

        const { host, user, password, port, database, tablesSchema } = options;
        this.options = options;
        this.database = database;
        // TODO: go with something standardized
        this.tablesSchema = tablesSchema;
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
        await con.queryAsync('CREATE DATABASE IF NOT EXISTS ??', this.database);

        // switch to our DB
        await con.changeUserAsync({ database : this.database });

        // ensure tables exist
        await Promise.map(
            this.tablesSchema,
            schema => con.queryAsync('CREATE TABLE IF NOT EXISTS ' + buildTableSchemaString(schema))
        );
    }

    // Convenience functions. Could be improved:
    //  - JSON validation against schema (but for this, error from DB will suffice)
    //  - omit all those functions, create Model class which will accept schema and provide save, load
    //  - sanitization of data
    //  etc.

    async insert(tableName, data) {

        return (await this.connection.queryAsync('INSERT INTO ?? SET ?', [tableName, data]))[0].insertId;
    }

    async find(tableName, what, { orderBy, limit } = {}) {

        // ORDER BY id DESC LIMIT 50
        orderBy = orderBy ? ' ORDER BY ' + orderBy : '';
        limit = limit ? ' LIMIT ' + limit : '';

        return (await this.connection.queryAsync(
            'SELECT * FROM ?? ' + buildWhereClause(what) + orderBy + limit,
            [tableName]))[0];
    }

    async update(tableName, what, how) {

        return (await this.connection.queryAsync(
            'UPDATE ?? SET ' + jsonToValuesClause(how) + ' ' + buildWhereClause(what),
            [tableName]))[0];

    }

    async remove(tableName, what) {

        return (await this.connection.queryAsync(
            'DELETE FROM ?? ' + buildWhereClause(what),
            [tableName]))[0];
    }

    /**
     * Just for testing
     * @return {Promise<Array>}
     */
    removeTables() {

        // feel the destructive power of reverse!
        const tablesStr = [...this.tablesSchema].reverse().map(t => t.name).join(', ');
        return this.connection.queryAsync('DROP TABLE IF EXISTS ' + tablesStr);
    }

    async end() {

        return this.connection.endAsync();
    }
}

module.exports = Db;
