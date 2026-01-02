const {
    SlashCommandBuilder,
    EmbedBuilder,
} = require("discord.js");
const { getBalance, getLoan, ensureUserBank } = require("../database/bank");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bank")
        .setDescription("🏦 Ver seu saldo no banco")
        .addUserOption((option) =>
            option
                .setName("usuario")
                .setDescription("Usuário para ver o saldo (padrão: você)")
                .setRequired(false)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser("usuario") || interaction.user;

        ensureUserBank(user.id);
        const bankBalance = getBalance(user.id);
        const loan = getLoan(user.id);

        const embed = new EmbedBuilder()
            .setTitle(`🏦 Banco de ${user.username}`)
            .setColor("Gold")
            .addFields(
                { name: "💰 Saldo no Banco", value: `**${bankBalance}** 💰`, inline: true },
                { name: "📊 Empréstimo Ativo", value: loan > 0 ? `**${loan}** 💰` : "Nenhum", inline: true },
                { name: "⏰ Juros por Hora", value: "0.7% do seu saldo", inline: false }
            )
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .setFooter({ text: "Use /depositar para adicionar dinheiro" });

        await interaction.reply({ embeds: [embed], flags: 64 });
    },
};
