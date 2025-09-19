// models/Point.js
const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId:  { type: String, required: true },
  type:    { type: String, required: true }, // must match PointType.name
  amount:  { type: Number, default: 0 }
});

pointSchema.index({ guildId: 1, userId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Point', pointSchema);
