// routes/images.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Image = require('../models/Theatreimage');

// Set up Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/'); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Appending extension
  }
});

const upload = multer({ storage: storage });

// Route to upload a new image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { title } = req.body;
    const url = `/uploads/${req.file.filename}`;

    const newImage = new Image({ title, url });
    await newImage.save();

    res.redirect('/admin-panel'); // Redirect to a page where images are displayed
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Route to update an image
router.put('/update/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const image = await Image.findById(id);

    if (req.file) {
      // If a new image file is uploaded, update the URL
      const url = `/uploads/${req.file.filename}`;
      image.url = url;
    }

    image.title = title;
    await image.save();

    res.redirect('/admin-panel'); // Redirect to a page where images are displayed
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
