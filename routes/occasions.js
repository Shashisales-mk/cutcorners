// routes/occasionRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Occasion = require('../models/Occasion'); // Adjust the path as needed

// Set up multer for file uploads


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '..', 'public', 'uploads'))
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname))
    }
  });
  
  const upload = multer({ storage: storage });

// // GET occasions for admin panel
// router.get('/', async (req, res) => {
//   try {
//     const occasions = await Occasion.find();
//     res.render('admin-panel', { occasions });
//   } catch (error) {
//     res.status(500).send(error.message);
//   }
// });

// POST new occasion
router.post('/', upload.single('image'), async (req, res) => {
    try {
      const newOccasion = new Occasion({
        name: req.body.name,
        imageUrl: '/uploads/' + req.file.filename
      });
      await newOccasion.save();
      res.redirect('/admin-panel'); // Redirect to admin panel
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

// PUT update occasion
router.put('/:id', async (req, res) => {
  try {
      const occasion = await Occasion.findById(req.params.id);
      if (!occasion) {
          return res.status(404).send('Occasion not found');
      }
      occasion.popular = req.body.popular === 'true';
      await occasion.save();
      res.redirect('/admin-panel');
  } catch (error) {
      res.status(500).send(error.message);
  }
});

// DELETE occasion
router.delete('/:id', async (req, res) => {
    try {
      await Occasion.findByIdAndDelete(req.params.id);
      res.redirect('/admin-panel');
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

module.exports = router;