const {
    SlashCommandBuilder,
    EmbedBuilder,
} = require("discord.js");
const { getBalance, removeBalance, ensureUserBank } = require("../database/bank");
const { getCoins, addCoins } = require("../database/coins");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("retirar")
        .setDescription("💰 Retirar coins do banco")
        .addNumberOption((option) =>
            option
                .setName("quantidade")
                .setDescription("Quantidade de coins a retirar")
                .setMinValue(1)
                .setRequired(true)
        ),

    async execute(interaction) {
        const amount = interaction.options.getNumber("quantidade");

        ensureUserBank(interaction.user.id);
        const bankBalance = getBalance(interaction.user.id);

        // Verificar se tem coins suficientes no banco
        if (bankBalance < amount) {
            return interaction.reply({
                content: `❌ Você não tem coins suficientes no banco! Você tem **${bankBalance}** 💰 e está tentando retirar **${amount}** 💰`,
                flags: 64,
            });
        }

        // Realizar retirada
        removeBalance(interaction.user.id, amount);
        addCoins(interaction.user.id, amount);

        const newBalance = getBalance(interaction.user.id);
        const newCoins = getCoins(interaction.user.id);

        const embed = new EmbedBuilder()
            .setTitle("✅ Retirada Realizada")
            .setColor("Green")
            .addFields(
                { name: "📤 Retirado", value: `**${amount}** 💰`, inline: true },
                { name: "🏦 Novo Saldo Bancário", value: `**${newBalance}** 💰`, inline: true },
                { name: "👛 Novo Saldo de Coins", value: `**${newCoins}** 💰`, inline: true }
            )
            .setFooter({ text: "Use /depositar para adicionar mais dinheiro ao banco" });

        await interaction.reply({ embeds: [embed], flags: 64 });
    },
};
