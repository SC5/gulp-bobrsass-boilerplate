describe('Sample service', function() {

  beforeEach(module('pages.sample'));

  it('should have value', inject(function(SampleService) {
    expect(SampleService.value).toMatch('Hello from service');
  }));
});
