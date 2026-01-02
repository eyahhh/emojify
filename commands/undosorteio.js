const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getGiveaway, updateGiveaway } = require("../functions/giveaways");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("undosorteio")
        .setDescription("Cancela um sorteio ativo")
        .addStringOption(o =>
            o.setName("id")
                .setDescription("ID do sorteio a cancelar")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const id = interaction.options.getString("id");
        const gw = getGiveaway(id);

        if (!gw)
            return interaction.editReply({ content: "❌ Sorteio não encontrado!" });

        if (gw.ended)
            return interaction.editReply({ content: "❌ Este sorteio já foi finalizado!" });

        gw.ended = true;
        updateGiveaway(gw);

        // Tenta atualizar a mensagem
        try {
            const guild = interaction.guild;
            const channel = guild.channels.cache.get(gw.channelId);
            if (channel) {
                const message = await channel.messages.fetch(gw.messageId);
                if (message) {
                    const cancelEmbed = new EmbedBuilder()
                        .setTitle("❌ SORTEIO CANCELADO! ❌")
                        .setDescription(`🎁 **${gw.prize}**`)
                        .setColor("Red")
                        .addFields(
                            { name: "👥 Total de Participantes:", value: `${gw.participants.length}`, inline: true },
                            { name: "📛 ID:", value: `\`${gw.id}\``, inline: true }
                        )
                        .setFooter({ text: `Cancelado por: ${interaction.user.tag}` });

                    const disabledRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`join_${gw.id}`)
                                .setLabel("🎟️ Participar")
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId(`participants_${gw.id}`)
                                .setLabel("👥 Participantes")
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true)
                        );

                    await message.edit({ embeds: [cancelEmbed], components: [disabledRow] });
                }
            }
        } catch (error) {
            console.error("Erro ao atualizar mensagem do sorteio cancelado:", error);
        }

        interaction.editReply({ content: `❌ Sorteio **${id}** cancelado com sucesso!` });
    }
};
