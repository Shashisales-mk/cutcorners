const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  numberOfPeople: {
    type: Number,
    required: true
  },
  occasionName: {
    type: String,
    required: true
  },
  screen: {
    type: String,
    required: true
  },
  
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  billingDetails: {
    hallRent: {
      type: Number,
      required: true
    },
    additionalPersonCharge: {
      type: Number,
      required: true
    },
    addonsBill: {
      type: Number,
      required: true
    },
    servicesBill: {
      type: Number,
      required: true
    }
  }
});

module.exports = mongoose.model('Booking', BookingSchema);