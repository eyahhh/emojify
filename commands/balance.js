const { SlashCommandBuilder } = require("discord.js");
const { ensureUser, getCoins } = require("../database/coins");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("Mostra seu saldo de coins"),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        ensureUser(userId);

        const saldo = getCoins(userId);

        interaction.editReply(`💰 Você tem **${saldo}** coins!`);
    }
};
