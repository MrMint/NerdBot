// Hipchat dependencies
var ack = require('ac-koa').require('hipchat');
var pkg = require('./package.json');
var app = ack(pkg);

// Nerd Bot dependencies
var bunyan = require('bunyan');
var router = require('controllers/nerdRouter.js');

// Controllers
var card = require('controllers/card.js');
var help = require('controllers/help.js');
var trade = require('controllers/trade.js');

// Setup the app, request needed permissions
var addon = app.addon()
  .hipchat()
  .allowRoom(true)
  .scopes('send_notification');

// Setup logging
var log = bunyan.createLogger({
	name: 'nerd-bot',
	  streams: [
	    {
	   		type: 'rotating-file',
	      	level: 'debug',
	      	path: '/home/vagrant/project/log/nerdBot.log',  // log ERROR and above to a file
	    	count: 30,
	    	period: '1d'
	    }
	  ]
	});

// TODO
// router.addRoute('default', help.commands);
// router.addRoute('card', card.info);
// router.addRoute('value', card.value);
// router.addRoute('trade', trade.tradeStats);


// Setup the key used by hipchat
if (process.env.DEV_KEY) {
  addon.key(process.env.DEV_KEY);
}
 
 // Define the webhooks
addon.onWebhook('install', function *() {
	logger.info(this.room);
  	yield this.roomClient.sendNotification('Hey Nerds!');
});

addon.onWebhook('uninstall', function *() {
	logger.info(this.room);
  	yield this.roomClient.sendNotification('WHY U UNINSTALL?');
});

addon.webhook('room_message', /^\/nerd /, function *() {
	logger.debug(this.content);
	yield this.roomClient.sendNotification('Hi, ' + this.sender.name + '.... Nerd!');
});

app.listen();
