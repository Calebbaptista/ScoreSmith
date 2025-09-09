const mongoose = require('mongoose');

const medalRoleSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  roleId: { type: String, required: true }
});

module.exports = mongoose.model('MedalRole', medalRoleSchema);
