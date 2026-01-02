const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, getCoins } = require("../database/coins");
const { ensureUserBank, getBalance } = require("../database/bank");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("Mostra o saldo de coins")
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuário para verificar o saldo (opcional)")
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser("usuario") || interaction.user;
        const userId = targetUser.id;

        ensureUser(userId);
        ensureUserBank(userId);

        const saldoNormal = getCoins(userId);
        const saldoBanco = getBalance(userId);
        const saldoTotal = saldoNormal + saldoBanco;

        const embed = new EmbedBuilder()
            .setTitle(`💰 Saldo de ${targetUser.username}`)
            .setColor("#FFD700")
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: "💵 Saldo Normal",
                    value: `**${saldoNormal.toLocaleString("pt-BR")}** coins`,
                    inline: true
                },
                {
                    name: "🏦 Saldo no Banco",
                    value: `**${saldoBanco.toLocaleString("pt-BR")}** coins`,
                    inline: true
                },
                {
                    name: "📊 Saldo Total",
                    value: `**${saldoTotal.toLocaleString("pt-BR")}** coins`,
                    inline: false
                }
            )
            .setFooter({ text: `Requisitado por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
