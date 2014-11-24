var authenticator = require('ac-node-hipchat').authenticator;

module.exports = function (nodeEnv, tenants, opts) {
  opts = opts || {};
  var authenticate = authenticator(nodeEnv, tenants, opts);
  return function *() {
    var signedRequestParam = this.query.signed_request;
    var authorizationHeader = this.header.authorization;
    try {
      this.authentication = yield authenticate(signedRequestParam, authorizationHeader);
      this.set('JWT', this.authentication.token);
    } catch (err) {
      this.set('WWW-Authenticate', 'JWT');
      this.throw(err.message, 401);
    }
  };
};
