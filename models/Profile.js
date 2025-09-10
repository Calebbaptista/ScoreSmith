const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: String,
  guildId: String,
  title: String,
  joinDate: Date
});

module.exports = mongoose.model('Profile', profileSchema);
