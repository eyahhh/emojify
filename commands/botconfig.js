const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
} = require("discord.js");
require("dotenv").config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("botconfig")
        .setDescription("⚙️ Configurar o bot (nome, foto, banner, status)")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Verificar se é owner
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({
                content: "❌ Apenas o owner pode usar este comando!",
                flags: 64
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("⚙️ Configuração do Bot")
            .setDescription("Clique nos botões abaixo para configurar as opções do bot")
            .addFields(
                { name: "👤 Nome", value: `Atual: \`${interaction.client.user.username}\``, inline: true },
                { name: "🖼️ Foto", value: interaction.client.user.avatar ? "✅ Configurada" : "❌ Não configurada", inline: true },
                { name: "🎨 Banner", value: interaction.client.user.banner ? "✅ Configurado" : "❌ Não configurado", inline: true },
                { name: "📊 Status", value: `Atual: \`${interaction.client.user.presence?.activities[0]?.name || "Nenhum"}\``, inline: true }
            )
            .setColor("Blue")
            .setFooter({ text: "Clique em um botão para configurar" });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("botconfig_name")
                    .setLabel("👤 Alterar Nome")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("botconfig_avatar")
                    .setLabel("🖼️ Alterar Foto")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("botconfig_banner")
                    .setLabel("🎨 Alterar Banner")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("botconfig_status")
                    .setLabel("📊 Alterar Status")
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [row],
            flags: 64
        });
    }
};
