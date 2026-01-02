const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const botConfigFile = path.join(__dirname, "../database/botconfig.json");

function loadBotConfig() {
    try {
        if (!fs.existsSync(botConfigFile)) {
            return { bio: "" };
        }
        return JSON.parse(fs.readFileSync(botConfigFile, "utf8"));
    } catch (error) {
        return { bio: "" };
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("perfil")
        .setDescription("Ver o perfil do bot"),

    async execute(interaction) {
        const config = loadBotConfig();
        const bot = interaction.client.user;

        const embed = new EmbedBuilder()
            .setTitle(`📋 Perfil de ${bot.username}`)
            .setThumbnail(bot.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: "👤 Nome", value: bot.username, inline: true },
                { name: "🆔 ID", value: bot.id, inline: true },
                { name: "📝 Bio", value: config.bio || "Sem bio configurada" }
            )
            .setColor("Blue")
            .setFooter({ text: `Criado em ${bot.createdAt.toLocaleDateString("pt-BR")}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
