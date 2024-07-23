// routes/categories.js
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

router.get('/', async (req, res) => {
  const categories = await Category.find();
  res.render('categories-index', { categories });
});

router.get('/new', (req, res) => {
  res.render('category-new');
});

// Create new category
router.post('/', async (req, res) => {
  const category = new Category(req.body);
  await category.save();
  res.redirect('/admin-panel');
});

// Delete category and associated products
router.delete('/:id', async (req, res) => {
  await Category.findOneAndDelete({ _id: req.params.id });
  res.redirect('/admin-panel');
});

module.exports = router;