const mongoose = require('mongoose');

const pointTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('PointType', pointTypeSchema);
