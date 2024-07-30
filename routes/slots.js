const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');
const cron = require('node-cron');

// Add a new slot
router.post('/add-slot', async (req, res) => {
    try {
        const { time, type } = req.body;
        const newSlot = new Slot({ time, type });
        await newSlot.save();
        res.redirect('/admin-panel');
    } catch (error) {
        res.status(400).render('error', { message: 'Error adding slot' });
    }
});

// Delete a slot
router.post('/delete-slot/:id', async (req, res) => {
    try {
        await Slot.findByIdAndDelete(req.params.id);
        res.redirect('/admin-panel');
    } catch (error) {
        res.status(400).render('error', { message: 'Error deleting slot' });
    }
});

// Update slot availability
router.post('/update-slot/:id', async (req, res) => {
    try {
        const { date } = req.body;
        const slot = await Slot.findById(req.params.id);
        
        if (slot.isAvailable) {
            // If making unavailable
            slot.isAvailable = false;
            slot.availableFrom = new Date(date);
            slot.availableFrom.setDate(slot.availableFrom.getDate() + 1); // Set to next day
        } else {
            // If making available
            slot.isAvailable = true;
            slot.availableFrom = null;
        }
        
        await slot.save();
        res.redirect('/admin-panel');
    } catch (error) {
        res.status(400).render('error', { message: 'Error updating slot' });
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