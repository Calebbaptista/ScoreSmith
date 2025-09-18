// commands/removerating.js
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removerating')
    .setDescription('Remove a rating by its exact reason text.')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('Member whose rating to remove')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Exact reason text used when the rating was added')
        .setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');
    // …find & delete the rating record matching user + reason…
    await interaction.reply(`🗑️ Removed rating for ${user.tag} with reason: "${reason}".`);
  }
};
