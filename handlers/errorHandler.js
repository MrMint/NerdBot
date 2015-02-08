var fs = require('fs');
var handlebars = require("handlebars");

function ErrorHandler() {
    this.pageBuilder = handlebars.compile(fs.readFileSync("./templates/error.hbs", "utf8"));
    this.handles = "error";
    this.description = "You dun goofed.";
};

ErrorHandler.prototype.handle = function * (userName) {
    var source = {
        name: userName.split(' ')[0]
    };
    
    return this.pageBuilder(source);
};

module.exports = ErrorHandler;