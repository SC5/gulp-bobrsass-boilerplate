var express = require('express'),
    app = express(),
    https = require('https'),
    fs = require('fs'),
    url = require('url'),
    pkg = require('../package.json'),
    config = {
      version: pkg.version,
      port: process.env.PORT || pkg.config.port,
      hostname: process.env.HOSTNAME || pkg.config.hostname,
      https: pkg.config.https || false
    };

// Poor man's rewrite
app.use(function(req, res, next) {
  var u = url.parse(req.url),
      // Rewrite urls of form 'main' & 'sample' to blank
      rule = /^\/(main|sample)\/?/;

  if (u.pathname.match(rule)) {
    u.pathname = u.pathname.replace(rule, '/');
    var original = req.url;
    req.url = url.format(u);
    console.log('Rewrote', original, 'to', req.url);
  }

  next();
});
app.use(express.static(__dirname + '/../dist'));

var proto = 'http';
if (config.https) {
  https.createServer({  
    key: fs.readFileSync('server/key.pem'),
    cert: fs.readFileSync('server/cert.pem')
  }, app).listen(config.port);
  proto='https';
} else {
  app.listen(config.port);
}

console.log('Stub server (' + proto + ') running on port ' + config.port);
