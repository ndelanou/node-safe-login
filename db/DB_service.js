const express = require('express');
const pg = require('pg');
const fs = require('fs');
const path = require('path');

var types = pg.types
types.setTypeParser(1114, function(stringValue) {
    return Math.floor(Date.parse(stringValue) / 1000)
})
console.log('runnning on: ' + process.env.PG_HOST)
var pg_config = {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: "testlogin",
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    max: 10,
    idleTimeoutMillis: 30000
}

const pool = new pg.Pool(pg_config)

pool.on('error', function(err, client) {
    console.error('idle client error', err.message, err.stack);
})

/* Custom connect function returning a client with automatic rollback */
var _connect = function(callback) {
    pool.connect(function(err, client, done) {

        // Create our custom client
        var mClient = {};
        mClient._client = client

        // Create a custom query function with automatic rollback on error
        mClient.query = function(mQuery, mValues, mCallback) {
            mClient._client.query(mQuery, mValues, function(err, res) {
                if (err) {
                    console.error(err);
                    mClient.rollback()
                }
                mCallback(err, res)
            });
        };

        // Add a rollback function to our custom client
        mClient.rollback = function() {
            mClient.query('ROLLBACK', [], function(err) {
                done(err);
            });
        };

        // Init our client with a 'BEGIN' query
        mClient.query('BEGIN', [], function(err) {
            if (!err) {
                // return the custom client and the custom 'done' function (calling a 'COMMIT' query automatically)
                callback(mClient, function() {
                    mClient.query('COMMIT', [], done)
                })
            }
        })
    });
}

var initDB = function() {
    var sqlPath = path.join(__dirname, 'Tables.sql');
    var initSQL = fs.readFileSync(sqlPath, 'utf8');
    console.log('DB - Starting connection')
    var time = process.hrtime()
    pool.query(initSQL, [], function(err, result) {
        var diff = process.hrtime(time);
        if (!err) { console.log('DB - Connection established in ' + diff[0] + ',' + diff[1] + ' seconds') } else { console.error(err) }
    });
};

initDB()

module.exports.connect = _connect;
module.exports.init = initDB;