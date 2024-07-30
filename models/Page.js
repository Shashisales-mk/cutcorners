const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  name: String,
  title: String,
  url: String,
  theme: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  themeName: String,
  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Page', pageSchema);