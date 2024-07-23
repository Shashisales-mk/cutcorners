const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  
  time: String,
  type: { type: String, required: true, enum: ['pt', 'ph'] },
  isAvailable: { type: Boolean, default: true }
});

module.exports = mongoose.model('Slot', slotSchema);