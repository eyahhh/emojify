const {
    SlashCommandBuilder,
    EmbedBuilder,
} = require("discord.js");
const { getCoins, removeCoins, addCoins, ensureUser } = require("../database/coins");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("roubar")
        .setDescription("🏴‍☠️ Tentar roubar coins de um usuário (risco: 2% de falha)")
        .addUserOption((option) =>
            option
                .setName("usuario")
                .setDescription("Usuário para roubar")
                .setRequired(true)
        ),

    async execute(interaction) {
        const targetUser = interaction.options.getUser("usuario");

        // Não pode roubar de si mesmo
        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: "❌ Você não pode roubar de si mesmo!",
                flags: 64,
            });
        }

        // Não pode roubar de bots
        if (targetUser.bot) {
            return interaction.reply({
                content: "❌ Você não pode roubar de bots!",
                flags: 64,
            });
        }

        // Garantir que ambos existem no banco de dados
        ensureUser(interaction.user.id);
        ensureUser(targetUser.id);

        const robberCoins = getCoins(interaction.user.id);
        const victimCoins = getCoins(targetUser.id);

        // Verifica se a vítima tem coins
        if (victimCoins <= 0) {
            return interaction.reply({
                content: `❌ **${targetUser.username}** não tem coins para roubar!`,
                flags: 64,
            });
        }

        // 72% de chance de falha
        const failChance = Math.random() * 100;
        const isFailed = failChance < 72;

        if (isFailed) {
            // Falha! Paga fiança de 1-1150
            const fine = Math.floor(Math.random() * 1150) + 1;
            const newCoins = robberCoins - fine;
            
            removeCoins(interaction.user.id, fine);

            const embed = new EmbedBuilder()
                .setTitle("❌ Roubo Fracassado!")
                .setDescription(`Você foi pego tentando roubar de **${targetUser.username}**!`)
                .addFields(
                    { name: "🚔 Fiança a Pagar", value: `**${fine}** 💰`, inline: true },
                    { name: "💰 Seu novo saldo", value: `**${newCoins}** 💰`, inline: true }
                )
                .setColor("Red")
                .setFooter({ text: "Melhor sorte na próxima!" });

            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        // Sucesso! Rouba 1-1000 coins
        const stolenAmount = Math.floor(Math.random() * 1000) + 1;
        const amountToSteal = Math.min(stolenAmount, victimCoins); // Não rouba mais do que a vítima tem

        removeCoins(targetUser.id, amountToSteal);
        addCoins(interaction.user.id, amountToSteal);

        const embed = new EmbedBuilder()
            .setTitle("✅ Roubo Bem-Sucedido!")
            .setDescription(`Você conseguiu roubar de **${targetUser.username}**!`)
            .addFields(
                { name: "💰 Roubado", value: `**${amountToSteal}** 💰`, inline: true },
                { name: "👛 Seu novo saldo", value: `**${getCoins(interaction.user.id)}** 💰`, inline: true },
                { name: "😢 Saldo da vítima", value: `**${getCoins(targetUser.id)}** 💰`, inline: true }
            )
            .setColor("Green")
            .setFooter({ text: "Crime compensado! 🏴‍☠️" });

        await interaction.reply({ embeds: [embed], flags: 64 });
    },
};
