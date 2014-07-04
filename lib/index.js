/**
 * index.js - losin main module
 */

/* module exports */
module.exports = function(lib) {
    return require(__dirname + '/adapters/' + lib);
};

