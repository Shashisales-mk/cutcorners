const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: String,
  link: String,
  category: String
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem;