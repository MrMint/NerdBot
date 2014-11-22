function Handlers(log) {
    // The registered handlers
    this.handlers = {};
    this.log = log;
}

// Registers a new route
Handlers.prototype.add = function(handler) {
    // Ensure we have not already added an handler for this command
    if (!this.handlers[handler.handles]) {
        this.log.info("Registered handler for command: " + handler.handles);
        this.handlers[handler.handles] = handler;
    }
};

// Handles routing a request to the appropriate command handler
Handlers.prototype.handle = function(request) {
    var words = request.split(' ');
    command = words[1];
    // Route the command
    // Check if we have a handler registered for the command
    if ( !! this.handlers[command]) {
        return this.handlers[command].handle(command);
    } else {
        this.log.warn("No handler registered for command: " + command);
        // Todo make this not suck
        return this.handlers['help'].handle(command);
    }
};

Handlers.prototype.getHandlers = function() {
    return this.handlers;
};

module.exports = Handlers;