const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  email: {
    type: String,
    trim: true,
    lowercase: true,
    required: true,
    validate: [{
      validator(value) {
        return /^[-.\w]+@([\w-]+\.)+[\w-]{2,12}$/.test(value);
      },
      message: 'Некорректный email.'
    }],
    unique: true
  },
  displayName: {
    type: String,
    trim: true,
    required: true,
    unique: true
  }
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('User', schema);
