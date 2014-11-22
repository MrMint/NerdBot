var commandService = {
	
	// The registered handlers
	handlers = {},

	// Registers a new route
	addHandler: function(handler)
	{
		// Ensure we have not already added an handler for this command
		if(!commandService.handlers[command])
		{
			commandService.handlers[command] = action;
		}
	},

	// Handles routing a request to the appropriate command handler
	routeCommand: function(command)
	{
		// Filter out the command from the request
		var command = request.substring(6);
		var index = command.indexOf(' ');
		command = command.substring(0,index);

		// Route the command
		if(!commandService.handlers[command])
		{
			commandService.handlers[command]();
		}else
		{
			// Todo make default a constant
			commandService.handlers['default'];
		}
		
	}

};

module.exports = commandService;