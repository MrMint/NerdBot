var assert = require('assert');
var jwt = require('jwt-simple');
var co = require('co');
var ac = require('ac-node');
var MemoryStore = ac.MemoryStore;
var Tenants = ac.Tenants;
var authenticator = require('../lib/authenticator');
var fixtures = require('./fixtures');

var tenant = fixtures.load('tenant.json');

describe('ack hipchat authenticate middleware', function () {

  var store;
  var tenantStore;
  var tenants;
  var context;
  var response;
  var authenticate;

  beforeEach(function *() {
    store = MemoryStore();
    tenantStore = store.narrow('tenant');
    yield tenantStore.set(tenant.id, tenant);
    tenants = Tenants(tenantStore);
    response = {headers: {}};
    authenticate = authenticator('production', tenants, {});
    context = {
      query: {},
      header: {},
      set: function (header, value) {
        response.headers[header] = value;
      },
      throw: function (msg, status) {
        this.status = status || 500;
        var err = new Error(msg);
        err.status = status;
        err.expose = true;
        throw err;
      }
    };
  });

  it('should pass through a valid jwt request (param)', function *() {
    var claims = {
      iss: tenant.id,
      iat: Math.floor(Date.now() / 1000) - 10,
      prn: 1,
      context: {tz: 'GMT'}
    };
    context.query.signed_request = jwt.encode(claims, tenant.secret);
    yield co(authenticate).bind(context);
    assert.ok(context.authentication);
    assert.equal(context.authentication.issuer, tenant);
    assert.equal(context.authentication.userId, claims.prn);
    assert.ok(context.authentication.issued > claims.iat);
    assert.equal(context.authentication.expiry, context.authentication.issued + (15 * 60));
    assert.deepEqual(context.authentication.context, claims.context);
    assert.equal(context.authentication.token, response.headers['JWT']);
    jwt.decode(context.authentication.token, tenant.secret);
  });

  it('should pass through a valid jwt request (header)', function *() {
    yield tenantStore.set(tenant.id, tenant);
    var claims = {
      iss: tenant.id,
      iat: Math.floor(Date.now() / 1000) - 10,
      prn: 1,
      context: {tz: 'GMT'}
    };
    context.header.authorization = 'JWT token=' + jwt.encode(claims, tenant.secret);
    yield co(authenticate).bind(context);
    assert.ok(context.authentication);
    assert.equal(context.authentication.issuer, tenant);
    assert.equal(context.authentication.userId, claims.prn);
    assert.ok(context.authentication.issued > claims.iat);
    assert.equal(context.authentication.expiry, context.authentication.issued + (15 * 60));
    assert.deepEqual(context.authentication.context, claims.context);
    assert.equal(context.authentication.token, response.headers['JWT']);
    jwt.decode(context.authentication.token, tenant.secret);
  });

  it('should fail an invalid jwt request (param)', function *() {
    yield tenantStore.set(tenant.id, tenant);
    context.query.signed_request = 'fail';
    try {
      yield co(authenticate).bind(context);
      assert.fail();
    } catch (err) {
      assert.equal(err.status, 401);
    }
  });

  it('should fail an invalid jwt request (header)', function *() {
    yield tenantStore.set(tenant.id, tenant);
    context.header.authorization = 'JWT token=fail';
    try {
      yield co(authenticate).bind(context);
      assert.fail();
    } catch (err) {
      assert.equal(err.status, 401);
    }
  });

});
