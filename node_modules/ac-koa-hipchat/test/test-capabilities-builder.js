var assert = require('assert');
var supertest = require('supertest');
var os = require('os');
var fixtures = require('./fixtures');
var ack = require('ac-koa').require('hipchat', require('../lib'));
var MemoryStore = require('ac-node').MemoryStore;
var wh = require('ac-node-hipchat').webhooks;

var tenant = fixtures.load('tenant.json');
var hostname = os.hostname().toLowerCase();

describe('ack hipchat add-on created with a builder', function () {

  var store;
  var server;
  var client;

  before(function (done) {
    store = MemoryStore();
    var pkg = fixtures.load('package.json');
    var app = ack(pkg, {store: store});

    app.addon('hipchat')
      .hipchat()
      .allowRoom(true)
      .scopes('send_notification')
      .webhook('room_enter', '/room-enter');

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
    var fixture = fixtures.load('addon-capabilities.json');
    var descriptor = JSON.parse(JSON.stringify(fixture));
    var baseUrl = 'http://' + hostname + ':4000';
    var webhook = wh.normalize({
      event: 'room_enter',
      url: baseUrl + '/room-enter'
    }, baseUrl);
    descriptor.capabilities.webhook = [webhook];
    client
      .get('/hipchat/addon/capabilities')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(descriptor, done);
  });

});
