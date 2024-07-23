const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  occasion: String,
  event: String,
  theme: String,
  persons: Number,
  date: {
    type: Date,
    required: true
  },
  slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  billingName: String,
  billingEmail: String,
  billingPhone: String,
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  billingDetails: {
    hallRent: {
      type: Number,
      required: true
    },
    additionalPersonCharge: {
      type: Number,
      // required: true
    },
    addonsBill: {
      type: Number,
      // required: true
    },
    servicesBill: {
      type: Number,
      // required: true
    }
  },
  status: String,
  createdAt: { type: Date, default: Date.now }
});

// Pre-save middleware to calculate total amount
OrderSchema.pre('save', function(next) {
  const billingDetails = this.billingDetails;
  this.totalAmount = 
    billingDetails.hallRent +
    billingDetails.additionalPersonCharge +
    billingDetails.addonsBill +
    billingDetails.servicesBill;
  next();
});

module.exports = mongoose.model('Order', OrderSchema);