const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  title: { type: String },
  bio: { type: String },
  joinDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Profile', profileSchema);
