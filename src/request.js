// file: src/request.js
module.exports = function (config) {
  config = config || {};
  const request = config.request || require('request');
  return function (opts, done) {
    return request(opts, done);
  };
};
