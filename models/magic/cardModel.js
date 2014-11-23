function CardModel(name, type, color, text, rarity, set, avgPrice, imgUrl) {
    this.name = name;
    this.type = type;
    this.color = color;
    this.text = text;
    this.rarity = rarity;
    this.set = set;
    this.avgPrice = avgPrice;
    this.imgUrl = imgUrl;
}

module.exports = CardModel;