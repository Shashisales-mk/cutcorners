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


router.delete('/delete-section/:id', async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    // Remove associated images
    // for (const image of section.images) {
    //   const imagePath = path.join(__dirname, '../public', image);
    //   try {
    //     await fs.unlink(imagePath);
    //   } catch (err) {
    //     console.error(`Error deleting image ${imagePath}:`, err);
    //   }
    // }

    // Remove the section from the database
    await Section.findByIdAndDelete(req.params.id);

    // Remove the section from the page's sections array
    await Page.findByIdAndUpdate(section.page, { $pull: { sections: section._id } });

    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ success: false, message: 'Error deleting section' });
  }
});

module.exports = router;