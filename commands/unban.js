const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Desbane um usuário do servidor")
        .addStringOption(option =>
            option
                .setName("id")
                .setDescription("ID do usuário a desbanir")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });
        
        const userId = interaction.options.getString("id");

        try {
            await interaction.guild.members.unban(userId);
            await interaction.editReply(`♻️ Usuário **${userId}** desbanido!`);
        } catch {
            await interaction.editReply({ content: "❌ Usuário não está banido ou ID inválida!" });
        }
    }
};
