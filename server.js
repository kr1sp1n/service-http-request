var debug = require('debug')('http')
var express = require('express')
var bodyParser = require('body-parser')
var uuid = require('uuid')
var _ = require('lodash')
var Handlebars = require('handlebars')

// json helper
Handlebars.registerHelper('json', function (obj) {
  if (obj === undefined) return '{}'
  if (typeof obj === 'string') obj = JSON.parse(obj)
  var str = JSON.stringify(obj)
  return new Handlebars.SafeString(str)
})

var config = require(__dirname + '/config.js')
var app = express()
var port = config.port || 3030
var endpoint = config.port || 'http://localhost:' + port
var request = require(__dirname + '/index.js')(config)

// db
var requests = {}
var responses = {}

app.use(bodyParser.json())

var getCallbackOptionsByStatusCode = function (statusCode, callbacks) {
  debug('RESPONSE', statusCode)
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

var formatResponse = function (response_template, data) {
  if (_.isObject(response_template)) {
    response_template = JSON.stringify(response_template)
  }
  var template = Handlebars.compile(response_template)
  var result = template(data)
  try {
    return JSON.parse(result)
  } catch (e) {
    console.log(e)
  }
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
  debug('New request %s %s ...', opts.method, opts.uri)
  debug(opts.headers)
  res.send(item)

  if (req.body.response) {
    opts.body = formatResponse(req.body.response, opts.body)
  }

  request(opts, function (err, response, body) {
    debug('... done')
    // debug(body)
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
        callback_opts.body = formatResponse(callback_opts.response, callback_opts.body)
      }
      responses[id] = response
      debug('Handle callbacks')
      request(callback_opts, function (err, response, body) {
        if (err) debug(err)
      })
    } else {
      debug('No callbacks!')
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
    debug('listening at http://%s:%s', host, port)
  })
}
