var chai = require('chai')
  , expect = chai.expect
  , should = chai.should()
  , sinon = require('sinon');

describe('HTTP-Request module', function() {

  var module = require(__dirname + '/../index.js');

  beforeEach(function() {
  });

  it('should return a function', function () {
    module.should.be.a('function');
  });

  describe('HTTP-Request function', function() {

    var m = null;
    var config = null;

    beforeEach(function() {
      config = {
        request: sinon.stub()
      };
      var err = null;
      var res = {};
      var body = {};
      config.request.yields(err, res, body);
      m = module(config);
    });

    it('should initialize without passing a config', function() {
      m = module();
    });

    it('should do a HTTP request', function(done) {
      var opts = {
        uri: 'http://localhost:3000',
        method: 'GET'
      };
      m(opts, function(err, res, body) {
        config.request.calledOnce.should.be.ok
        return done(err);
      });
    });
  });
});
