const {
    SlashCommandBuilder,
    EmbedBuilder,
} = require("discord.js");
const { getLoan, createLoan, payLoan, ensureUserBank, addBalance } = require("../database/bank");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("emprestimo")
        .setDescription("💳 Sistema de empréstimos")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("pedir")
                .setDescription("Pedir um empréstimo (máx 15.000)")
                .addNumberOption((option) =>
                    option
                        .setName("quantidade")
                        .setDescription("Quantidade a emprestar (máximo 15000)")
                        .setMinValue(100)
                        .setMaxValue(15000)
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("pagar")
                .setDescription("Pagar parte ou tudo do seu empréstimo")
                .addNumberOption((option) =>
                    option
                        .setName("quantidade")
                        .setDescription("Quantidade a pagar")
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("status")
                .setDescription("Ver status do seu empréstimo")
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        ensureUserBank(interaction.user.id);

        if (subcommand === "pedir") {
            const amount = interaction.options.getNumber("quantidade");
            const currentLoan = getLoan(interaction.user.id);

            if (currentLoan > 0) {
                return interaction.reply({
                    content: `❌ Você já tem um empréstimo ativo de **${currentLoan}** 💰! Pague-o primeiro para pedir outro.`,
                    flags: 64,
                });
            }

            const success = createLoan(interaction.user.id, amount);

            if (!success) {
                return interaction.reply({
                    content: "❌ Erro ao criar empréstimo!",
                    flags: 64,
                });
            }

            addBalance(interaction.user.id, amount);

            const embed = new EmbedBuilder()
                .setTitle("✅ Empréstimo Aprovado")
                .setColor("Green")
                .addFields(
                    { name: "💰 Valor", value: `**${amount}** 💰`, inline: true },
                    { name: "⏰ Prazo", value: "3 dias", inline: true },
                    { name: "⚠️ Aviso", value: "Se não pagar em 3 dias, será cobrado 20% de juros", inline: false }
                )
                .setFooter({ text: "Use /emprestimo pagar para devolver o dinheiro" });

            await interaction.reply({ embeds: [embed], flags: 64 });
        }

        else if (subcommand === "pagar") {
            const amount = interaction.options.getNumber("quantidade");
            const currentLoan = getLoan(interaction.user.id);

            if (currentLoan <= 0) {
                return interaction.reply({
                    content: "❌ Você não tem nenhum empréstimo ativo!",
                    flags: 64,
                });
            }

            if (amount > currentLoan) {
                return interaction.reply({
                    content: `❌ Você está tentando pagar **${amount}** 💰 mas deve apenas **${currentLoan}** 💰!`,
                    flags: 64,
                });
            }

            payLoan(interaction.user.id, amount);
            const newLoan = getLoan(interaction.user.id);

            const embed = new EmbedBuilder()
                .setTitle("✅ Pagamento Realizado")
                .setColor("Green")
                .addFields(
                    { name: "💸 Pago", value: `**${amount}** 💰`, inline: true },
                    { name: "📊 Saldo da Dívida", value: newLoan > 0 ? `**${newLoan}** 💰` : "Dívida Quitada! ✅", inline: true }
                );

            await interaction.reply({ embeds: [embed], flags: 64 });
        }

        else if (subcommand === "status") {
            const loan = getLoan(interaction.user.id);
            const loanData = require("../database/bank").getAllUsers()[interaction.user.id] || {};
            const deadline = loanData.loanDeadline || null;

            let statusText = loan > 0 ? `**${loan}** 💰 (Vencimento em <t:${Math.floor(deadline / 1000)}:R>)` : "Nenhum empréstimo ativo";

            const embed = new EmbedBuilder()
                .setTitle("📊 Status do Empréstimo")
                .setColor("Blue")
                .addFields(
                    { name: "💳 Valor devido", value: statusText, inline: false },
                    { name: "ℹ️ Informações", value: "• Taxa de juros: 20% após 3 dias\n• Máximo: 15.000 💰\n• Use /emprestimo pagar para pagar", inline: false }
                );

            await interaction.reply({ embeds: [embed], flags: 64 });
        }
    },
};
