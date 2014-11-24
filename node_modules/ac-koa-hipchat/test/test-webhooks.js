var assert = require('assert');
var supertest = require('supertest');
var fixtures = require('./fixtures');
var check = require('check-types');
var verify = check.verify;
var _ = require('lodash');
var ack = require('ac-koa');
var MemoryStore = require('ac-node').MemoryStore;
var MockHttpClient = require('ac-node-hipchat/test/mock-http-client');

var tenant = fixtures.load('tenant.json');
var installable = fixtures.load('tenant-installable.json');

describe('ack hipchat add-on', function () {

  var store = MemoryStore();
  var server;
  var client;
  var tenantStore;
  var app;
  var addon;

  before(function (done) {
    var pkg = fixtures.load('package.json');

    app = ack(pkg, {
      store: store,
      httpClient: MockHttpClient(10)
    });

    var config = app.config;
    var scope = 'hipchat';

    addon = app.addon(scope, {
      capabilities: {
        hipchatApiConsumer: {
          scopes: ['send_notification']
        },
        installable: {
          allowGlobal: true
        },
        webhook: [{
          event: 'room_enter',
          name: 'with-full-url',
          url: config.LOCAL_BASE_URL + '/static-webhook-with-full-url'
        }, {
          event: 'room_enter',
          name: 'with-partial-url',
          url: '/static-webhook-with-partial-url'
        }, {
          event: 'room_enter',
          name: 'with-no-url'
        }]
      }
    });

    tenantStore = store.narrow(scope).narrow('tenant');
    server = app.listen(done);
    client = supertest.agent(server);
  });

  afterEach(function *() {
    yield store.clear();
  });

  after(function (done) {
    server.close(done);
  });

  it('should reject a webhook when no tenant exists for the specified oauth_client_id', function (done) {
    tenantStore.get(tenant.id).then(function (existing) {
      assert.ok(!existing);
      var body = {
        event: 'room_enter',
        oauth_client_id: tenant.id
      };
      client
        .post('/static-webhook-with-full-url')
        .send(body)
        .expect(404, done);
    });
  });

  it('should ignore statically configured webhooks with full urls', function (done) {
    tenantStore.set(tenant.id, tenant).then(function () {
      var postBody = {
        event: 'room_enter',
        oauth_client_id: tenant.id
      };
      client
        .post('/static-webhook-with-full-url')
        .send(postBody)
        .expect(404, done);
    });
  });

  it('should ignore statically configured webhooks with partial urls', function (done) {
    tenantStore.set(tenant.id, tenant).then(function () {
      var postBody = {
        event: 'room_enter',
        oauth_client_id: tenant.id
      };
      client
        .post('/hipchat/static-webhook-with-partial-url')
        .send(postBody)
        .expect(404, done);
    });
  });

  it('should mount and fire events for statically configured webhooks with no url', function (done) {
    tenantStore.set(tenant.id, tenant).then(function () {
      var postBody = {
        event: 'room_enter',
        oauth_client_id: tenant.id,
        webhook_id: 1,
        item: {}
      };

      var adddonEventContext;
      addon.on('room_enter', function (context) {
        adddonEventContext = context;
      });

      var appEventContext;
      app.on('hipchat:room_enter', function (context) {
        appEventContext = context;
      });

      client
        .post('/hipchat/addon/webhook')
        .send(postBody)
        .expect(204, function (err) {
          if (err) return done(err);
          assert.deepEqual(adddonEventContext, appEventContext);
          assert.deepEqual(adddonEventContext.request.body, postBody);
          assert.ok(adddonEventContext);
          assert.deepEqual(adddonEventContext.tenant, tenant);
          assert.ok(adddonEventContext.tenantStore);
          assert.ok(adddonEventContext.tenantClient);
          done();
        });
    });
  });

});
