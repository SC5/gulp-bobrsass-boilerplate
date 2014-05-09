// An example configuration file.
exports.config = {

  // The file path to the selenium server jar ()
  seleniumServerJar: './node_modules/protractor/selenium/selenium-server-standalone-2.41.0.jar',

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
