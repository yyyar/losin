## Losin

[![Build Status](https://travis-ci.org/yyyar/losin.svg?branch=master)](https://travis-ci.org/yyyar/losin) [![NPM version](https://badge.fury.io/js/losin.svg)](http://badge.fury.io/js/losin)

Losin is a small lib that adds request-response and validation
capabilities to [nossock](https://github.com/yyyar/nossock) and [socket.io](http://socket.io/).
Wrappers for other libraries may come soon.


* **Validation**: Define messages schemas to validate them
* **Req-Res**: Request-response messages
* **Timeouts**: Support of timeout handlers in request messages

### Installation
```bash
$ npm install losin
```


### Usage

#### Creating Losin

```javascript
// only nossock adapter for now
var losin = require('../lib')('nossock'),
    lo = losin.createLosin(socket, config);

// Regestering messages (see validation section for more info on spec)
lo.register( /* {spec} */ );
```

config is optional and has the following format:
```javascript
{
  'reqTimeout': 5,
  'processInvalid': false,
  'validationErrorHandler': function(name, errors) {
      console.warn('Validation error', name, errors);
  }
}
```

##### Pub-sub

Handling:
```javascript
lo.handle('info', function(msg) {
    console.log(msg);
});
```

Sending:
```javascript
lo.sendMessage('info', 'Hello');
```

##### Req-res

Handling:
```javascript
lo.handle('someReq', function(req, sendResponse) {

    // success response
    sendResponse(null, req[0] + req[1]);
    
    // or error response
    // sendResponse('Something bad happened', null);
});

```

Sending:
```javascript
lo.sendRequest('sum', [1,2], function(err, data) {

    // err - if we got error response, or timeout happened
    if (err) {
        console.log(err);
    } else {
        console.log(data);
    }

});

```

#### Complete example

##### spec.json

```json
{

    "info": {
        "description": "Just some info message with payload",
        "type": "pub-sub",

        "msg": {
            "payload": {
                "type": "string"
            }
        }
    },

    "sum": {
        "description": "Sum endpoint that does sum of numbers",
        "type": "req-res",
        "ttl": 30,

        "req": {
            "description": "Array of numbers to sum",
            "type": "array",
            "items": { "type": "number"}
        },

        "res": {
            "description": "Sum of numbers",
            "type": "number"
        }
    }
}
```

##### server.js

```javascript
var _ = require('lodash'),
    losin = require('losin')('nossock'),
    nossock = require('nossock');

var spec = require('./spec.json');

 
/* ---------- create server ---------- */

var server = nossock.createServer('tcp', {port: 8797}, function(socket) {

  var lo = losin.createLosin(socket);
  lo.register(spec);

  /**
   * Handle info message
   */
  lo.handle('info', function(msg) {
      console.log(msg);
  });

  /**
   * Handle sum request
   */
  lo.handle('sum', function(nums, sendResponse) {
    sendResponse(null, _.reduce(nums, function(s,e) {return s+e; }, 0));
  });
}).listen(8797);
```


##### client.js
```javascript
var _ = require('lodash'),
    losin = require('losin')('nossock'),
    nossock = require('nossock');

var spec = require('./spec.json');

/* ---------- create client ---------- */

nossock.createClient('tcp', {port: 8797}, function(socket) {

  var lo = losin.createLosin(socket);
  lo.register(spec);

  /**
   * Send info message
   */
  lo.sendMessage('info', 'hello world!');

  /**
   * Send request
   */
   lo.sendRequest('sum', [1,2,3], function(err, data) {
       if (err) {
           console.log(err);
       } else {
           console.log(data);
       }
   });

});
 
```

### Losin protocol definition

Typically, message is a JSON document.

There are 2 types of messages in Losin:
* Pub/sub messages
* Request-respnse messages

#### Pub-sub messages
Pub-sub are plain messages. One side subscribes on it by name, and other side sends
it providing the same name and a message. Low-level protocol (socket.io, nossock or other)
should support this feature out of the box.

*message*
```
{
    "name": <name>
    "body": JSON
}
```

#### Req-res messages
Req-res is request-response messages. One side sends "request" message to another,
and awaits response for it. Other side provides handler of the request that receives
request message and sends back response (err, responseObject) where err is null when request was
successfully processed, and some object otherwise.

Requester side is responsive of generating unique identifier of request, and 
responder side is responsive of using the same identifier for a response.

There is a default timeout value for request-response messages parties should agree on,
after this time requester should receive timeout error in err, and implementation should stop
waiting the response after that time. Timeout value can be configurable for each
req-res messages individually in message spec (see validation section).

Implementations should follow these naming conventions for implemention req-res. 

*request*
```
{
    "name": "req:<name>:<id>",
    "body": JSON
}

<name> = name of the req-res message
<id> = generated unique id, it should match regexp: [-_\w]+, i.e. contain only numbers,
        alphabetic chars and '-' or '_' chars.

```

*response*
```
{
    "name": "res:<name>:<id>",
    "body": [ <err>, <reponse> ]
}


<name> = name of req-res-message
<id> = id send by requester in request
<err> = null | JSON
<response> = null | JSON
```

#### Specs & messages registry: Validation
Implementation may (it's optional, but very desirable) define a way of validation all
messages. Parties agree on messages and format of messages defining a registry of
messages specs. Registry is a JSON document with the following structure:
```
{
    // pub-sub message
    "someMessage": {
        "description": "some literate description",
        "type": "pub-sub",
        "msg": { JaySchema }
    },

    // req-res message
    "someCommand": {
        "description": "some literate description",
        "type": "req-res",
        "ttl": 15, // time-to-live in seconds
        "req": { JaySchema },
        "res": { JaySchema }
    },

    // ...
    // other messages
    // ...
}
```

Registry is shared between parties so they could be sured they use the right messages and format.
JaySchema is javascript implementation of JSON schema validation. 
It follows [JSON Schema Draft v4](http://json-schema.org/documentation.html).


#### Tests
```bash
$ sudo npm install nodeunit -g
$ npm test
```

#### Author
* [Yaroslav Pogrebnyak](https://github.com/yyyar/)

#### License
MIT
