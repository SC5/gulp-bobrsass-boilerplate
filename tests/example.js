describe('test page', function() {

  it('should load', function() {
    browser.driver.get('http://localhost:8080/');

    var status = browser.driver.findElement(by.id('status'));

    expect(status.getText()).toEqual('If you can read this text, your stack should be alright.');
  });

});
