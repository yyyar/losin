/**
 * scanner.js - scan registry from json files
 * @author Yaroslav Pogrebnyak <yyyaroslav@gmail.com>
 */

var _ = require('lodash'),
    wrench = require('wrench'),
    path = require('path'),
    fs = require('fs');

/**
 * Scan specs from files in directory (recoursively)
 */
var scanSpecs = module.exports = function(basePath) {

    var files = wrench.readdirSyncRecursive(basePath),
        registry = {};

    _.each(files, function(file) {
        var fullPath = path.join(basePath, file);

        // Skip not .js or .json files
        if (!fs.statSync(fullPath).isFile() || ! _.contains(['.js', '.json'], path.extname(fullPath))) {
            return;
        }

        var content = require(fullPath);
        if (!Array.isArray(content)) {
            _.merge(registry, content);
        } else {
            _.each(content, function(c) {
                _.merge(registry, c);
            });
        }
    });

    return registry;
};

