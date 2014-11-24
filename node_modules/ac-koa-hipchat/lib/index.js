var _ = require('lodash');
var check = require('check-types');
var verify = check.verify;
var urls = require('url');
var Router = require('koa-router');
var mount = require('koa-mount');
var bodyParser = require('koa-body-parser')();
var util = require('ac-koa/lib/util');
var hipchat = require('ac-node-hipchat');
var transform = hipchat.transform;
var RestClient = hipchat.RestClient;
var tenantFactory = hipchat.tenantFactory;
var Builder = hipchat.Builder;
var wh = hipchat.webhooks;
var whExtractors = hipchat.webhookExtractors;
var HipchatWebhookManager = hipchat.WebhookManager;
var authenticator = require('./authenticator');
var decorator = require('./decorator');

module.exports = function (baseUrl, services, options, config) {
  verify.webUrl(baseUrl);
  check.map(services, {
    store: verify.object,
    tenants: verify.object,
    httpClient: verify.fn
  });
  verify.maybe.object(options);
  verify.maybe.object(config);
  options = options || {};
  config = config || {};

  var store = services.store;
  var tenants = services.tenants;
  var httpClient = services.httpClient;
  var webhookManager = services.webhookManager;

  var homepagePath = '/';
  var addonPath = '/addon';
  var descriptorPath = addonPath + '/capabilities';
  var installablePath = addonPath + '/installable';
  var webhookPath = addonPath + '/webhook';

  // TODO: extract into a peer helper module
  function createTenantServices(tenant, scopes) {
    var tenantStore = store.narrow(tenant.id);
    var tenantData = tenantStore.narrow('data');
    var tenantTokenCache = tenantStore.narrow('token');
    var tenantClient = RestClient(httpClient).forTenant(tenant, tenantTokenCache, scopes);
    var tenantWebhookStore = tenantStore.narrow('webhook');
    var tenantWebhooks = HipchatWebhookManager(webhookManager, tenantWebhookStore, tenant, tenantClient, baseUrl, webhookPath);
    return {
      tenantStore: tenantData,
      tenantClient: tenantClient,
      tenantWebhooks: tenantWebhooks
    };
  }

  // TODO: extract into a peer helper module
  function mountInstalledWebhook(router, events, scopes) {
    router.post(installablePath, bodyParser, function *() {
      var installable = this.request.body;
      var capabilitiesUrl = installable.capabilitiesUrl;
      // verify that the installing host is whitelisted a host, if required
      if (config.HOSTS && !util.isDomainWhitelisted(config.HOSTS, capabilitiesUrl)) {
        this.throw('Unacceptable tenant domain: ' + capabilitiesUrl, 403);
      }
      var restClient = RestClient(httpClient);
      // fetch the capabilities document
      var capabilities = yield restClient.getCapabilities(capabilitiesUrl);
      // create a normalized tenant object from the installable and capabilities inputs
      var tenant = tenantFactory(this.request.body, capabilities);
      var tenantClient = createTenantServices(tenant, scopes).tenantClient;
      // verify the installation secret by immediately generating a token
      var token = yield tenantClient.getToken(scopes[0]);
      if (!token) {
        this.throw('Failed to verify installation request', 403);
      }
      // confident that the installation is legitimate, persist the installation
      yield tenants.installed(tenant);
      // set up context and emit a webhook event
      this.tenant = tenant;
      _.extend(this, createTenantServices(tenant, scopes));
      var roomId = this.tenant.room;
      if (roomId) {
        this.roomClient = this.tenantClient.forRoom(roomId);
      }
      this.webhook = {
        id: -1,
        event: 'install',
        name: '__install__',
        url: installablePath
      };
      this.webhookId = this.webhook.id;
      this.status = 204;
      events.emit(this.webhook.event, this);
    });
  }

  // TODO: extract into a peer helper module
  function mountUninstalledWebhook(router, events, scopes) {
    router.del(installablePath + '/:tenantId', function *() {
      var tenantId = this.params.tenantId;
      var tenant = yield tenants.get(tenantId);
      if (tenant) {
        this.tenant = tenant;
        _.extend(this, createTenantServices(tenant, scopes));
        yield tenants.uninstalled(tenantId);
        this.webhook = {
          id: -2,
          event: 'uninstall',
          name: '__uninstall__',
          url: installablePath + '/' + tenantId
        };
        this.webhookId = this.webhook.id;
        this.status = 204;
        events.emit(this.webhook.event, this);
      }
    });
  }

  // TODO: extract into a peer helper module
  function mountAddonWebhooks(router, events, scopes, descriptor) {
    // make sure the static webhook manager knows about all static definitions
    var webhooks = descriptor.capabilities.webhook;
    if (webhooks) {
      webhooks.forEach(function (webhook) {
        services.webhookManager.add(webhook.name, webhook);
      });
    }
    router.post(webhookPath, bodyParser, function *() {
      this.webhook = this.request.body;
      try {
        check.map(this.webhook, {
          event: verify.string,
          oauth_client_id: verify.string,
          webhook_id: verify.number,
          item: verify.object
        });
      } catch (e) {
        this.throw('Invalid webhook: ' + e.toString(), 400);
      }
      var tenantId = this.webhook.oauth_client_id;
      var tenant = yield tenants.get(tenantId);
      if (!tenant) {
        this.throw('Tenant ' + tenantId + ' not found', 404);
      }
      var token = this.query.token;
      if (check.string(token) && tenant.webhookToken !== token) {
        // webhooks registered in the descriptor can't have a token,
        // so they can't be verified against the tenant's generated
        // webhookToken; if the webhook token exists, though, as it
        // would for webhooks registered dynamically via the ac webhook
        // libs, then verify that the token is correct
        this.throw('Webhook token verification failure', 403);
      }
      this.tenant = tenant;
      _.extend(this, createTenantServices(tenant, scopes));
      var extractor = whExtractors[this.webhook.event];
      if (extractor) {
        _.extend(this, extractor(this.webhook));
      }
      var roomId = (this.room && this.room.id) || this.tenant.room;
      if (roomId) {
        this.roomClient = this.tenantClient.forRoom(roomId);
      }
      this.status = 204;
      events.emit(this.webhook.event, this);
    });
  }

  var self = {

    descriptorPath: descriptorPath,

    // TODO: we only need these because EventEmitter doesn't support wildcard subscriptions;
    //       look into using EventEmitter2 instead?  see ../index.js
    webhookEvents: [
      'install',
      'uninstall',
      'room_enter',
      'room_exit',
      'room_message',
      'room_notification',
      'room_topic_change'
    ],

    builder: function (descriptor, eventSink) {
      return Builder(descriptor, eventSink);
    },

    transform: function (descriptor) {
      return transform(descriptor, options, {
        base: baseUrl,
        homepage: homepagePath,
        descriptor: descriptorPath,
        installable: installablePath,
        webhook: webhookPath
      });
    },

    validate: function (descriptor) {
      check.map(descriptor, {
        capabilities: {
          hipchatApiConsumer: {
            scopes: verify.array
          },
          installable: {
            allowGroup: verify.boolean,
            allowRoom: verify.boolean,
            callbackUrl: verify.webUrl
          },
          configurable: verify.maybe.object,
          webhook: verify.maybe.array
        }
      });
      verify.not.length(descriptor.capabilities.hipchatApiConsumer.scopes, 0);
    },

    ready: function (descriptor, events) {
      var router = new Router();
      var scopes = descriptor.capabilities.hipchatApiConsumer.scopes;

      mountInstalledWebhook(router, events, scopes);
      mountUninstalledWebhook(router, events, scopes);
      mountAddonWebhooks(router, events, scopes, descriptor);

      return router.middleware();
    },

    prepareWebhook: function (definition, context) {
      if (definition.event === 'room_message') {
        var re;
        if (_.isRegExp(definition.pattern)) {
          re = definition.pattern;
        } else if (typeof definition.pattern === 'string') {
          try {
            re = wh.patternToRegExp(definition.pattern);
          } catch (err) {
            // ignore if invalid
            if (/\bac-koa-hipchat\b/.test(process.env.NODE_DEBUG)) {
              console.log('DEBUG:', err.stack || err);
            }
          }
        }
        if (re) {
          context.match = re.exec(context.content);
          return !!context.match;
        }
      }
      return true;
    },

    webhookFor: function (descriptor, tenant, name, context) {
      var scopes = descriptor.capabilities.hipchatApiConsumer.scopes;
      var webhookManager = createTenantServices(tenant, scopes).tenantWebhooks;
      var room = context && context.room;
      return webhookManager.get(room && room.id, name);
    },

    authenticator: function (nodeEnv, opts) {
      opts = _.extend({authTokenTtl: config.AUTH_TOKEN_TTL}, opts);
      return authenticator(nodeEnv, tenants, opts);
    },

    decorator: function (nodeEnv, descriptor) {
      var servicesFactory = function (tenant) {
        var scopes = descriptor.capabilities.hipchatApiConsumer.scopes;
        return createTenantServices(tenant, scopes);
      };
      return decorator(nodeEnv, baseUrl, servicesFactory);
    }

  };

  return self;
};

module.exports.recognizes = function (descriptor) {
  return check.map(descriptor, {
    capabilities: check.object
  });
};

module.exports.emptyDescriptor = function () {
  return {
    capabilities: {}
  };
};
