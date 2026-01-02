const {
    SlashCommandBuilder,
    EmbedBuilder,
} = require("discord.js");
const { getBalance, addBalance, removeBalance, ensureUserBank } = require("../database/bank");
const { getCoins, removeCoins } = require("../database/coins");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("depositar")
        .setDescription("💰 Depositar coins no banco")
        .addNumberOption((option) =>
            option
                .setName("quantidade")
                .setDescription("Quantidade de coins a depositar")
                .setMinValue(1)
                .setRequired(true)
        ),

    async execute(interaction) {
        const amount = interaction.options.getNumber("quantidade");

        ensureUserBank(interaction.user.id);
        const currentCoins = getCoins(interaction.user.id);

        // Verificar se tem coins suficientes
        if (currentCoins < amount) {
            return interaction.reply({
                content: `❌ Você não tem coins suficientes! Você tem **${currentCoins}** 💰 e está tentando depositar **${amount}** 💰`,
                flags: 64,
            });
        }

        // Realizar depósito
        removeCoins(interaction.user.id, amount);
        addBalance(interaction.user.id, amount);

        const newBalance = getBalance(interaction.user.id);
        const newCoins = getCoins(interaction.user.id);

        const embed = new EmbedBuilder()
            .setTitle("✅ Depósito Realizado")
            .setColor("Green")
            .addFields(
                { name: "📥 Depositado", value: `**${amount}** 💰`, inline: true },
                { name: "🏦 Novo Saldo Bancário", value: `**${newBalance}** 💰`, inline: true },
                { name: "👛 Coins Restantes", value: `**${newCoins}** 💰`, inline: true }
            )
            .setFooter({ text: "Você ganha 0.1% de juros por hora no banco" });

        await interaction.reply({ embeds: [embed], flags: 64 });
    },
};
