// models/Section.js
const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  title: String,
  readyTime: Number,
  description: String,
  price: Number,
  features: [String],
  images: [String]
});

const Section = mongoose.model('Section', sectionSchema);

module.exports = Section;