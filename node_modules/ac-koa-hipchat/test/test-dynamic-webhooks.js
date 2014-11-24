var assert = require('assert');
var supertest = require('supertest');
var fixtures = require('./fixtures');
var rsvp = require('rsvp');
var Promise = rsvp.Promise;
var _ = require('lodash');
var ack = require('ac-koa');
var MemoryStore = require('ac-node').MemoryStore;
var MockHttpClient = require('ac-node-hipchat/test/mock-http-client');

var tenant = fixtures.load('tenant.json');
var installable = fixtures.load('tenant-installable.json');

describe('ack hipchat add-on with dynamic webhooks', function () {

  var pkg = fixtures.load('package.json');
  var store = MemoryStore();
  var scope = 'hipchat';
  var tenantStore;
  var server;
  var client;
  var app;

  beforeEach(function () {
    app = ack(pkg, {
      store: store,
      httpClient: MockHttpClient(10)
    });
    tenantStore = store.narrow(scope).narrow('tenant');
  });

  afterEach(function (done) {
    store.clear().then(function () {
      server.close(done);
    });
  });

  it('should mount and fire events for a dynamically added webhook', function (done) {
    var addon = app.addon(scope)
      .hipchat()
      .scopes('admin_room')
      .allowRoom(true);

    var install = new Promise(function (resolve) {
      addon.onWebhook('install', function *() {
        var def = yield this.tenantWebhooks.add('room_message', /^\/test(?:\s+(\w+)\s+(\w+)|$)?/i);
        resolve(def.name);
      });
    });

    var roomMessage = new Promise(function (resolve) {
      addon.onWebhook('room_message', function () {
        resolve(this);
      });
    });

    server = app.listen(function () {
      client = supertest.agent(server);

      client
        .post('/hipchat/addon/installable')
        .send(installable)
        .expect(204, function (err) {
          if (err) return done(err);
        });

      install.then(function (whName) {
        var postBody = {
          event: 'room_message',
          oauth_client_id: tenant.id,
          webhook_id: 1,
          item: {
            room: {
              id: 1
            },
            message: {
              id: 2,
              from: {
                name: 'user'
              },
              message: '/TEST arg1 arg2 arg3'
            }
          }
        };
        client
          .post('/hipchat/addon/webhook?name=' + whName)
          .send(postBody)
          .expect(204, function (err) {
            if (err) return done(err);
            roomMessage.then(function (eventContext) {
              assert.deepEqual(eventContext.request.body, postBody);
              assert.ok(eventContext);
              assert.deepEqual(eventContext.tenant, tenant);
              assert.ok(eventContext.tenantStore);
              assert.ok(eventContext.tenantClient);
              assert.ok(eventContext.roomClient);
              assert.ok(eventContext.tenantWebhooks);
              assert.ok(eventContext.room);
              assert.ok(eventContext.sender);
              assert.ok(eventContext.message);
              assert.equal(eventContext.room.id, 1);
              assert.equal(eventContext.sender.name, 'user');
              assert.equal(eventContext.message.id, 2);
              assert.equal(eventContext.content, '/TEST arg1 arg2 arg3');
              assert.ok(eventContext.match);
              assert.equal(eventContext.match.length, 3);
              assert.equal(eventContext.match[1], 'arg1');
              assert.equal(eventContext.match[2], 'arg2');
              assert.equal(eventContext.match[3], undefined);
              done();
            }).catch(done);
          });
      });
    });
  });

});
