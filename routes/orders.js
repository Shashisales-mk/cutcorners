const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Slot = require('../models/Slot');
const cron = require('node-cron');
// Add new order
router.post('/add-order', async (req, res) => {
  try {
    const { 
      occasion, event, theme, persons, date, slot, 
      'categories[]': categories, 'products[]': products, 
      billingName, billingEmail, billingPhone, billingDetails 
    } = req.body;

    const categoriesArray = Array.isArray(categories) ? categories : [categories].filter(Boolean);
    const productsArray = Array.isArray(products) ? products : [products].filter(Boolean);

    const parsedBillingDetails = {
      hallRent: parseFloat(billingDetails.hallRent) || 0,
      additionalPersonCharge: parseFloat(billingDetails.additionalPersonCharge) || 0,
      addonsBill: parseFloat(billingDetails.addonsBill) || 0,
      servicesBill: parseFloat(billingDetails.servicesBill) || 0
    };

    const newOrder = new Order({
      occasion, event, theme, persons, date, slot,
      categories: categoriesArray, products: productsArray,
      billingName, billingEmail, billingPhone,
      billingDetails: parsedBillingDetails,
      status: 'Approved'
    });

    await newOrder.save();

    // Update slot availability
    const slotToUpdate = await Slot.findById(slot);
    if (slotToUpdate) {
      const orderDate = new Date(date);
      orderDate.setHours(0, 0, 0, 0); // Set to start of day

      slotToUpdate.unavailableDates.push({
        screen: event,
        date: orderDate
      });

      if (event === 'Private Screen-1') {
        slotToUpdate.privateScreen1Available = false;
      } else if (event === 'Private Screen-2') {
        slotToUpdate.privateScreen2Available = false;
      } else if (event === 'Party Hall') {
        slotToUpdate.partyHallAvailable = false;
      }

      await slotToUpdate.save();
    }

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
    
    // Make the slot available again
    const slot = await Slot.findById(order.slot);
    if (slot) {
      const orderDate = new Date(order.date);
      orderDate.setHours(0, 0, 0, 0); // Set to start of day

      // Remove the unavailable date for this order
      slot.unavailableDates = slot.unavailableDates.filter(ud => 
        ud.screen !== order.event || ud.date.getTime() !== orderDate.getTime()
      );

      // Reset availability based on remaining unavailable dates
      if (order.event === 'Private Screen-1') {
        slot.privateScreen1Available = !slot.unavailableDates.some(ud => ud.screen === 'Private Screen-1');
      } else if (order.event === 'Private Screen-2') {
        slot.privateScreen2Available = !slot.unavailableDates.some(ud => ud.screen === 'Private Screen-2');
      } else if (order.event === 'Party Hall') {
        slot.partyHallAvailable = !slot.unavailableDates.some(ud => ud.screen === 'Party Hall');
      }

      await slot.save();
    }

    res.redirect('/admin-panel');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

async function updateSlotAvailability() {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to start of day
  
  try {
      const slots = await Slot.find();
      
      for (let slot of slots) {
          let updated = false;
          
          slot.unavailableDates = slot.unavailableDates.filter(ud => {
              // Compare dates without time
              const udDate = new Date(ud.date);
              udDate.setHours(0, 0, 0, 0);
              return udDate >= now;
          });
          
          const ps1Unavailable = slot.unavailableDates.some(ud => ud.screen === 'Private Screen-1');
          const ps2Unavailable = slot.unavailableDates.some(ud => ud.screen === 'Private Screen-2');
          const phUnavailable = slot.unavailableDates.some(ud => ud.screen === 'Party Hall');
          
          if (slot.privateScreen1Available !== !ps1Unavailable) {
              slot.privateScreen1Available = !ps1Unavailable;
              updated = true;
          }
          if (slot.privateScreen2Available !== !ps2Unavailable) {
              slot.privateScreen2Available = !ps2Unavailable;
              updated = true;
          }
          if (slot.partyHallAvailable !== !phUnavailable) {
              slot.partyHallAvailable = !phUnavailable;
              updated = true;
          }
          
          if (updated) {
              await slot.save();
              console.log(`Updated availability for slot: ${slot._id}`);
          }
      }
      
      console.log(`Checked availability for ${slots.length} slots.`);
  } catch (error) {
      console.error('Error updating slot availability:', error);
  }
}

// Schedule the update function to run daily at midnight
cron.schedule('0 0 * * *', () => {
  console.log('Running daily slot availability update');
  updateSlotAvailability();
});

module.exports = router;