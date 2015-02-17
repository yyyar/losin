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
             * Handle request
             */
            var e = lo.handle('sum', function(msg, sendResponse) {
                lo.close();
                server.close();
            });

        }).listen(8797);


        /* ---------- create client ---------- */

        nossock.createClient('tcp', {port: 8797}, function(socket) {

            var lo = factory.createLosin(socket);

            var noResponse = true;
            lo.onClose(function() {
                console.log('onClose nossock client');
            });

            lo.sendRequest('sum', [1,2,3], function(err, data) {
                noResponse = false;
                console.log('Response on closed socket', err, data);
            });

            console.log("Waiting several seconds to check there will be no timeout error for closed socket...");
            setTimeout(function() {
                test.ok(noResponse, "Should not get in reponse callback if socket was closed");
                test.done();
            }, 3000);

        });

    }
};


/**
 * Catch and print exceptions
 */
process.on('uncaughtException', function(err) {
  console.error(err.stack);
});

