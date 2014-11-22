var card = {
	handles: "card",
	description: "Displays the image for a card.",
	handle: function(command)
	{
		return "<img src='http://mtgimage.com/multiverseid/12414.jpg' height='300px'/>";
	}
};

module.exports = card;