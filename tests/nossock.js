/**
 * simple.js - simple losin test
 * @author Yaroslav Pogrebnyak <yyyaroslav@gmail.com>
 */

var _ = require('lodash'),
    losin = require('../lib')('nossock'),
    nossock = require('nossock');

var factory = losin.createLosinFactory();
factory.scan(__dirname + '/specs');

/* exports */
module.exports = {

    'Test simple on nossock': function(test) {


        /* ---------- create server ---------- */

        var server = nossock.createServer('tcp', {port: 8797}, function(socket) {

            var lo = factory.createLosin(socket);

            lo.onClose(function() {
                console.log('onClose nossock server');
            });

            /**
             * Handle info message
             */
            var e = lo.handle('info', function(msg) {
                console.log(msg);
                e.off();
            });

            /**
             * Handle sum request
             */
            lo.handle('sum', function(nums, sendResponse) {
                sendResponse(null, _.reduce(nums, function(s,e) {return s+e; }, 0));
                lo.close()
                server.close();
            });

        }).listen(8797);


        /* ---------- create client ---------- */

        nossock.createClient('tcp', {port: 8797}, function(socket) {

            var lo = factory.createLosin(socket);

            lo.onClose(function() {
                console.log('onClose nossock client');
            });

            lo.sendMessage('info', 'hello world - 1');
            lo.sendMessage('info', 'hello world - 2');

            lo.sendRequest('sum', [1,2,3], function(err, data) {
                if (err) {
                    console.log('Error: ', err);
                } else {
                    console.log(data);
                    lo.close();
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

