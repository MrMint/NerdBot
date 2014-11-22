function Handlers(log)
{
	// The registered handlers
	var handlers = {};

	// Registers a new route
	this.add = function(handler)
	{
		// Ensure we have not already added an handler for this command
		if(!handlers[handler.handles])
		{
			log.info("Registered handler for command: " + handler.handles);
			handlers[handler.handles] = handler.handle;
		}
	},

	// Handles routing a request to the appropriate command handler
	this.handle = function(request)
	{
		var words = request.split(' ');
		command = words[1];

		// Route the command
		// Check if we have a handler registered for the command
		if(!!handlers[command])
		{
			return handlers[command](command);
		}else
		{
			log.warn("No handler registered for command: " + command);
			// Todo make this not suck
			return handlers['help'](command);
		}
	}
}

module.exports = Handlers;