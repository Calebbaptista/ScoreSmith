const mongoose = require('mongoose');

const accessMapSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true
  },
  roleId: {
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

accessMapSchema.index({ guildId: 1, roleId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('AccessMap', accessMapSchema);
