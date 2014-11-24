var assert = require('assert');
var supertest = require('supertest');
var fixtures = require('./fixtures');
var _ = require('lodash');
var ack = require('ac-koa');
var MemoryStore = require('ac-node').MemoryStore;
var MockHttpClient = require('ac-node-hipchat/test/mock-http-client');
var Promise = require('rsvp').Promise;

var tenant = fixtures.load('tenant.json');
var installable = fixtures.load('tenant-installable.json');

describe('ack hipchat add-on', function () {

  var store = MemoryStore();
  var server;
  var client;
  var tenantStore;
  var addon;

  beforeEach(function (done) {
    var pkg = fixtures.load('package.json');
    pkg = _.extend({}, pkg);
    pkg.test = _.extend({}, pkg.test, {
      hosts: ['*.hipchat.com']
    });

    var app = ack(pkg, {
      store: store,
      httpClient: MockHttpClient(10)
    });
    var scope = 'hipchat';

    addon = app.addon(scope, {
      capabilities: {
        hipchatApiConsumer: {
          scopes: ['send_notification']
        },
        installable: {
          allowRoom: true
        }
      },
    });

    tenantStore = store.narrow(scope).narrow('tenant');
    server = app.listen(done);
    client = supertest.agent(server);
  });

  afterEach(function (done) {
    server.close(done);
  });

  it('should support tenant installation', function (done) {
    var install = new Promise(function (resolve) {
      addon.onWebhook('install', function *() {
        resolve(this);
      });
    });
    tenantStore.get(tenant.id).then(function (value) {
      assert.ok(!value);
      client
        .post('/hipchat/addon/installable')
        .send(installable)
        .expect(204, function (err) {
          if (err) return done(err);
          tenantStore.get(tenant.id).then(function (value) {
            assert.deepEqual(value, tenant);
            return install.then(function (context) {
              assert.deepEqual(context.tenant, tenant);
              assert.ok(context);
              assert.ok(context.tenant);
              // TODO: should check that other services and values exist in the captured event context
              done();
            });
          }).catch(done);
        });
    }).catch(done);
  });

  it('should support tenant uninstallation', function (done) {
    var uninstall = new Promise(function (resolve) {
      addon.onWebhook('uninstall', function *() {
        resolve(this);
      });
    });
    tenantStore.get(tenant.id).then(function (value) {
      assert.deepEqual(value, tenant);
      client
        .delete('/hipchat/addon/installable/' + tenant.id)
        .expect(204, function (err) {
          if (err) return done(err);
          tenantStore.get(tenant.id).then(function (value) {
            assert.ok(!value);
            return uninstall.then(function (context) {
              assert.ok(context);
              assert.ok(context.tenant);
              assert.deepEqual(context.tenant.id, tenant.id);
              // TODO: should check that other services and values exist in the captured event context
              done();
            });
          }).catch(done);
        });
    }).catch(done);
  });

  it('should reject tenant installations failing to match a host whitelist', function (done) {
    var modified = _.extend({}, installable);
    modified.capabilitiesUrl = 'http://foo.com/v2/capabilities';
    client
      .post('/hipchat/addon/installable')
      .send(modified)
      .expect(403, done);
  });

  // TODO: test failed token gen rejecting with 403

});
