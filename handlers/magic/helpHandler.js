var fs = require('fs');
var handlebars = require("handlebars");

function HelpHandler(handlerService, log) {
    this.template = fs.readFileSync("./templates/magic/help.hbs", "utf8");
    this.handles = "help";
    this.description = "Lists all of the available commands.";
    this.handlerService = handlerService;
    this.log = log;
};

HelpHandler.prototype.handle = function (command) {
    var source = {};
    var commands = [];
    var handlers = this.handlerService.getHandlers()
    for (var key in handlers) {
        var handlerViewModel = {};
        // Todo this is bad fix it
        handlerViewModel['command'] = '/magic ' + handlers[key].handles;
        handlerViewModel['description'] = handlers[key].description;
        commands.push(handlerViewModel);
    }
    source['commands'] = commands;
    var pageBuilder = handlebars.compile(this.template);
    return pageBuilder(source);
};

module.exports = HelpHandler;