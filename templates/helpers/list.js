var handlebars = require("handlebars");

var test = function() {
    handlebars.registerHelper('list', function(items, options) {
        var out = "";//"<ul>";
        for (var i = 0, l = items.length; i < l; i++) {
            out = out + options.fn(items[i]) + '<br />';
        }
        return out;// + "</ul>";
    });
}
module.exports = test;