/**
 * nossock.js - losin adapter for nossock
 *
 * @author Yaroslav Pogrebnyak <yyyaroslav@gmail.com>
 */

var _ = require('lodash'),
    jayschema = require('jayschema'),
    util = require('util'),
    shortId = require('shortid'),
    wrench = require('wrench'),
    path = require('path'),
    format = util.format;

/**
 * Registry name example:
 *
 * {
 *     'messageName': {
 *         'type': 'pub-sub | req-res',
 *         'ttl': 10,  // in seconds, for req-res messages
 *         'msg | req | res': { JaySchema }
 *     }
 * }
 *
 */

/**
 * Losin constructor
 */
var Losin = function(socket, registry, config) {

    this.config = _.merge({
        'reqTimeout': 5,
        'processInvalid': false,
        'validationErrorHandler': function(name, errors) {
            console.warn('Validation error:', '"'+name+'"', errors);
        }
    }, config);

    this.registry = registry || {};

    this.socket = socket;

    /* Constants */
    this.REQ_PATTERN = new RegExp(/^req:(.+):([-_\w]+)$/g);

    /* Helpers */
    this._makeReqResNames = function(name, id) {
        id = id || shortId.generate();
        return [
            format('req:%s:%s', name, id),
            format('resp:%s:%s', name, id)
        ];
    };
};

/* ---------- Low-level ---------- */

Losin.prototype.close = function() {
    this.socket.end();
};

/* ------------------- Specs and validation -------------------- */

/**
 * Scan
 */
Losin.prototype.scan = function(basePath) {

    var self = this;

    var files = wrench.readdirSyncRecursive(basePath);

    _.each(files, function(file) {
        var fullPath = path.join(basePath, file);
        var content = require(fullPath);
        if (!Array.isArray(content)) {
            self.register(content);
        } else {
            _.each(content, _.bind(self.register, self));
        }
    });
};

/**
 * Register message or messages
 */
Losin.prototype.register = function(r) {
    _.merge(this.registry, r);
};

/**
 * isValid message or req/res
 */
Losin.prototype.isValid = function(name, body, type) {

    var exists = this.registry[name] && this.registry[name][type];

    var js = new jayschema(),
        errs = exists ? js.validate(body, this.registry[name][type]) : 'message not registered';

    if (_.isEmpty(errs)) {
        return true;
    } else {
        this.config.validationErrorHandler(name, errs);
        return this.config.processInvalid;
    }
};

/* ------------------- Generic handling based on spec -------------------- */

/**
 * Handle message, inferrint it's type from spec in registry
 */
Losin.prototype.setupHandler = function(name, callback) {

    var self = this;
    if (!this.registry[name]) {
        throw new Error('No message in registry with the name "' + name + '"');
    }

    var type = this.registry[name].type;
    if (type === 'pub-sub') {
        this._handleMessage('on', name, callback);
    } else if (type === 'req-res') {
        this._handleRequest('on', name, callback);
    } else {
        throw new Error('Undefined type of message');
    }

};

/* ------------------- Pub/Sub messages -------------------- */

/**
 * Send message
 */
Losin.prototype.sendMessage = function(name, body) {
    if (this.isValid(name, body, 'msg')) {
        this.socket.send(name, body);
    }
};

/**
 * Handle message
 */
Losin.prototype._handleMessage = function(typ, name, callback) {

    var self = this;

    var handler = function(data) {
        if (self.isValid(name, data, 'msg')) {
            return callback(data);
        }
    };

    this.socket[typ](name, handler);

    return {
        name: name,
        handler: handler,
        off: function() {
            self.socket.removeListener(name, handler);
        }
    };
};

/**
 * Handle message
 */
Losin.prototype.onMessage = function(name, callback) {
    return this._handleMessage('on', name, callback);
};


/**
 * Handle message once
 */
Losin.prototype.onceMessage = function(name, callback) {
    return this._handleMessage('once', name, callback);
};


/* ------------------- Req/Res messages -------------------- */


/**
 * Send request and wait for response
 */
Losin.prototype.sendRequest = function(name, body, callback) {

    var self = this;

    if (!this.isValid(name, body, 'req')) {
        throw new Error('Invalid message');
    }

    var names = this._makeReqResNames(name),
        reqName = names[0],
        respName = names[1];

    var isGotResponse = false;

    self.socket.once(respName, function (resp) {
        clearTimeout(timeout);
        isGotResponse = true;
        callback(resp[0], resp[1]);
    });

    var timeout = setTimeout(function() {
        self.socket.removeAllListeners(respName);
        if (!isGotResponse) {
            callback(new Error('Timeout'));
        }
    }, 1000 * ( self.registry[name] ? self.registry[name].ttl : self.config.reqTimeout ) );

    self.socket.send(reqName, body);

};

/**
 * Handle request and provide response
 */
Losin.prototype._handleRequest = function(typ, name, callback) {

    var self = this;

    var handler = function(msg) {

        var match = null;

        if ((match = self.REQ_PATTERN.exec(msg.name)) === null) {
            return;
        }

        var gotName = match[1],
            id = match[2];

        if (gotName !== name) {
            return;
        }

        if (!self.isValid(name, msg.body, 'req')) {
            return;
        }

        callback(msg.body, function(err, respBody) {
            var respName = self._makeReqResNames(name, id)[1];
            self.socket.send(respName, [err, respBody]);
        });

    };

    this.socket[typ]('next', handler);

    return {
       name: name,
       handler: handler,
       off: function() {
           self.socket.removeListener(name, handler);
       }
   };

};

/**
 * Handle request
 */
Losin.prototype.onRequest = function(name, callback) {
    return this._handleRequest('on', name, callback);
};

/**
 * Handle request once
 */
Losin.prototype.onceRequest = function(name, callback) {
    return this.handleRequest('once', name, callback);
};



/* module exports */
NossockAdapter = Losin;
module.exports = NossockAdapter;

