const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Expulsa um membro do servidor")
        .addUserOption(option =>
            option.setName("usuário")
                .setDescription("Quem você quer expulsar?")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("motivo")
                .setDescription("Motivo da expulsão")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });
        
        const membro = interaction.options.getMember("usuário");
        const motivo = interaction.options.getString("motivo") || "Sem motivo informado";

        if (!membro) 
            return interaction.editReply({ content: "❌ Usuário inválido!" });

        if (!membro.kickable)
            return interaction.editReply({ content: "❌ Não posso expulsar esse usuário! Verifique minha permissão e posição no cargo." });

        await membro.kick(motivo);

        return interaction.editReply(`👢 **${membro.user.tag}** foi expulso do servidor!\n📌 Motivo: ${motivo}`);
    }
};
