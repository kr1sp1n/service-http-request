var express = require('express');
var bodyParser = require('body-parser');
var uuid = require('uuid');
var _ = require('lodash');
var async = require('async');

var app = express();
var port = process.env['PORT'] || 3000;
var config = {}
var request = require(__dirname + '/index.js')(config);

var endpoint = 'http://localhost:' + port;

// db
var requests = {};
var responses = {};

app.use(bodyParser.json());

var getCallbackOptionsByStatusCode = function(statusCode, callbacks) {
  var defaults = { method: 'PUT', json: true };
  var opts = _.assign(defaults, callbacks[statusCode]);
  // Check failure
  if(statusCode.match(/^5|^4/)) {
    if (callbacks.hasOwnProperty('fail')) {
      opts = _.assign(opts, callbacks['fail']);
    }
  }
  //
  // if (err) {
  //   if(callbacks.hasOwnProperty('err')) {
  //     uri = callback['err'];
  //   }
  // }
  return opts;
};

app.post('/', function (req, res) {
  var resource_type = 'http_request';
  var id = uuid.v1();
  var defaults = { method: 'GET', json: true };
  var opts = _.assign(defaults, req.body);
  var item = {
    id: id,
    href: [ endpoint, resource_type, id ].join('/')
  };
  requests[id] = item;
  res.send(item);
  request(opts, function(err, response, body) {
    var statusCode = String(response.statusCode);
    var callbacks = req.body.callbacks;
    if(callbacks) {
      var callback_opts = getCallbackOptionsByStatusCode(statusCode, callbacks);
      callback_opts.body = response;
      responses[id] = response;
      console.log('callback!');
      console.log(callback_opts);
      request(callback_opts);
    }
  });
});

// GET resources
app.get('/http_request/:id', function(req, res) {
  var item = requests[req.params.id];
  res.send(item);
});

app.get('/http_response/:id', function(req, res) {
  var item = responses[req.params.id];
  res.send(item);
});

var pipelines = {
  'coord_to_lat_lon_array': {
    fn: function(coord) {
      return [coord.lat, coord.lon]
    }
  },
  'extract_coord': {
    fn: function(obj) {
      return obj.coord
    }
  },
  '123': {
    pipes: [
      {
        uri: [ endpoint, 'pipeline', 'extract_coord'].join('/')
      },
      {
        uri: [ endpoint, 'pipeline', 'coord_to_lat_lon_array'].join('/')
      }
    ]
  }
};

app.put('/pipeline/:id/step/:index', function(req, res) {
  console.log('step', req.params.index);
  res.send({});
})

var getRequests = function(defaults, pipes) {
  var requests = [ async.constant(pipes[0]) ];
  for(var i=0; i < pipes.length; i++) {
    var fn = function(opts, next) {
      var config = _.assign(defaults, opts);
      console.log(config);
      next(null, i);
    };
    requests.push(fn);
  };
  return requests;
};

// CALLBACK handling with pipelines
app.put('/pipeline/:id', function(req, res) {
  console.log('PUT /pipeline/' + req.params.id);
  var data = req.body;
  res.send({});
  var pipeline = pipelines[req.params.id]
  if (pipeline) {
    var pipes = pipeline.pipes;
    if(pipes) {
      var defaults = { method: 'PUT', json: true };
      async.waterfall(getRequests(defaults, pipes), function(err, result) {
        // console.log(result);
      });

      // for(var i=0; i < pipes.length; i++) {
      //   var config = _.assign(defaults, pipes[i]);
      //   console.log(config);
      //   var next = pipes[i+1];
      //   if (next) {
      //     pipes[i].callbacks = {
      //       "200": next
      //     };
      //   }
      // }
    }
  }
});

if (!module.parent) {
  var server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
  });
}
