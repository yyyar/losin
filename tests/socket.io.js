/**
 * io.js - socket.io losin test
 * @author Yaroslav Pogrebnyak <yyyaroslav@gmail.com>
 */

var _ = require('lodash'),
    losin = require('../lib')('socket.io');

var factory = losin.createLosinFactory();
factory.scan(__dirname + '/specs');

/* exports */
module.exports = {

    'Test losin on socket.io': function(test) {

        /* ---------- create server ---------- */

        var app = require('http').createServer(function(){}),
           io = require('socket.io').listen(app, {log:false});

        app.listen(8797);

        io.on('connection', function (socket) {

            var lo = factory.createLosin(socket);

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
                socket.disconnect();
                app.close();
            });
        });


        /* ---------- create client ---------- */

        var socket = require('socket.io-client').connect('http://localhost:8797');

        socket.on('connect', function(){

            var lo = factory.createLosin(socket);

            lo.sendMessage('info', 'hello world - 1');
            lo.sendMessage('info', 'hello world - 2');

            lo.sendRequest('sum', [1,2,3], function(err, data) {
                if (err) {
                    console.log('errrror', err);
                } else {
                    console.log(data);
                    socket.disconnect();
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

