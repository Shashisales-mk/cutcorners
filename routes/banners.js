const express = require('express');
const multer = require('multer');
const Banner = require('../models/Banner');
const Occasion = require('../models/Occasion');

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Get all banners
router.get('/', async (req, res) => {
    try {
      const banners = await Banner.find();
      const occasions = await Occasion.find();
      const popularOccasions = await Occasion.find({ isPopular: true });
      res.render('index', { banners, occasions, popularOccasions });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });

// Get add banner page
router.get('/add', (req, res) => {
  res.render('addBanner');
});

// Add new banner
router.post('/add', upload.single('image'), async (req, res) => {
//   const { title, subtitle, description } = req.body;
  const imageUrl = '/uploads/' + req.file.filename;

  const newBanner = new Banner({ imageUrl  });
  await newBanner.save();
  res.redirect('/admin-panel');
});

// Get edit banner page
router.get('/edit/:id', async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  res.render('editBanner', { banner });
});

// Update banner
router.post('/edit/:id', upload.single('image'), async (req, res) => {
//   const { title, subtitle, description } = req.body;
  const banner = await Banner.findById(req.params.id);

  if (req.file) {
    banner.imageUrl = '/uploads/' + req.file.filename;
  }
//   banner.title = title;
//   banner.subtitle = subtitle;
//   banner.description = description;

  await banner.save();
  res.redirect('/admin-panel');
});

// Delete banner
router.get('/delete/:id', async (req, res) => {
  await Banner.findByIdAndDelete(req.params.id);
  res.redirect('/admin-panel');
});

module.exports = router;
