var fs = require('fs');
var handlebars = require("handlebars");

function RandomHandler(cardService, log) {
    this.pageBuilder = handlebars.compile(fs.readFileSync("./templates/magic/card.hbs", "utf8"));
    this.handles = "random";
    this.description = "Displays the image for a random card. Filters can be used in a key=value format (e.g. color=green)";
    this.cardService = cardService;
    this.log = log;
};

RandomHandler.prototype.handle = function * (request) {
    this.log.debug(request);
    console.log("random" + request);

    var words = request.split(' ');

    var card = yield this.cardService.getRandomCard(words[2] || "");

    var source = {
        cardImageLink: card.imgUrl,
        cardStoreLink: card.storeUrl
    };
    return this.pageBuilder(source);
};

module.exports = RandomHandler;