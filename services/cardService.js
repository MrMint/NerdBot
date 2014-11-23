var rest = require('rest');
var mime = require('rest/interceptor/mime');
var CardModel = require('../models/magic/cardModel.js');
var client = rest.wrap(mime);

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
        	var data = response.entity[0];
        	log.debug(data);
        	var setData = data.editions[0];
            return new CardModel(data.name,
                data.type,
                data.color,
                data.text,
                setData['rarity'],
                setData['set'],
                setData['price']['average'],
                setData['image_url']);
        });
};

module.exports = CardService;