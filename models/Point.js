// models/Point.js
const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
  guildId:   { type: String, required: true },
  userId:    { type: String, required: true },
  amount:    { type: Number, required: true },
  type:      { type: String, required: true },
  createdAt: { type: Date,   default: Date.now }
});

module.exports = mongoose.model('Point', PointSchema);
