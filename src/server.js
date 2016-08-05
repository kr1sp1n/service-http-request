// file: src/server.js
const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const extend = require("xtend");
const Handlebars = require('handlebars');
const aglio = require('aglio');
const fs = require('fs');
const qs = require('querystring');
const typeOf = require('just-typeof');
const request = require('./request.js')();

module.exports = (config) => {
  const blueprint = fs.readFileSync(__dirname + '/../API.md').toString();
  const blueprintOptions = {
    themeVariables: 'default',
    locals: {
      urldec: (value) => {
        var unescaped = qs.unescape(value);
        if (unescaped === '') unescaped = '/';
        return unescaped;
      },
    },
  };

  const port = config.port;
  const app = express();

  // json helper
  Handlebars.registerHelper('json', (obj) => {
    if (obj === undefined) return '{}';
    if (typeof obj === 'string') {
      try {
        obj = JSON.parse(obj);
      } catch (err) {
        console.log('json helper', err);
      }
    }
    const str = JSON.stringify(obj);
    return new Handlebars.SafeString(str);
  });

  app.use(bodyParser.json());

  const failResponse = (statusCode) => String(statusCode).match(/^5|^4/);
  const successResponse = (statusCode) => String(statusCode).match(/^2|^3/);

  const formatResponse = (responseTemplate, response, body) => {
    if (typeOf(responseTemplate) === 'object') {
      responseTemplate = JSON.stringify(responseTemplate);
    }
    const template = Handlebars.compile(responseTemplate);
    const result = template(response);
    try {
      return JSON.parse(result);
    } catch (err) {
      console.error('formatResponse', err);
    }
  };

  const handleError = (err, callbackOptions) => {
    callbackOptions.json = { error: JSON.parse(JSON.stringify(err)) };
    callback(callbackOptions);
  };

  const handleCallback = (callbackOptions, body) => {
    if (callbackOptions.method === 'POST') {
      if (typeOf(body) === 'object') {
        callbackOptions.json = body;
      } else {
        callbackOptions.body = body;
      }
    }
    callback(callbackOptions);
  };

  const callback = (options) => {
    request(options, (err, response, body) => { if (err) console.error(err) });
  };

  const handleCallbacks = (requestOptions) => {
    const defaults = { method: 'POST' };
    const headers = requestOptions.headers;
    return (err, response, body) => {
      const callbacks = requestOptions.callbacks;
      if (callbacks) {
        Object.keys(callbacks).forEach((key) => {
          const callbackOptions = extend(defaults, formatResponse(callbacks[key], response, body), { headers });
          if (err && key === 'fail') {
            handleError(err, callbackOptions);
          }
          if (key === 'finally') {
            handleCallback(callbackOptions, body);
          }
          if (response) {
            if (Number(key).toString() !== 'NaN' && response.statusCode === Number(key)) {
              handleCallback(callbackOptions, body);
            }
            if (key === 'fail' && failResponse(response.statusCode)) {
              handleCallback(callbackOptions, body);
            }
            if (key === 'success' && successResponse(response.statusCode)) {
              handleCallback(callbackOptions, body);
            }
          }
        });
      }
    };
  };

  // GET API docs
  app.get('/', (req, res) => {
    aglio.render(blueprint, blueprintOptions, (err, html, warnings) => {
      if (err) return console.error(JSON.stringify(err));
      if (warnings) console.log(JSON.stringify(warnings));
      res.send(html);
    });
  });

  // POST a HTTP request
  app.post('/', (req, res) => {
    // resource id
    const id = uuid.v1();
    // tracking id
    const trackingId = req.headers['x-tracking-id'] || uuid.v1();
    const defaults = { method: 'GET', json: true };
    const requestOptions = extend(defaults, req.body);
    const headers = { 'x-tracking-id': trackingId };
    requestOptions.headers = extend({}, req.body.headers, headers);
    res.status(201).send({ id, tracking_id: trackingId, request: requestOptions });
    request(requestOptions, handleCallbacks(requestOptions));
  });

  app.start = () => {
    app.listen(port, () => console.log('started on port', port));
  };

  return app;

};
