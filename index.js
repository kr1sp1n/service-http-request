// file: index.js

var request = require('request');

module.exports = function(config) {
  return function (opts, done) {
    return request(opts, done);
  };
};
