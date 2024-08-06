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
      
    },
    addonsBill: {
      type: Number,
      
    },
    servicesBill: {
      type: Number,
      
    }
  }
});

module.exports = mongoose.model('Booking', BookingSchema);