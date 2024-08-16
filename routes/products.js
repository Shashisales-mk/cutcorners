const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });



router.post('/', upload.single('image'), async (req, res) => {
  try {
      const product = new Product({
          name: req.body.name,
          price: req.body.price,
          category: req.body.category,
          image: `/uploads/${req.file.filename}`
      });
      await product.save();
      await Category.findByIdAndUpdate(req.body.category, { $push: { products: product._id } });
      res.redirect('/admin-panel');
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
});

router.delete('/:id', async (req, res) => {
  try {
      const product = await Product.findByIdAndDelete(req.params.id);
      await Category.findByIdAndUpdate(product.category, { $pull: { products: product._id } });
      res.redirect('/admin-panel');
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
});





router.put('/:id', upload.single('image'), async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (req.file) {
    product.image = `/uploads/${req.file.filename}`;
  }
  Object.assign(product, req.body);
  await product.save();
  res.redirect('/admin-panel');
});

module.exports = router;