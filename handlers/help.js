var help = {
	handles: "help",
	description: "Lists all of the available commands.",
	handle: function(command)
	{
		return command + " command handled.";
	}
};

module.exports = help;