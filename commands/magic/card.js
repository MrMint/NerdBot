var fs = require('fs');
var handlebars = require("handlebars");

function Card() {
    this.template = fs.readFileSync("./templates/magic/card.hbs", "utf8");
    this.handles = "card";
    this.description = "Displays the image for a card.";
};

Card.prototype.handle = function(command) {
    var source = {
        cardImageLink: 'http://mtgimage.com/multiverseid/12414.jpg'
    };
    var pageBuilder = handlebars.compile(this.template);
    return pageBuilder(source);
};

module.exports = Card;