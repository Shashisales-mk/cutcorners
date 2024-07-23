const mongoose = require('mongoose');
const Product = require('./Product');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['addon', 'service'] }, 
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
});

// Middleware to delete associated products before a category is removed
categorySchema.pre('findOneAndDelete', async function (next) {
  const categoryId = this.getQuery()['_id'];
  await Product.deleteMany({ category: categoryId });
  next();
});

module.exports = mongoose.model('Category', categorySchema);