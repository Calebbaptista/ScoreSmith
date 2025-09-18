const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

userProfileSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('UserProfile', userProfileSchema);
