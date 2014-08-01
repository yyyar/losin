/**
 * index.js - losin main module
 * @author Yaroslav Pogrebnyak <yyyaroslav@gmail.com>
 */

var _ = require('lodash'),
    util = require('util'),
    Losin = require('./losin'),
    Factory = require('./factory');


/* module exports */
module.exports = function(typ) {
    return {
        createLosin: function(socket, config) {
            return new Losin(  new (require('./adapters/' + typ))(socket), config);
        },
        createLosinFactory: function(config) {
            return new Factory( require('./adapters/'+typ), config);
        },
    };
};

