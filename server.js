var express = require('express');
var bodyParser = require('body-parser');
var uuid = require('uuid');

var app = express();
var port = process.env['PORT'] || 3000;
var config = {}
var request = require(__dirname + '/index.js')(config);

app.use(bodyParser.json());

app.post('/', function (req, res) {
  var id = uuid.v1();
  var opts = req.body;
  request(opts, function(err, response, body) {
    if (err) {
      console.log(err);
      res.send(500, { type: 'error', 'message': err.message });
    }
    if(String(response.statusCode).match(/^5|^4/ig)) {
      return res.status(response.statusCode).send(response);
    }
    return res.send(response);
  });
});

if (!module.parent) {
  var server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
  });
}
