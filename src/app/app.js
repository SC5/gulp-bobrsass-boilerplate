var app = require('./app.js'),
    $ = require('jquery');

function start() {
  // Start the app here
  $('#status').html('If you can read this text, your stack should be alright.');
}

exports = module.exports = {
  start: start
};
