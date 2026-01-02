const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("📖 Ver todos os comandos do bot"),

    async execute(interaction) {
        // Lê todos os comandos
        const commandsPath = path.join(__dirname);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

        const categories = {
            "💰 Economia": [],
            "🏦 Banco": [],
            "🎮 Diversão": [],
            "🎁 Sorteios": [],
            "⚙️ Configuração": [],
        };

        // Categoriza comandos
        for (const file of commandFiles) {
            try {
                const command = require(path.join(commandsPath, file));
                if (command.data?.name) {
                    const description = command.data.description || "Sem descrição";
                    const commandName = command.data.name;

                    // Categorizar
                    if (["pay", "roubar", "leaderboardglobal", "leaderboardlocal", "balance"].includes(commandName)) {
                        categories["💰 Economia"].push({ name: commandName, description });
                    } else if (["bank", "depositar", "retirar", "emprestimo"].includes(commandName)) {
                        categories["🏦 Banco"].push({ name: commandName, description });
                    } else if (["sorteio", "undosorteio"].includes(commandName)) {
                        categories["🎁 Sorteios"].push({ name: commandName, description });
                    } else if (["crash", "daily", "reroll"].includes(commandName)) {
                        categories["🎮 Diversão"].push({ name: commandName, description });
                    } else if (["botconfig", "clear", "nuke", "ban", "kick", "mute", "unmute", "lock", "unlock"].includes(commandName)) {
                        categories["⚙️ Configuração"].push({ name: commandName, description });
                    }
                }
            } catch (error) {
                console.error(`Erro ao carregar comando ${file}:`, error.message);
            }
        }

        // Monta embeds por categoria
        const embeds = [];

        for (const [category, commands] of Object.entries(categories)) {
            if (commands.length > 0) {
                const embed = new EmbedBuilder()
                    .setTitle(`${category}`)
                    .setColor("Blurple")
                    .setDescription(
                        commands
                            .map(cmd => `\`/${cmd.name}\` - ${cmd.description}`)
                            .join("\n")
                    );

                embeds.push(embed);
            }
        }

        // Se nenhum comando foi encontrado
        if (embeds.length === 0) {
            return interaction.reply({
                content: "❌ Nenhum comando encontrado!",
                flags: 64,
            });
        }

        // Cria embed de boas-vindas
        const welcomeEmbed = new EmbedBuilder()
            .setTitle("📖 Central de Ajuda do Bot")
            .setDescription(
                "Bem-vindo ao **Skibidi Banco**! 🏦\n\n" +
                "Aqui você pode gerenciar sua economia, participar de sorteios, " +
                "roubar (com risco), ganhar coins diários e muito mais!\n\n" +
                "Use os comandos abaixo para explorar todas as funcionalidades."
            )
            .setColor("Gold")
            .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
            .setFooter({ text: "Use / para ver todos os comandos no chat" });

        // Combina todos os embeds
        const allEmbeds = [welcomeEmbed, ...embeds];

        // Cria botões de navegação
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("help_prev")
                    .setLabel("⬅️ Anterior")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId("help_next")
                    .setLabel("Próximo ➡️")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(allEmbeds.length <= 1),
                new ButtonBuilder()
                    .setCustomId("help_close")
                    .setLabel("Fechar")
                    .setStyle(ButtonStyle.Danger)
            );

        const response = await interaction.reply({
            embeds: [allEmbeds[0]],
            components: [buttons],
            flags: 64,
        });

        // Sistema de paginação
        const collector = response.createMessageComponentCollector({
            time: 5 * 60 * 1000, // 5 minutos
        });

        let currentPage = 0;

        collector.on("collect", async (buttonInteraction) => {
            try {
                if (buttonInteraction.user.id !== interaction.user.id) {
                    return buttonInteraction.reply({
                        content: "❌ Você não pode usar esses botões!",
                        flags: 64,
                    });
                }

                // Processar ação do botão
                if (buttonInteraction.customId === "help_next") {
                    currentPage = (currentPage + 1) % allEmbeds.length;
                } else if (buttonInteraction.customId === "help_prev") {
                    currentPage = (currentPage - 1 + allEmbeds.length) % allEmbeds.length;
                } else if (buttonInteraction.customId === "help_close") {
                    collector.stop();
                    await buttonInteraction.update({
                        content: "✅ Central de ajuda fechada!",
                        embeds: [],
                        components: [],
                    });
                    return;
                }

                const newButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("help_prev")
                            .setLabel("⬅️ Anterior")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === 0),
                        new ButtonBuilder()
                            .setCustomId("help_next")
                            .setLabel("Próximo ➡️")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === allEmbeds.length - 1),
                        new ButtonBuilder()
                            .setCustomId("help_close")
                            .setLabel("Fechar")
                            .setStyle(ButtonStyle.Danger)
                    );

                await buttonInteraction.update({
                    embeds: [allEmbeds[currentPage]],
                    components: [newButtons],
                });
            } catch (error) {
                console.error("Erro no collector de help:", error.message);
            }
        });

        collector.on("end", () => {
            const disabledButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("help_prev")
                        .setLabel("⬅️ Anterior")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId("help_next")
                        .setLabel("Próximo ➡️")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId("help_close")
                        .setLabel("Fechar")
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                );

            response.edit({
                components: [disabledButtons],
            }).catch(() => {});
        });
    },
};
