// file: index.js
const config = require('./config.js')();
const server = require('./src/server.js')(config);
server.start();
