const mongoose = require('mongoose');

const pointAccessSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  roles: { type: [String], default: [] }
});

module.exports = mongoose.model('PointAccess', pointAccessSchema);
