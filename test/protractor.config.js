// An example configuration file.
exports.config = {
  capabilities: {
    browserName: 'phantomjs',
    'phantomjs.cli.jargs': '--web-security=false',
    'phantomjs.binary.path':'./node_modules/phantomjs/bin/phantomjs',
     version: '',
     platform: 'ANY'
 },
  framework: 'jasmine',
  // Options to be passed to Jasmine-node.
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000
  }
};
