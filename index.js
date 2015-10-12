// file: index.js

module.exports = function(config) {
  config = config || {};
  var request = config.request || require('request');
  return function (opts, done) {
    return request(opts, done);
  };
};
