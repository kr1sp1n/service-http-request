const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const sinon = require('sinon');

describe('request module', function () {

  var module = require(__dirname + '/../src/request.js');

  beforeEach(function () {
  });

  it('should return a function', function () {
    module.should.be.a('function');
  });

  describe('request function', function () {

    var m = null;
    var config = null;

    beforeEach(function () {
      config = {
        request: sinon.stub(),
      };
      var err = null;
      var res = {};
      var body = {};
      config.request.yields(err, res, body);
      request = module(config);
    });

    it('should initialize without passing a config', function () {
      request = module();
      request.should.be.a('function');
    });

    it('should do a HTTP request', function (done) {
      var options = {
        uri: 'http://localhost:3000',
        method: 'GET',
      };
      request(options, function (err, res, body) {
        config.request.calledOnce.should.be.ok;
        return done(err);
      });
    });
  });
});
