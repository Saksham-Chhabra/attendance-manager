const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a class name'],
    trim: true,
  },
  teacher: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Class must belong to a teacher'],
  },
  students: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    }
  ],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Class', classSchema);
