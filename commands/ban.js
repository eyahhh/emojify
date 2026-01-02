const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Bane um membro do servidor")
        .addUserOption(option =>
            option
                .setName("usuário")
                .setDescription("Usuário a ser banido")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("motivo")
                .setDescription("Motivo do banimento")
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });
        
        const user = interaction.options.getUser("usuário");
        const reason = interaction.options.getString("motivo") || "Sem motivo";

        await interaction.guild.members.ban(user, { reason });

        await interaction.editReply(`🔨 **${user.tag}** foi banido!\n📌 Motivo: ${reason}`);
    }
};
