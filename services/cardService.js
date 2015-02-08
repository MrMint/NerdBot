var rest = require('rest');
var _und = require('underscore');
var mime = require('rest/interceptor/mime');
var CardModel = require('../models/magic/cardModel.js');
var client = rest.wrap(mime);

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
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
                return icard.name.toLowerCase() == cardName.toLowerCase();
            });
            if(card == undefined || card.length == 0) {
                card = cards[0];
            }
            console.log(card); 

        	log.debug(card);
        	var setData = card.editions[0];
            return new CardModel(card.name,
                card.type,
                card.color,
                card.text,
                setData['rarity'],
                setData['set'],
                setData['price']['average'],
                setData['image_url'],
                setData['store_url']);
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
            var data = allCards[randomNumber];
            log.debug(data);
            var setData = data.editions[0];
            return new CardModel(data.name,
                data.type,
                data.color,
                data.text,
                setData['rarity'],
                setData['set'],
                setData['price']['average'],
                setData['image_url'],
                setData['store_url']);
        });
};

module.exports = CardService;