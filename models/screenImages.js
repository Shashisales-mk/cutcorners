const mongoose = require('mongoose');

const ScreenSchema = new mongoose.Schema({
  screenId: {
    type: String,
    required: true,
    unique: true
  },
  image1Url: {
    type: String,
    required: true
  },
  image2Url: {
    type: String,
    required: true
  }
}, { timestamps: true });

const Screen = mongoose.model('Screen', ScreenSchema);

module.exports = Screen;