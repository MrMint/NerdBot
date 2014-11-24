var assert = require('assert');
var co = require('co');
var decorator = require('../lib/decorator');
var fixtures = require('./fixtures');

var tenant = fixtures.load('tenant.json');

describe('ack hipchat decorate middleware', function () {

  var context;
  var decorate;

  var testLocalBaseUrl = 'http://example.com/hipchat';
  var testService = {test: true};

  function servicesFactory(tenant) {
    return {testService: testService};
  }

  var testAuthToken = '1234acbd';

  beforeEach(function *() {
    context = {};
  });

  beforeEach(function *() {
    context.authentication = {
      issuer: tenant,
      token: testAuthToken
    };
  });

  describe('in production', function () {

    beforeEach(function *() {
      decorate = decorator('production', testLocalBaseUrl, servicesFactory);
    });

    it('should decorate the koa context for a given tenant', function *() {
      yield co(decorate).bind(context);
      var tenantBaseUrl = tenant.links.base;
      assert.deepEqual(context.testService, testService);
      assert.deepEqual(context.locals, {
        localBaseUrl: testLocalBaseUrl,
        tenantBaseUrl: tenantBaseUrl,
        tenantScriptUrl: tenantBaseUrl + '/atlassian-connect/all.js',
        tenantStylesheetUrl: tenantBaseUrl + '/atlassian-connect/all.css',
        authToken: testAuthToken
      });
    });

  });

  describe('not in production', function () {

    beforeEach(function *() {
      decorate = decorator('development', testLocalBaseUrl, servicesFactory);
    });

    it('should decorate the koa context for a given tenant', function *() {
      yield co(decorate).bind(context);
      var tenantBaseUrl = tenant.links.base;
      assert.deepEqual(context.testService, testService);
      assert.deepEqual(context.locals, {
        localBaseUrl: testLocalBaseUrl,
        tenantBaseUrl: tenantBaseUrl,
        tenantScriptUrl: tenantBaseUrl + '/atlassian-connect/all-debug.js',
        tenantStylesheetUrl: tenantBaseUrl + '/atlassian-connect/all-debug.css',
        authToken: testAuthToken
      });
    });

  });

});
