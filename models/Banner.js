const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  imageUrl: String,
  // title: String,
  // subtitle: String,
  // description: String
});

module.exports = mongoose.model('Banner', bannerSchema);
