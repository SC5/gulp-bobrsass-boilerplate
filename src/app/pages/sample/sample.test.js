describe('sample page', function() {

  beforeEach(function() {

  });

  it('should load', function() {
    browser.get('/sample');
    var page = element(by.id('page'));

    expect(page.getText()).toMatch('Hello from sample view!');
  });

  it('should contain', function() {
    browser.get('/sample');
    var serivceBoundElement = element(by.id('page')).element(by.binding('sampleController.valueFromService'));

    expect(serivceBoundElement.getText()).toMatch('Hello from service');
  });
});
