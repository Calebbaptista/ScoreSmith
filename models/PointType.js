const mongoose = require('mongoose');

const pointTypeSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

pointTypeSchema.index({ guildId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('PointType', pointTypeSchema);
