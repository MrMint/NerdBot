var fs = require('fs');
var handlebars = require("handlebars");

function CardHandler(cardService, log) {
    this.pageBuilder = handlebars.compile(fs.readFileSync("./templates/hearthstone/card.hbs", "utf8"));
    this.handles = "card";
    this.description = "Displays the image for a card.";
    this.cardService = cardService;
    this.log = log;
};

CardHandler.prototype.handle = function * (request) {
    this.log.debug(request);
    var words = request.split(' ');

    var card = yield this.cardService.getCardByNameAsync(request.substring(words[0].length + words[1].length + 2));

    var source = {
        cardImageLink: card.img,
        cardGoldImageLink: card.imgGold,
        cardHasImage: card.img != undefined && card.img.length != 0,
        cardHasGoldImage: card.imgGold != undefined && card.imgGold.length != 0,
        additionalSearchMatches: card.additionalSearchMatches,
        exactMatch: card.exactMatch
    };
    console.log(this.pageBuilder(source));
    return this.pageBuilder(source);
};

module.exports = CardHandler;