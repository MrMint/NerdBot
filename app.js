// Hipchat dependencies
var ack = require('ac-koa').require('hipchat');
var pkg = require('./package.json');
var app = ack(pkg);

// Nerd Bot dependencies
var bunyan = require('bunyan');
var HandlerService = require('./services/handlerService.js');
var CardService = require('./services/cardService.js');

// Handlers
var CardHandler = require('./handlers/magic/cardHandler.js');
var TradeHandler = require('./handlers/magic/tradeHandler.js');
var HelpHandler = require('./handlers/magic/helpHandler.js');

// Handlebars
require('./templates/helpers/helpers.js');

// Setup logging
var log = bunyan.createLogger({
    name: 'nerd-bot',
    streams: [{
        type: 'rotating-file',
        level: 'debug',
        path: '/home/vagrant/project/log/nerdBot.log',
        count: 30,
        period: '1d'
    }]
});

log.info("Starting up.");
log.info("Setting up koa app and hipchat permissions.");

// Setup the app, request needed permissions
var addon = app.addon()
    .hipchat()
    .allowRoom(true)
    .scopes('send_notification');

log.info("Registering the handlers.");

// Register the handlers
var magicHandlers = new HandlerService(log);
magicHandlers.add(new CardHandler(new CardService('https://api.deckbrew.com/mtg/', log), log));
magicHandlers.add(new TradeHandler());
magicHandlers.add(new HelpHandler(magicHandlers, log));

log.info("Registering the handlers.");

// Setup the key used by hipchat
if (process.env.DEV_KEY) {
    addon.key(process.env.DEV_KEY);
}

log.info("Defining the webhooks to be used by hipchat.");

// Define the webhooks
addon.onWebhook('install', function * () {
    yield this.roomClient.sendNotification('Hey Nerds!');
});

addon.onWebhook('uninstall', function * () {
    yield this.roomClient.sendNotification('WHY U UNINSTALL?');
});

addon.webhook('room_message', /^\/magic /, function * () {
    log.debug(this.content);

    var result = yield magicHandlers.handle(this.content);
    log.debug(result);
    yield this.roomClient.sendNotification(result);
});

log.info("Starting the koa app.");

app.listen();

log.info("Start up successfull!");