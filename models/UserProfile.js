const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId:  { type: String, required: true },
  points:  [{
    type: String,               // point type name
    amount: { type: Number, default: 0 }
  }]
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);
