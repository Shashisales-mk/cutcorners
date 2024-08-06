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
        const { date, screen } = req.body;
        const slot = await Slot.findById(req.params.id);
        
        const existingUnavailableDate = slot.unavailableDates.find(
            ud => ud.date.toDateString() === new Date(date).toDateString() && ud.screen === screen
        );

        if (!existingUnavailableDate) {
            slot.unavailableDates.push({ date: new Date(date), screen });
            
            switch (screen) {
                case 'private-screen-1':
                    slot.privateScreen1Available = false;
                    break;
                case 'private-screen-2':
                    slot.privateScreen2Available = false;
                    break;
                case 'party-hall':
                    slot.partyHallAvailable = false;
                    break;
            }
        } else {
            slot.unavailableDates = slot.unavailableDates.filter(
                ud => !(ud.date.toDateString() === new Date(date).toDateString() && ud.screen === screen)
            );
            
            // Reset availability if there are no more unavailable dates for this screen
            if (!slot.unavailableDates.some(ud => ud.screen === screen)) {
                switch (screen) {
                    case 'private-screen-1':
                        slot.privateScreen1Available = true;
                        break;
                    case 'private-screen-2':
                        slot.privateScreen2Available = true;
                        break;
                    case 'party-hall':
                        slot.partyHallAvailable = true;
                        break;
                }
            }
        }

        await slot.save();
        res.redirect('/admin-panel');
    } catch (error) {
        res.status(400).render('error', { message: 'Error updating slot' });
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