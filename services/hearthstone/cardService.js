var _und = require('underscore');
var rest = require('rest');
var mime = require('rest/interceptor/mime');
var defaultRequest = require('rest/interceptor/defaultRequest');
var CardModel = require('../../models/hearthstone/cardModel.js');
var apikey = require('../../package').production.hearthstoneApiKey;
var client = rest.wrap(mime).wrap(defaultRequest, { headers: {"X-Mashape-Key": process.env[apikey]}});

function CardService(apiUrl, log) {
    this.log = log;
    this.rest = client;
    this.apiUrl = apiUrl;
}

CardService.prototype.getCardByNameAsync = function(cardName) {
	var log = this.log;
	log.debug('Making request for card with name: ' + cardName);
    return this.rest(this.apiUrl + '/' + cardName)
        .then(function(response) {
        	// Todo also bad, fix it
        	var cards = response.entity;
            log.info(cards);
            // try to find exact match
            var card = _und.find(cards, function(icard) {
                return icard.name.trim().toLowerCase() == cardName.trim().toLowerCase();
            });

            if(card == undefined || card.length == 0) {
                card = cards[0];
            }

            var cardData = processCard(card, cards, log);

            return new CardModel(card.cardId,
				card.name,
				card.cardSet,
				card.type,
				card.faction,
				card.rarity,
				card.cost,
				card.attack,
				card.health,
				card.durability,
				card.text,
				card.inPlayText,
				card.flavor,
				card.artist,
				card.collectible,
				card.elite,
				card.race,
				card.playerClass,
				card.howToGet,
				card.howToGetGold,
				card.img,
				card.imgGold,
				card.locale,
				card.mechanics,
				cardData.additionalSearchMatches,
				cardData.additionalMatchNumber,
				cardData.exactMatch);
        });
};

function processCard(foundCard, additionalCards, log) {

    var additionalSeachReultsToDisplay = 42;
    var numberPerGroup = 14.0;

    var additionalSearchMatches = _und.chain(additionalCards).without(foundCard).first(additionalSeachReultsToDisplay - 1).value();
    var additionalMatchNumber = (additionalCards.length - additionalSeachReultsToDisplay);
    additionalMatchNumber = additionalMatchNumber > 0 ? additionalMatchNumber : undefined;
    var exactMatch = additionalSearchMatches.length == 0;

    // break the additional editions up into smaller chunks for display purposes

    var additionalSearchMatcheGroups = undefined;
    if (!exactMatch) {
        additionalSearchMatcheGroups = [];
        var totalGroups = Math.ceil(additionalSeachReultsToDisplay / numberPerGroup);
        for (var i = 0; i < totalGroups; i++) {
            additionalSearchMatcheGroups.push(additionalSearchMatches.splice(0, numberPerGroup));
        }
        if (additionalMatchNumber) {
            _und.last(additionalSearchMatcheGroups).push({
                name: additionalMatchNumber + "more...",
                img: undefined
            });
        }
    }

    var hasImage = foundCard.img != undefined && foundCard.img.length != 0;

    return {
        hasImage: hasImage,
        exactMatch: exactMatch,
        additionalSearchMatches: additionalSearchMatches,
        additionalMatchNumber: additionalMatchNumber,
    }
}

module.exports = CardService;