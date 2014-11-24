var assert = require('assert');
var supertest = require('supertest');
var fixtures = require('./fixtures');
var check = require('check-types');
var verify = check.verify;
var rsvp = require('rsvp');
var Promise = rsvp.Promise;
var _ = require('lodash');
var ack = require('ac-koa');
var MemoryStore = require('ac-node').MemoryStore;
var MockHttpClient = require('ac-node-hipchat/test/mock-http-client');

var tenant = fixtures.load('tenant.json');

describe('ack hipchat add-on from builder', function () {

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

  it('should mount and fire events for builder webhooks with no url', function (done) {
    var addon = app.addon(scope)
      .hipchat()
      .scopes('send_notification')
      .allowGlobal(true);

    var roomMessage = new Promise(function (resolve) {
      addon.webhook('room_message', /^\/test(?:\s+(\w+)\s+(\w+)|$)?/i, function *() {
        resolve(this);
      });
    });

    server = app.listen(function () {
      client = supertest.agent(server);

      tenantStore.set(tenant.id, tenant).then(function () {
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
          .post('/hipchat/addon/webhook?name=' + addon.descriptor.capabilities.webhook[0].name)
          .send(postBody)
          .expect(204, function (err) {
            if (err) return done(err);
            roomMessage.then(function (eventContext) {
              var body = eventContext.request.body;
              assert.deepEqual(body, postBody);
              assert.ok(eventContext);
              assert.deepEqual(eventContext.tenant, tenant);
              assert.ok(eventContext.tenantStore);
              assert.ok(eventContext.tenantClient);
              assert.equal(eventContext.webhookId, body.webhook_id);
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

  it('should mount and idividually fire room_message events', function (done) {
    var addon = app.addon(scope)
      .hipchat()
      .scopes('send_notification')
      .allowGlobal(true);

    var roomMessage1 = new Promise(function (resolve) {
      var counter = 0;
      addon.webhook('room_message', /^\/test1(?:\s|$)/i, function *() {
        counter += 1;
        if (counter > 1) throw new Error('Too many callbacks for /test1');
        resolve(this);
      });
    });

    var roomMessage2 = new Promise(function (resolve) {
      var counter = 0;
      addon.webhook('room_message', /^\/test2(?:\s|$)/i, function *() {
        counter += 1;
        if (counter > 1) throw new Error('Too many callbacks for /test2');
        resolve(this);
      });
    });

    server = app.listen(function () {
      client = supertest.agent(server);

      tenantStore.set(tenant.id, tenant).then(function () {
        function post(msg, index, promise) {
          return new Promise(function (resolve, reject) {
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
                  message: msg
                }
              }
            };
            client
              .post('/hipchat/addon/webhook?name=' + addon.descriptor.capabilities.webhook[index].name)
              .send(postBody)
              .expect(204, function (err) {
                if (err) return reject(err);
                promise.then(function (eventContext) {
                  resolve();
                }).catch(reject);
              });
          });
        }
        rsvp.all([
          post('/test1', 0, roomMessage1),
          post('/test2', 1, roomMessage2)
        ]).then(function () {
          done();
        }).catch(done);
      });
    });
  });

});
