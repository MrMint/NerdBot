var fs = require('fs');
var handlebars = require("handlebars");

function CardHandler(cardService, log) {
    this.pageBuilder = handlebars.compile(fs.readFileSync("./templates/magic/card.hbs", "utf8"));
    this.handles = "card";
    this.description = "Displays the image for a card.";
    this.cardService = cardService;
    this.log = log;
};

CardHandler.prototype.handle = function * (request) {
    this.log.debug(request);
    var words = request.split(' ');



    var card = yield this.cardService.getCardByNameAsync(request.substring(words[0].length + words[1].length + 2));
    var cardImageUrl = yield this.cardService.getCardImageUrlAsync(card.name);
    if (cardImageUrl) {
        card.hasImage = true;
        card.imgUrl = cardImageUrl;
        card.notFound = false;
    }
    else if (!card.text) {
        card.notFound = true;
    }

    var source = {
        cardImageLink: card.imgUrl,
        cardStoreLink: card.storeUrl,
        cardName: card.name,
        cardText: card.text,
        cardType: card.type,
        cardColor: card.color,
        cardHasImage: card.hasImage,
        additionalSearchMatches: card.additionalSearchMatches,
        editions: card.editions,
        additionalMatchNumber: card.additionalMatchNumber,
        exactMatch: card.exactMatch,
        cardNotFound: card.notFound
    };
    //console.log(this.pageBuilder(source));
    return this.pageBuilder(source);
};

module.exports = CardHandler;