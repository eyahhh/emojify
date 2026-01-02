const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
} = require("discord.js");
const os = require("os");
require("dotenv").config();

function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function getUptime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.join(" ") || "0s";
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("status")
        .setDescription("📊 Ver status do bot (apenas owner)"),

    async execute(interaction) {
        // Verificar se é owner
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({
                content: "❌ Apenas o owner pode usar este comando!",
                flags: 64,
            });
        }

        const client = interaction.client;
        const uptime = getUptime(client.uptime);
        const ram = process.memoryUsage();
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;

        const embed = new EmbedBuilder()
            .setTitle("📊 Status do Bot")
            .setColor("Blue")
            .addFields(
                {
                    name: "🤖 Bot",
                    value: `**Nome:** ${client.user.username}\n**ID:** ${client.user.id}\n**Uptime:** ${uptime}`,
                    inline: false,
                },
                {
                    name: "🌐 Servidores",
                    value: `**Servidores:** ${client.guilds.cache.size}\n**Usuários:** ${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0)}`,
                    inline: true,
                },
                {
                    name: "💾 Memória",
                    value: `**Usada:** ${formatBytes(ram.heapUsed)}\n**Total:** ${formatBytes(ram.heapTotal)}\n**RSS:** ${formatBytes(ram.rss)}`,
                    inline: true,
                },
                {
                    name: "🖥️ Sistema",
                    value: `**RAM Total:** ${formatBytes(totalMemory)}\n**RAM Usada:** ${formatBytes(usedMemory)}\n**RAM Livre:** ${formatBytes(freeMemory)}`,
                    inline: true,
                },
                {
                    name: "📦 Versões",
                    value: `**Node.js:** v${process.version.split("v")[1]}\n**Discord.js:** ${require("discord.js").version}\n**Plataforma:** ${process.platform}`,
                    inline: true,
                },
                {
                    name: "⚙️ CPU",
                    value: `**Cores:** ${os.cpus().length}\n**Modelo:** ${os.cpus()[0].model}`,
                    inline: true,
                }
            )
            .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
            .setFooter({ text: "Atualizado em tempo real" })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    },
};
