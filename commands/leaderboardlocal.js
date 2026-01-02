const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboardlocal")
        .setDescription("🏢 Ver o ranking de coins do servidor")
        .addNumberOption((option) =>
            option
                .setName("posicao")
                .setDescription("Posição inicial (padrão: 1)")
                .setMinValue(1)
                .setRequired(false)
        ),

    async execute(interaction) {
        const coinsFile = path.join(__dirname, "../database/coins.json");
        
        if (!fs.existsSync(coinsFile)) {
            return interaction.reply({
                content: "❌ Nenhum usuário encontrado!",
                flags: 64,
            });
        }

        const coinsData = JSON.parse(fs.readFileSync(coinsFile, "utf8"));
        const startPosition = interaction.options.getNumber("posicao") || 1;

        // Pega todos os membros do servidor
        const guildMembers = await interaction.guild.members.fetch();
        const memberIds = new Set(guildMembers.map(m => m.user.id));

        // Filtra apenas membros do servidor e ordena por coins
        const leaderboard = Object.entries(coinsData)
            .filter(([userId]) => memberIds.has(userId))
            .map(([userId, coins]) => ({ userId, coins }))
            .sort((a, b) => b.coins - a.coins);

        if (leaderboard.length === 0) {
            return interaction.reply({
                content: "❌ Nenhum usuário encontrado neste servidor!",
                flags: 64,
            });
        }

        // Pega top 10 a partir da posição
        const topUsers = leaderboard.slice(startPosition - 1, startPosition + 9);

        if (topUsers.length === 0) {
            return interaction.reply({
                content: `❌ Posição ${startPosition} não existe!`,
                flags: 64,
            });
        }

        let description = "";
        for (let i = 0; i < topUsers.length; i++) {
            const position = startPosition + i;
            const user = topUsers[i];
            const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : "   ";

            try {
                const userData = await interaction.client.users.fetch(user.userId);
                description += `${medal} **#${position}** - ${userData.username}: **${user.coins}** 💰\n`;
            } catch {
                description += `${medal} **#${position}** - <@${user.userId}>: **${user.coins}** 💰\n`;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`🏢 Ranking de Coins - ${interaction.guild.name}`)
            .setDescription(description)
            .setColor("Blurple")
            .setFooter({
                text: `Mostrando posições ${startPosition} a ${startPosition + topUsers.length - 1} de ${leaderboard.length}`,
            });

        await interaction.reply({ embeds: [embed], flags: 64 });
    },
};
