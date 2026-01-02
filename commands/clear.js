const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("🗑️ Limpa mensagens do canal")
        .addIntegerOption(option =>
            option
                .setName("quantidade")
                .setDescription("Número de mensagens a deletar (máximo 100)")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const quantidade = interaction.options.getInteger("quantidade");
        const canal = interaction.channel;

        try {
            // Deleta as mensagens
            const deletadas = await canal.bulkDelete(quantidade, true);

            return interaction.editReply({
                content: `🗑️ **${deletadas.size}** mensagens foram deletadas com sucesso!`
            });
        } catch (error) {
            console.error("Erro ao limpar mensagens:", error);
            return interaction.editReply({
                content: "❌ Erro ao deletar mensagens. Certifique-se de que as mensagens têm menos de 14 dias."
            });
        }
    }
};
