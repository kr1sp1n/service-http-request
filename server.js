var debug = require('debug')('http')
var express = require('express')
var bodyParser = require('body-parser')
var uuid = require('uuid')
var _ = require('lodash')
var Handlebars = require('handlebars')

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
  var resource_type = 'http_request'
  var id = uuid.v1()
  var defaults = { method: 'GET', json: true }
  var opts = _.assign(defaults, req.body)
  var item = {
    id: id,
    href: [ endpoint, resource_type, id ].join('/')
  }
  requests[id] = item
  debug('New request %s %s', opts.method, opts.uri)
  res.send(item)
  request(opts, function (err, response, body) {
    debug('...done')
    if (err) {
      debug(err)
      return
    }
    var statusCode = String(response.statusCode)
    var callbacks = req.body.callbacks
    if (callbacks) {
      var callback_opts = getCallbackOptionsByStatusCode(statusCode, callbacks)
      callback_opts.body = response
      if (callback_opts.response) {
        if (_.isObject(callback_opts.response)) {
          callback_opts.response = JSON.stringify(callback_opts.response)
        }
        var template = Handlebars.compile(callback_opts.response)
        var result = template(response)
        try {
          callback_opts.body = JSON.parse(result)
        } catch (e) {
          console.log(e)
        }
      }
      responses[id] = response
      debug('Handle callbacks')
      request(callback_opts, function (err, response, body) {
        if (err) debug(err)
      })
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
