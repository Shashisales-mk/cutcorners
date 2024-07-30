// routes/admin.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const MenuItem = require('../models/Menuitem');
const Section = require('../models/Section');
const Page = require('../models/Page');


// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });



// routes/admin.js
router.post('/create-section', upload.array('themeImages', 7), async (req, res) => {
  try {
    const {page,  menuItem, title, readyTime, description, price, features } = req.body;
    
    // Fetch the menuItem to get its name
    const themeMenuItem = await MenuItem.findById(menuItem);
    if (!themeMenuItem) {
      return res.status(404).send('Theme not found');
    }

    const newSection = new Section({
      page: page,
      name: themeMenuItem.name, // Set the name to be the same as the theme name
      menuItem,
      title,
      readyTime: parseFloat(readyTime),
      description,
      price: parseFloat(price),
      features: features.split('\n').map(f => f.trim()).filter(f => f),
      images: req.files.map(file => `/uploads/${file.filename}`)
    });

    const savedSection = await newSection.save();
     // Add the section to the page's sections array
     await Page.findByIdAndUpdate(page, { $push: { sections: savedSection._id } });
    res.redirect("/admin-panel");
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating section');
  }
});

module.exports = router;