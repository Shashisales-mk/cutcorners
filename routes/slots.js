const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot'); // Adjust the path as needed

// Render admin panel with all slots
// router.get('/admin', async (req, res) => {
//     try {
//         const slots = await Slot.find();
//         res.render('admin-panel', { slots });
//     } catch (error) {
//         res.status(500).render('error', { message: 'Error fetching slots' });
//     }
// });

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
        const slot = await Slot.findById(req.params.id);
        slot.isAvailable = !slot.isAvailable;
        await slot.save();
        res.redirect('/admin-panel');
    } catch (error) {
        res.status(400).render('error', { message: 'Error updating slot' });
    }
});

module.exports = router;