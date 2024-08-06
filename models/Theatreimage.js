// models/Image.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TheatreimageSchema = new Schema({
  title: String,
  url: String
});

module.exports = mongoose.model('Theatreimage', TheatreimageSchema);
