describe('main page', function() {

  it('should load', function() {
    browser.get('/main');

    var page = browser.driver.findElement(by.id('page'));

    expect(page.getText()).toMatch('If you can read this text, your stack should be alright.');
  });

});
