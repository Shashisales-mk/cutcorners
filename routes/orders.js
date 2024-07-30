const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Slot = require('../models/Slot');
const cron = require('node-cron');

// Add new order
router.post('/add-order', async (req, res) => {
  try {
    const {
      occasion,
      event,
      theme,
      persons,
      date,
      slot,
      'categories[]': categories,
      'products[]': products,
      billingName,
      billingEmail,
      billingPhone,
      billingDetails
    } = req.body;

    // Ensure categories and products are always arrays
    const categoriesArray = Array.isArray(categories) ? categories : [categories].filter(Boolean);
    const productsArray = Array.isArray(products) ? products : [products].filter(Boolean);

    console.log('Categories:', categoriesArray);
    console.log('Products:', productsArray);

    // Ensure billingDetails are numbers
    const parsedBillingDetails = {
      hallRent: parseFloat(billingDetails.hallRent) || 0,
      additionalPersonCharge: parseFloat(billingDetails.additionalPersonCharge) || 0,
      addonsBill: parseFloat(billingDetails.addonsBill) || 0,
      servicesBill: parseFloat(billingDetails.servicesBill) || 0
    };

    const newOrder = new Order({
      occasion,
      event,
      theme,
      persons,
      date,
      slot,
      categories: categoriesArray,
      products: productsArray,
      billingName,
      billingEmail,
      billingPhone,
      billingDetails: parsedBillingDetails,
      status: 'Approved'
    });

    await newOrder.save();

    // Update slot availability and set availableFrom date
    const orderDate = new Date(date);
    const availableFrom = new Date(orderDate);
    availableFrom.setDate(availableFrom.getDate() + 1); // Set to next day

    await Slot.findByIdAndUpdate(slot, {
      isAvailable: false,
      availableFrom: availableFrom
    });

    res.redirect('/admin-panel');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// View order details
router.get('/view-order/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('slot')
      .populate('categories')
      .populate('products');
    res.render('view-order', { order });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Cancel order
router.get('/cancel-order/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    
    // Make the slot available immediately
    await Slot.findByIdAndUpdate(order.slot, { 
      isAvailable: true,
      availableFrom: null
    });

    res.redirect('/admin-panel');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Function to update slot availability
async function updateSlotAvailability() {
  const now = new Date();
  try {
    const slotsToUpdate = await Slot.find({
      isAvailable: false,
      availableFrom: { $lte: now }
    });

    for (let slot of slotsToUpdate) {
      slot.isAvailable = true;
      slot.availableFrom = null;
      await slot.save();
    }

    console.log(`Updated availability for ${slotsToUpdate.length} slots.`);
  } catch (error) {
    console.error('Error updating slot availability:', error);
  }
}

// Schedule the update function to run daily at midnight
cron.schedule('0 0 * * *', updateSlotAvailability);

module.exports = router;