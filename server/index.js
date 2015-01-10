var express = require('express'),
    app = express(),
    pkg = require('../package.json'),
    config = {
      version: pkg.version,
      port: process.env.PORT || pkg.config.port,
      hostname: process.env.HOSTNAME || pkg.config.hostname
    };

app.use(express.static(__dirname + '/../dist'));
app.listen(config.port);

console.log('Stub server running on port ' + config.port);
