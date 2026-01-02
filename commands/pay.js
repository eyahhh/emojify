const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
} = require("discord.js");
const { getCoins, removeCoins, addCoins, ensureUser } = require("../database/coins");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pay")
        .setDescription("💸 Transferir coins para outro usuário")
        .addUserOption((option) =>
            option
                .setName("usuario")
                .setDescription("Usuário que vai receber os coins")
                .setRequired(true)
        )
        .addNumberOption((option) =>
            option
                .setName("quantidade")
                .setDescription("Quantidade de coins a transferir")
                .setMinValue(1)
                .setRequired(true)
        ),

    async execute(interaction) {
        const targetUser = interaction.options.getUser("usuario");
        const amount = interaction.options.getNumber("quantidade");

        // Não pode transferir para si mesmo
        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: "❌ Você não pode transferir coins para si mesmo!",
                flags: 64,
            });
        }

        // Não pode transferir para bots
        if (targetUser.bot) {
            return interaction.reply({
                content: "❌ Você não pode transferir coins para bots!",
                flags: 64,
            });
        }

        // Garantir que ambos existem no banco de dados
        ensureUser(interaction.user.id);
        ensureUser(targetUser.id);

        const senderCoins = getCoins(interaction.user.id);

        // Verificar se tem coins suficientes
        if (senderCoins < amount) {
            return interaction.reply({
                content: `❌ Você não tem coins suficientes! Você tem **${senderCoins}** 💰 e está tentando transferir **${amount}** 💰`,
                flags: 64,
            });
        }

        // Realizar transferência
        removeCoins(interaction.user.id, amount);
        addCoins(targetUser.id, amount);

        const embed = new EmbedBuilder()
            .setTitle("✅ Transferência Realizada")
            .setDescription(`**${interaction.user.username}** transferiu **${amount}** 💰 para **${targetUser.username}**`)
            .addFields(
                { name: "Seu saldo anterior", value: `**${senderCoins}** 💰`, inline: true },
                { name: "Seu novo saldo", value: `**${senderCoins - amount}** 💰`, inline: true },
                { name: "Saldo do receptor", value: `**${getCoins(targetUser.id)}** 💰`, inline: true }
            )
            .setColor("Green")
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    },
};
