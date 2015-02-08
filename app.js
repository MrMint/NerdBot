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
var HelpHandler = require('./handlers/magic/helpHandler.js');
var ErrorHandler = require('./handlers/errorHandler.js');

// Handlebars
require('./templates/helpers/helpers.js');

// Setup logging
var log = bunyan.createLogger({
    name: 'nerd-bot'
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
magicHandlers.add(new HelpHandler(magicHandlers, log));

// Setup the key used by hipchat
if (process.env.NERDBOT_KEY) {
    addon.key(process.env.NERDBOT_KEY);
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
    try{
        yield this.roomClient.sendNotification(yield magicHandlers.handle(this.content));
    }catch (e){
        var errorHandler = new ErrorHandler();
        yield this.roomClient.sendNotification(yield errorHandler.handle(this.sender.name));
    }

});

log.info("Starting the koa app.");

app.listen();

log.info("Start up successfull!");