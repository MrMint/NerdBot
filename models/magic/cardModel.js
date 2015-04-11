function CardModel(name, type, color, text, rarity, set, avgPrice, imgUrl, storeUrl, hasImage, additionalSearchMatches, editions, additionalMatchNumber, exactMatch, notFound) {
    this.name = name;
    this.type = type;
    this.color = color;
    this.text = text;
    this.rarity = rarity;
    this.set = set;
    this.avgPrice = avgPrice;
    this.imgUrl = imgUrl;
    this.storeUrl = storeUrl;
    this.hasImage = hasImage;
    this.additionalSearchMatches = additionalSearchMatches;
    this.editions = editions;
    this.additionalMatchNumber = additionalMatchNumber;
    this.exactMatch = exactMatch;
    this.notFound = notFound;
}

module.exports = CardModel;