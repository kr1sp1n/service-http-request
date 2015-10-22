var express = require('express')
var bodyParser = require('body-parser')
var uuid = require('uuid')
var _ = require('lodash')

var app = express()
var port = process.env['PORT'] || 3000
var config = {}
var request = require(__dirname + '/index.js')(config)

var endpoint = 'http://localhost:' + port

// db
var requests = {}
var responses = {}

app.use(bodyParser.json())

var getCallbackOptionsByStatusCode = function (statusCode, callbacks) {
  var defaults = { method: 'GET', json: true }
  var opts = _.assign(defaults, callbacks[statusCode])
  // Check failure
  if (statusCode.match(/^5|^4/)) {
    if (callbacks.hasOwnProperty('fail')) {
      opts = _.assign(opts, callbacks['fail'])
    }
  } else {
    if (callbacks.hasOwnProperty('success')) {
      opts = _.assign(opts, callbacks['success'])
    }
  }
  return opts
}

app.post('/', function (req, res) {
  console.log('POST')
  var resource_type = 'http_request'
  var id = uuid.v1()
  var defaults = { method: 'GET', json: true }
  var opts = _.assign(defaults, req.body)
  var item = {
    id: id,
    href: [ endpoint, resource_type, id ].join('/')
  }
  requests[id] = item
  res.send(item)
  request(opts, function (err, response, body) {
    if (err) console.log(err)
    var statusCode = String(response.statusCode)
    var callbacks = req.body.callbacks
    if (callbacks) {
      var callback_opts = getCallbackOptionsByStatusCode(statusCode, callbacks)
      callback_opts.body = response
      responses[id] = response
      request(callback_opts)
    }
  })
})

// GET resources
app.get('/http_request/:id', function (req, res) {
  var item = requests[req.params.id]
  res.send(item)
})

app.get('/http_response/:id', function (req, res) {
  var item = responses[req.params.id]
  res.send(item)
})

if (!module.parent) {
  var server = app.listen(port, function () {
    var host = server.address().address
    var port = server.address().port
    console.log('Example app listening at http://%s:%s', host, port)
  })
}
