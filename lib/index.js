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
        createLosin: function(socket) {
            return new Losin(  new (require('./adapters/' + typ))(socket)  );
        },
        createLosinFactory: function() {
            return new Factory( require('./adapters/'+typ));
        },
    };
};

