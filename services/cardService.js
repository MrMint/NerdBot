var rest = require('rest');
var _und = require('underscore');
var mime = require('rest/interceptor/mime');
var CardModel = require('../models/magic/cardModel.js');
var client = rest.wrap(mime);

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

function processCard(foundCard, additionalCards, log) {

    var additionalSearchMatches = _und.chain(additionalCards).without(foundCard).first(50).value();
    var additionalMatchNumber = (additionalCards.length - 51);
    additionalMatchNumber = additionalMatchNumber > 0 ? additionalMatchNumber : undefined;
    var exactMatch = additionalSearchMatches.length == 0;
    log.debug(foundCard);

    var cardEditions = _und.sortBy(foundCard.editions, function(edition) {
        return -edition.multiverse_id;
    });



    var mostRecentEdition = cardEditions.shift();
    var hasImage = mostRecentEdition.multiverse_id != 0;

    var additionalEditions = _und.each(cardEditions, function(edition) {
        edition.hasImage = edition.multiverse_id != 0;
    });

    // var j = 0, groupIndex = 0;
    // var editionGroups = [[]];
    // for(var i = 0; i < cardEditions.length; i++) {
    //     if (j == 15 0) {
    //         groupIndex++;
    //         j = 0;
    //         editionGroups.push([]);
    //     }
    //     cardEditions[i].hasImage = cardEditions[i].multiverse_id != 0;
    //     editionGroups[groupIndex].push(cardEditions[i]);
    // }
    // _und.last(editionGroups).push({
    //     name: additionalMatchNumber,
    //     store_url: ""
    // });

    return {
        hasImage: hasImage,
        exactMatch: exactMatch,
        additionalSearchMatches: additionalSearchMatches,
        additionalMatchNumber: additionalMatchNumber,
        additionalEditions: additionalEditions,
        mostRecentEdition: mostRecentEdition
    }
}

function CardService(apiUrl, log) {
    this.log = log;
    this.rest = client;
    this.apiUrl = apiUrl;
}

CardService.prototype.getCardByNameAsync = function(cardName) {
	var log = this.log;
	this.log.debug('Making request for card with name: ' + cardName);
    return this.rest(this.apiUrl + 'cards?name=' + cardName)
        .then(function(response) {
        	// Todo also bad, fix it
        	var cards = response.entity;

            // try to find exact match
            var card = _und.find(cards, function(icard) {
                return icard.name.trim().toLowerCase() == cardName.trim().toLowerCase();
            });


            if(card == undefined || card.length == 0) {
                card = cards[0];
            }

            var cardData = processCard(card, cards, log);

            return new CardModel(card.name,
                card.types,
                card.colors,
                card.text,
                cardData.mostRecentEdition['rarity'],
                cardData.mostRecentEdition['set'],
                cardData.mostRecentEdition['price']['average'],
                cardData.mostRecentEdition['image_url'],
                cardData.mostRecentEdition['store_url'],
                cardData.hasImage,
                cardData.additionalSearchMatches, 
                cardData.additionalEditions,
                cardData.additionalMatchNumber,
                cardData.exactMatch);
        });
};

CardService.prototype.getRandomCard = function(filter) {
    var log = this.log;
    this.log.debug('Making request for a random card with filter: ' + filter);
    
    var minPage = 0;
    var maxPage = 149;
    var randomPage = randomInt(minPage, maxPage);

    var query = "?page=" + randomPage;
    if (filter && filter.indexOf("=") > -1) {
        query = '?' + filter;
    }

    return this.rest(this.apiUrl + 'cards' + query)
        .then(function(response) {
            var allCards = response.entity;
            var low = 0;
            var high = allCards.length;
            var randomNumber = randomInt(low, high);
            // Todo also bad, fix it
            var card = allCards[randomNumber];

            var cardData = processCard(card, [], log);

            log.debug(card);

            return new CardModel(card.name,
                card.types,
                card.colors,
                card.text,
                cardData.mostRecentEdition['rarity'],
                cardData.mostRecentEdition['set'],
                cardData.mostRecentEdition['price']['average'],
                cardData.mostRecentEdition['image_url'],
                cardData.mostRecentEdition['store_url'],
                cardData.hasImage,
                cardData.additionalSearchMatches, 
                cardData.additionalEditions,
                cardData.additionalMatchNumber,
                cardData.exactMatch);
        });
};

module.exports = CardService;