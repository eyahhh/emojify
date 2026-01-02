const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lock")
        .setDescription("Tranca o canal atual")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });
        
        const channel = interaction.channel;

        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: false
        });

        await interaction.editReply("🔒 Canal trancado!");
    }
};
