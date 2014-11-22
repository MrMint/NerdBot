var fs = require('fs');
var handlebars = require("handlebars");

function Trade() {
    this.template = fs.readFileSync("./templates/magic/trade.hbs", "utf8");
    this.handles = "trade";
    this.description = "Displays information pertinent to trading two cards.";
};

Trade.prototype.handle = function(command) {
    return "Trade command not yet implemented";
};

module.exports = Trade;