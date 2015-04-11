// Hipchat dependencies
var ack = require('ac-koa').require('hipchat');
var pkg = require('./package.json');
var app = ack(pkg);

// Nerd Bot dependencies
var bunyan = require('bunyan');
var HandlerService = require('./services/handlerService.js');
var MagicCardService = require('./services/magic/cardService.js');
var HearthstoneCardService = require('./services/hearthstone/cardService.js');

// Handlers
var MagicCardHandler = require('./handlers/magic/cardHandler.js');
var MagicRandomHandler = require('./handlers/magic/randomHandler.js');
var MagicHelpHandler = require('./handlers/magic/helpHandler.js');
var HearthstoneCardHandler = require('./handlers/hearthstone/cardHandler.js');
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
magicHandlers.add(new CardHandler(new CardService('https://api.deckbrew.com/mtg/', 'http://tappedout.net/api/v1/render_card/', log), log));
magicHandlers.add(new RandomHandler(new CardService('https://api.deckbrew.com/mtg/', 'http://tappedout.net/api/v1/render_card/', log), log));
magicHandlers.add(new HelpHandler(magicHandlers, log));

var hearthstoneHandlers = new HandlerService(log);
hearthstoneHandlers.add(new HearthstoneCardHandler(new HearthstoneCardService('https://omgvamp-hearthstone-v1.p.mashape.com/cards', log), log));

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

addon.webhook('room_message', /^\/hearth /, function * () {
    try{
        yield this.roomClient.sendNotification(yield hearthstoneHandlers.handle(this.content));
    }catch (e){
        var errorHandler = new ErrorHandler();
        yield this.roomClient.sendNotification(yield errorHandler.handle(this.sender.name));
    }

});

log.info("Starting the koa app.");

app.listen();

log.info("Start up successfull!");