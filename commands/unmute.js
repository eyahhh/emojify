const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unmute")
        .setDescription("Desmuta um membro do servidor")
        .addUserOption(option =>
            option.setName("usuário")
                .setDescription("Quem você quer desmutar?")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });
        
        const member = interaction.options.getMember("usuário");

        if (!member.isCommunicationDisabled())
            return interaction.editReply({ content: "❌ Esse usuário não está mutado!" });

        await member.timeout(null);

        return interaction.editReply(`🔊 ${member.user.tag} foi desmutado!`);
    }
};
