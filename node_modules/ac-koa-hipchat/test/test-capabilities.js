var assert = require('assert');
var supertest = require('supertest');
var fixtures = require('./fixtures');
var ack = require('ac-koa');
var MemoryStore = require('ac-node').MemoryStore;

describe('ack hipchat add-on', function () {

  var store;
  var server;
  var client;

  before(function (done) {
    store = MemoryStore();
    var pkg = fixtures.load('package.json');
    var app = ack(pkg, {store: store});

    app.addon('hipchat', {
      capabilities: {
        hipchatApiConsumer: {
          scopes: ['send_notification']
        },
        installable: {
          allowRoom: true
        }
      }
    });

    server = app.listen(done);
    client = supertest.agent(server);
  });

  after(function (done) {
    server.close(done);
  });

  afterEach(function *() {
    yield store.clear();
  });

  it('should respond with a hipchat capabilities descriptor', function (done) {
    client
      .get('/hipchat/addon/capabilities')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(fixtures.load('addon-capabilities.json'), done);
  });

  it('should redirect to a hipchat capabilities descriptor when requesting json from the mount path', function (done) {
    client
      .get('/hipchat')
      .set('Accept', 'application/json')
      .expect(302)
      .expect('Location', /\/hipchat\/addon\/capabilities$/, done);
  });

});
