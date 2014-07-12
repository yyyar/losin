/**
 * simple.js - simple losin test
 */

var _ = require('lodash'),
    Losin = require('../lib')('nossock'),
    nossock = require('nossock');

var spec = require('./specs/simple.json');

/* exports */
module.exports = {

    'Test simple': function(test) {


        /* ---------- create server ---------- */

        var server = nossock.createServer('tcp', {port: 8797}, function(socket) {

            var lo = new Losin(socket);
            lo.scan(__dirname + '/specs');

            /**
             * Handle info message
             */
            var e = lo.onMessage('info', function(msg) {
                console.log(msg);
                e.off();
            });

            /**
             * Handle sum request
             */
            lo.onRequest('sum', function(nums, sendResponse) {
                sendResponse(null, _.reduce(nums, function(s,e) {return s+e; }, 0));
                socket.end();
                server.close();
            });

        }).listen(8797);


        /* ---------- create client ---------- */

        nossock.createClient('tcp', {port: 8797}, function(socket) {

            var lo = new Losin(socket);
            lo.scan(__dirname + '/specs');

            lo.sendMessage('info', 'hello world - 1');
            lo.sendMessage('info', 'hello world - 2');

            lo.sendRequest('sum', [1,2,3], function(err, data) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(data);
                    test.done();
                }
            });

        });

    }
};


/**
 * Catch and print exceptions
 */
process.on('uncaughtException', function(err) {
  console.error(err.stack);
});

