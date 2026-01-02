const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    SelectMenuBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require("discord.js");
require("dotenv").config();

const handlers = {
    // Botões do botconfig
    async handleBotconfigButton(interaction) {
        const [, action] = interaction.customId.split("_");

        if (action === "name") {
            const modal = new ModalBuilder()
                .setCustomId("botconfig_modal_name")
                .setTitle("Alterar Nome do Bot");

            const nameInput = new TextInputBuilder()
                .setCustomId("botname")
                .setLabel("Novo Nome")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(interaction.client.user.username)
                .setMaxLength(32);

            const row = new ActionRowBuilder().addComponents(nameInput);
            modal.addComponents(row);
            await interaction.showModal(modal);
        } 
        else if (action === "avatar") {
            const modal = new ModalBuilder()
                .setCustomId("botconfig_modal_avatar")
                .setTitle("Alterar Foto do Bot");

            const avatarInput = new TextInputBuilder()
                .setCustomId("botavatar")
                .setLabel("URL da Imagem")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("https://example.com/image.png");

            const row = new ActionRowBuilder().addComponents(avatarInput);
            modal.addComponents(row);
            await interaction.showModal(modal);
        }
        else if (action === "banner") {
            const modal = new ModalBuilder()
                .setCustomId("botconfig_modal_banner")
                .setTitle("Alterar Banner do Bot");

            const bannerInput = new TextInputBuilder()
                .setCustomId("botbanner")
                .setLabel("URL do Banner")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("https://example.com/banner.png");

            const row = new ActionRowBuilder().addComponents(bannerInput);
            modal.addComponents(row);
            await interaction.showModal(modal);
        }
        else if (action === "status") {
            const modal = new ModalBuilder()
                .setCustomId("botconfig_modal_status")
                .setTitle("Alterar Status do Bot");

            const statusInput = new TextInputBuilder()
                .setCustomId("botstatus")
                .setLabel("Novo Status")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Ex: Skibidi Toilet")
                .setMaxLength(128);

            const typeInput = new TextInputBuilder()
                .setCustomId("statustype")
                .setLabel("Tipo (playing/watching/listening/streaming)")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("playing")
                .setValue("playing")
                .setMaxLength(20);

            const row1 = new ActionRowBuilder().addComponents(statusInput);
            const row2 = new ActionRowBuilder().addComponents(typeInput);
            modal.addComponents(row1, row2);
            await interaction.showModal(modal);
        }
    },

    // Modais do botconfig
    async handleBotconfigModal(interaction) {
        const [, , type] = interaction.customId.split("_");

        try {
            if (type === "name") {
                const newName = interaction.fields.getTextInputValue("botname");
                await interaction.client.user.setUsername(newName);
                
                const embed = new EmbedBuilder()
                    .setTitle("✅ Nome Alterado")
                    .setDescription(`Nome do bot alterado para: **${newName}**`)
                    .setColor("Green");

                await interaction.reply({ embeds: [embed], flags: 64 });
            }
            else if (type === "avatar") {
                const avatarUrl = interaction.fields.getTextInputValue("botavatar");
                await interaction.client.user.setAvatar(avatarUrl);
                
                const embed = new EmbedBuilder()
                    .setTitle("✅ Foto Alterada")
                    .setDescription("Foto do bot alterada com sucesso!")
                    .setThumbnail(avatarUrl)
                    .setColor("Green");

                await interaction.reply({ embeds: [embed], flags: 64 });
            }
            else if (type === "banner") {
                const bannerUrl = interaction.fields.getTextInputValue("botbanner");
                await interaction.client.user.setBanner(bannerUrl);
                
                const embed = new EmbedBuilder()
                    .setTitle("✅ Banner Alterado")
                    .setDescription("Banner do bot alterado com sucesso!")
                    .setColor("Green");

                await interaction.reply({ embeds: [embed], flags: 64 });
            }
            else if (type === "status") {
                const newStatus = interaction.fields.getTextInputValue("botstatus");
                const statusType = (interaction.fields.getTextInputValue("statustype") || "playing").toLowerCase();

                const validTypes = {
                    playing: 0,
                    watching: 3,
                    listening: 2,
                    streaming: 1
                };

                const activityType = validTypes[statusType] || validTypes.playing;

                await interaction.client.user.setActivity(newStatus, { type: activityType });
                
                const typeDisplay = statusType.charAt(0).toUpperCase() + statusType.slice(1);
                const embed = new EmbedBuilder()
                    .setTitle("✅ Status Alterado")
                    .setDescription(`Status: **${typeDisplay} ${newStatus}**`)
                    .setColor("Green");

                await interaction.reply({ embeds: [embed], flags: 64 });
            }
        } catch (error) {
            console.error("Erro ao alterar configuração do bot:", error);
            const embed = new EmbedBuilder()
                .setTitle("❌ Erro")
                .setDescription(`Erro ao alterar configuração: ${error.message}`)
                .setColor("Red");

            await interaction.reply({ embeds: [embed], flags: 64 });
        }
    }
};

module.exports = handlers;
