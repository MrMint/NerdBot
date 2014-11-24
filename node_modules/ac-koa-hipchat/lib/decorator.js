var _ = require('lodash');
var decorator = require('ac-node-hipchat').decorator;

module.exports = function (nodeEnv, localBaseUrl, servicesFactory) {
  var decorate = decorator(nodeEnv, localBaseUrl, servicesFactory);
  return function *() {
    if (this.authentication) {
      this.tenant = this.authentication.issuer;
      if (this.tenant) {
        var decoration = decorate(this.tenant, this.authentication.token);
        _.extend(this, decoration);
      }
    }
  };
};
