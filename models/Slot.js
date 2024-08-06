const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  time: String,
  type: { type: String, required: true, enum: ['pt', 'ph'] },
  privateScreen1Available: { type: Boolean, default: true },
  privateScreen2Available: { type: Boolean, default: true },
  partyHallAvailable: { type: Boolean, default: true },
  unavailableDates: [{
    screen: { 
      type: String, 
      enum: ['Private Screen-1', 'Private Screen-2', 'Party Hall', 
             'private-screen-1', 'private-screen-2', 'party-hall']
    },
    date: Date
  }]
});

module.exports = mongoose.model('Slot', slotSchema);