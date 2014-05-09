// An example configuration file.
exports.config = {

  // Base url for relative urls
  baseUrl: 'http://localhost:8080/',

  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'chrome'
  },

  // Options to be passed to Jasmine-node.
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000
  }
  
};
