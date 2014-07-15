### Losin

[![Build Status](https://travis-ci.org/yyyar/losin.svg?branch=master)](https://travis-ci.org/yyyar/losin) [![NPM version](https://badge.fury.io/js/losin.svg)](http://badge.fury.io/js/losin)

Losin is a small lib that adds request-response and validation capabilities to [nossock](https://github.com/yyyar/nossock).

Adapters for other libraries (socket.io, etc) will come soon.

* **Validation**: Define messages schemas to validate them
* **Req-Res**: Request-response messages
* **Timeouts**: Support of timeout handlers in request messages

#### Installation
```bash
$ npm install losin
```

#### Creating Losin adapter

```javascript
// only nossock adapter for now
var Losin = require('../lib')('nossock').Losin; 
 // spec is dictionary, see Validation section for details
var lo = new Losin(socket, spec, config);
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
lo.onMessage('info', function(msg) {
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
lo.onRequest('someReq', function(req, sendResponse) {

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

#### Valication & messages spec
Typically, you need to provide spec (dictionary) to Losin to enable validation.
Validation happens by defining JaySchema.
It is JSON and has the following format:
```javascript
{
   // ...
   
    // pub-sub message
    "someMessage": {
        "type": "pub-sub",     
        "msg": { JaySchema }
    },
  
    // req-res message
    "someReqRes": {
        "type": "req-res",
        "ttl": 10,  // in seconds
        "req": { JaySchema },
        "res": { JaySchema }
    }
  
   //...
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
    Losin = require('losin')('nossock').Losin,
    nossock = require('nossock');

var spec = require('./spec.json');

 
/* ---------- create server ---------- */

var server = nossock.createServer('tcp', {port: 8797}, function(socket) {

  var lo = new Losin(socket, spec);

  /**
   * Handle info message
   */
  lo.onMessage('info', function(msg) {
      console.log(msg);
  });

  /**
   * Handle sum request
   */
  lo.onRequest('sum', function(nums, sendResponse) {
    sendResponse(null, _.reduce(nums, function(s,e) {return s+e; }, 0));
  });
}).listen(8797);
```


##### client.js
```javascript
var _ = require('lodash'),
    Losin = require('losin')('nossock').Losin,
    nossock = require('nossock');

var spec = require('./spec.json');

/* ---------- create client ---------- */

nossock.createClient('tcp', {port: 8797}, function(socket) {

  var lo = new Losin(socket, spec);

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


#### Tests
```bash
$ sudo npm install nodeunit -g
$ npm test
```

#### Author
* [Yaroslav Pogrebnyak](https://github.com/yyyar/)

#### License
MIT
