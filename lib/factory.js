/**
 * losin.js - Losin generic class
 * @author Yaroslav Pogrebnyak <yyyaroslav@gmail.com>
 */

var _ = require('lodash'),
    scanSpecs = require('./scanner'),
    Losin = require('./losin');

/**
 * Losin Factory
 */
module.exports = function(Adapter, cfg) {

    var registry = {},
        config = cfg || {};

    this.scan = function(path) {
        registry = _.merge(registry, scanSpecs(path));
    };

    this.register = function(spec) {
        registry = _.merge(registry, spec);
    };

    this.createLosin = function(socket) {
        var lo = new Losin( new Adapter(socket), config);
        lo.register(registry);
        return lo;
    };

};

