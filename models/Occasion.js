const mongoose = require('mongoose');

const occasionSchema = new mongoose.Schema({
    name: String,
    imageUrl: String,
    popular: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Occasion', occasionSchema);
