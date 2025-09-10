const PointType = require('../../models/PointType');
const { StringSelectMenuBuilder } = require('discord.js');

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;
  const role = interaction.options.getRole('role');
  const pointTypes = await PointType.find({ guildId });

  if (!pointTypes.length) {
    return interaction.reply({ content: '⚠️ No point types found to configure.', ephemeral: true });
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`toggle-access-${role.id}`)
    .setPlaceholder('Select a point type to toggle access')
    .addOptions(pointTypes.map(pt => ({
      label: pt.name,
      value: pt.name
    })));

  await interaction.reply({
    content: `🔧 Choose a point type to toggle access for <@&${role.id}>:`,
    components: [{ type: 1, components: [menu] }],
    ephemeral: true
  });
};
