var express = require('express'),
    app = express(),
    url = require('url'),
    pkg = require('../package.json'),
    config = {
      version: pkg.version,
      port: process.env.PORT || pkg.config.port,
      hostname: process.env.HOSTNAME || pkg.config.hostname
    };

// Poor man's rewrite
app.use(function(req, res, next) {
  var u = url.parse(req.url),
      // Rewrite urls of form 'main' & 'sample' to blank
      rule = /^\/(main|sample)/;

  if (u.pathname.match(rule)) {
    u.pathname = u.pathname.replace(rule, '/');
    var original = req.url;
    req.url = url.format(u);
    console.log('Rewrote', original, 'to', req.url);
  }

  next();
});
app.use(express.static(__dirname + '/../dist'));
app.listen(config.port);

console.log('Stub server running on port ' + config.port);
