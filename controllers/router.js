var router = {
	
	// The registered routes
	routes = {},

	// Registers a new route
	addRoute: function(command, action)
	{
		// Ensure we have not already added an action for this command
		if(!router.routes[command])
		{
			router.routes[command] = action;
		}
	},

	// Handles routing a request to the appropriate controller function
	routeRequest: function(request)
	{
		// Filter out the command from the request
		var command = request.substring(6);
		var index = command.indexOf(' ');
		command = command.substring(0,index);

		// Route the command
		router.route[command]();
	}

};

module.exports = router;