/**
 * socket.io.js - socket.io adapter for losin
 *
 * @author Yaroslav Pogrebnyak <yyyaroslav@gmail.com>
 */

var _ = require('lodash');

/* module exports */

module.exports = function(socket) {

    var handlers = {},
        allHandlers = [],
        onceAllHandlers = [],
        onceHandlers = {};

    /* TODO: Refactor and use event emitter */

    socket.on('message', function(name, value) {

        _.each(handlers[name], function(h) {
            h(value);
        });

        _.each(allHandlers, function(h) {
            h({name:name, body:value});
        });

        _.each(onceAllHandlers, function(h) {
            h({name:name, body:value});
        });
        onceAllHandlers = [];

        _.each(onceHandlers[name], function(h) {
            h(value);
        });

        delete onceHandlers[name];
    });

    this.send = function(name, body) {
         socket.send(name, body);
    };

    this.removeListener = function(name, listener) {
        _.remove(handlers[name], function(l) { return l == listener; } );
    };

    this.removeAllListeners = function(name, listener) {
        delete handlers[name];
    };

    this.on = function(name, listener) {
        handlers[name] = handlers[name] || [];
        handlers[name].push(listener);
    };

    this.once = function(name, listener) {
        handlers[name] = handlers[name] || [];
        handlers[name].push(listener);
    };

    this.onAny = function(listener) {
        allHandlers.push(listener);
    };

    this.onceAny = function(listener) {
        allHandlers.push(listener);
    };

    this.removeListenerAny = function(listener) {
        _.remove(allHandlers, function(l) { return l == listener; } );
    };
};

