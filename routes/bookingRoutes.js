const express = require('express');
const router = express.Router();
const Occasion = require('../models/Occasion');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Booking = require('../models/Booking');
const TimeSlot = require('../models/Slot'); 
const cron = require('node-cron');
const Theatreimages = require('../models/Theatreimage')

router.get('/', async (req, res) => {
  try {
    const date = new Date(req.query.date); // Assume date is passed as a query parameter
    
    let ptSlots = await TimeSlot.find({ type: 'pt' });
    let phSlots = await TimeSlot.find({ type: 'ph' });
    const images = await Theatreimages.find();

    // Filter slots based on availability for the selected date
    ptSlots = ptSlots.map(slot => ({
      ...slot.toObject(),
      privateScreen1Available: slot.privateScreen1Available && 
        !slot.unavailableDates.some(ud => 
          ud.date.toDateString() === date.toDateString() && 
          ud.screen === 'private-screen-1'
        ),
      privateScreen2Available: slot.privateScreen2Available && 
        !slot.unavailableDates.some(ud => 
          ud.date.toDateString() === date.toDateString() && 
          ud.screen === 'private-screen-2'
        )
    }));

    phSlots = phSlots.map(slot => ({
      ...slot.toObject(),
      partyHallAvailable: slot.partyHallAvailable && 
        !slot.unavailableDates.some(ud => 
          ud.date.toDateString() === date.toDateString() && 
          ud.screen === 'party-hall'
        )
    }));
    
    res.render('book-now', { ptSlots, phSlots, selectedDate: date, images });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).render('error', { message: 'An error occurred while loading available time slots.' });
  }
});

router.post('/select-screen', (req, res) => {
  const { date, screen, timeSlot, numberOfPeople } = req.body;
   // Check if date is provided
  if (!date) {
    req.flash('error', 'Date is required');
    return res.redirect('/booking'); // Redirect back to the booking page
  }
  req.session.bookingData = { date, screen, timeSlot, numberOfPeople };
  console.log('Booking data stored in session:', req.session.bookingData);
  res.redirect('/booking/select-occasion');
});

// Step 2: Select occasion
router.get('/select-occasion', async (req, res) => {
  const occasions = await Occasion.find();
  res.render('book-now-1', { occasions });
});

router.post('/select-occasion', (req, res) => {
  const { occasionId, occasionName } = req.body;
  if (!req.session.bookingData) {
    req.session.bookingData = {}; // Ensure session data is initialized
  }
  req.session.bookingData.occasionId = occasionId;
  req.session.bookingData.occasionName = occasionName;
  res.redirect('/booking/select-addons');
});

// Step 3: Select add-ons
router.get('/select-addons', async (req, res) => {
  const categories = await Category.find({ type: 'addon' });
  const products = await Product.find().populate('category');
  res.render('book-now-2', { categories, products, type: 'addons' });
});

router.post('/select-addons', (req, res) => {
  const addons = req.body.addons || [];
  req.session.selectedAddons = addons;
  res.redirect('/booking/select-services');
});

// New Step 4: Select services
router.get('/select-services', async (req, res) => {
  const categories = await Category.find({ type: 'service' });
  const products = await Product.find().populate('category');
  res.render('book-now-3', { categories, products, type: 'services' });
});

router.post('/select-services', (req, res) => {
  const services = req.body.services || [];
  req.session.selectedServices = services;
  res.redirect('/booking/final');
});
  // sdfljkasdkljas




// Update Step 5: Final booking page
router.get('/final', async (req, res) => {
  try {
    const bookingData = req.session.bookingData || {};
    const selectedAddons = await Product.find({ _id: { $in: req.session.selectedAddons || [] } });
    const selectedServices = await Product.find({ _id: { $in: req.session.selectedServices || [] } });

    // Dynamic hall rent calculation
    let hallRent = 0;
    let additionalPersonCharge = 0;
    const numberOfPeople = parseInt(bookingData.numberOfPeople) || 0;

    switch (bookingData.screen) {
      case 'private-screen-1':
        hallRent = 999; // Base rent for 2 people
        if (numberOfPeople > 2) {
          additionalPersonCharge = (numberOfPeople - 2) * 299;
        }
        break;
      case 'private-screen-2':
        hallRent = 1499; // Base rent for 4 people
        if (numberOfPeople > 4) {
          additionalPersonCharge = (numberOfPeople - 4) * 299;
        }
        break;
      case 'party-hall':
        hallRent = 1299; // Fixed rent for party hall
        break;
      default:
        hallRent = 0; // Handle unknown screen type
    }

    const totalHallRent = hallRent + additionalPersonCharge;
    const addonsBill = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    const servicesBill = selectedServices.reduce((sum, service) => sum + service.price, 0);
    const totalBill = totalHallRent + addonsBill + servicesBill;

    res.render('book-now-final', { 
      bookingData, 
      selectedAddons, 
      selectedServices, 
      hallRent,
      additionalPersonCharge,
      totalHallRent,
      addonsBill,
      servicesBill,
      totalBill 
    });
  } catch (error) {
    console.error('Error in GET /final:', error);
    res.status(500).render('error', { message: 'An error occurred while loading the booking page.' });
  }
});

router.post('/final', async (req, res) => {
  try {
    console.log('Received booking data:', req.body);
    
    const { customerName, customerEmail, customerPhone, totalAmount } = req.body;
    
    // Parse billing details with default values
    const hallRent = parseFloat(req.body.hallRent) || 0;
    const additionalPersonCharge = parseFloat(req.body.additionalPersonCharge) || 0;
    const addonsBill = parseFloat(req.body.addonsBill) || 0;
    const servicesBill = parseFloat(req.body.servicesBill) || 0;
    
    console.log('Billing details received:', { hallRent, additionalPersonCharge, addonsBill, servicesBill });
    
    // Retrieve the date from the session if it's not in the form data
    const date = req.body.date || req.session.bookingData?.date;
    const timeSlot = req.body.timeSlot || req.session.bookingData?.timeSlot;
    const numberOfPeople = req.body.numberOfPeople || req.session.bookingData?.numberOfPeople;
    const screen = req.body.screen || req.session.bookingData?.screen;
    const { occasionId, occasionName } = req.session.bookingData;
    
    console.log('Date retrieved:', date);
    
    if (!date) {
      throw new Error('Date is missing from both the form submission and the session');
    }
    
    // Validate and parse date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid date format. Received: ${date}`);
    }
    
    console.log('Parsed date:', parsedDate);
    
    if (!numberOfPeople) {
      throw new Error('Number of people is missing from both the form submission and the session');
    }
    
    // Validate and parse numberOfPeople
    const parsedNumberOfPeople = parseInt(numberOfPeople, 10);
    if (isNaN(parsedNumberOfPeople)) {
      throw new Error(`Invalid number of people. Received: ${numberOfPeople}`);
    }
    
    const newBooking = new Booking({
      date: parsedDate,
      timeSlot,
      numberOfPeople: parsedNumberOfPeople,
      screen,
      occasionName,
      totalAmount: parseFloat(totalAmount) || 0,
      customerName,
      customerEmail,
      customerPhone,
      billingDetails: {
        hallRent,
        additionalPersonCharge,
        addonsBill,
        servicesBill
      }
    });
    
    await newBooking.save();

    /// Update slot availability
    const slot = await TimeSlot.findOne({ time: timeSlot, type: screen.startsWith('private') ? 'pt' : 'ph' });
    
    if (slot) {
      slot.unavailableDates.push({
        screen: screen,
        date: parsedDate
      });

      if (screen === 'private-screen-1') {
        slot.privateScreen1Available = false;
      } else if (screen === 'private-screen-2') {
        slot.privateScreen2Available = false;
      } else if (screen === 'party-hall') {
        slot.partyHallAvailable = false;
      }

      await slot.save();
    }


    res.redirect('/pay');
  } catch (error) {
    console.error('Booking error:', error);
    res.status(400).render('error', { message: error.message });
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