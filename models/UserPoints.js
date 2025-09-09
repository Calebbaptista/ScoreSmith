const mongoose = require('mongoose');

const userPointsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  points: [
    {
      typeName: String,
      value: Number
    }
  ]
});

module.exports = mongoose.model('UserPoints', userPointsSchema);
