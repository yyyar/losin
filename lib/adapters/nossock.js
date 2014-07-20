/**
 * nossock.js - losin adapter for nossock
 *
 * @author Yaroslav Pogrebnyak <yyyaroslav@gmail.com>
 */

var _ = require('lodash');

/* module exports */

module.exports = function(socket) {

    this.send = function(name, body) {
        socket.send(name, body);
    };

    this.removeListener = function(name, listener) {
        socket.removeListener(name, listener);
    };

    this.removeAllListeners = function(name, listener) {
        socket.removeAllListeners(name, listener);
    };

    this.on = function(name, listener) {
        socket.on(name, listener);
    };

    this.once = function(name, listener) {
        socket.once(name, listener);
    };

    this.onAny = function(listener) {
        socket.on('next', listener);
    };

    this.onceAny = function(listener) {
        socket.once('next', listener);
    };

    this.removeListenerAny = function(listener) {
        socket.removeListener('next', listener);
    };
};

