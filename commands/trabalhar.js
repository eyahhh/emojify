const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const { getCoins, addCoins } = require('../database/coins');
const fs = require('fs');
const path = require('path');

const cooldownFile = path.join(__dirname, '../database/workCooldown.json');

function loadCooldowns() {
    try {
        if (!fs.existsSync(cooldownFile)) {
            fs.writeFileSync(cooldownFile, JSON.stringify({}, null, 2));
            return {};
        }
        return JSON.parse(fs.readFileSync(cooldownFile, 'utf8'));
    } catch (error) {
        return {};
    }
}

function saveCooldowns(data) {
    fs.writeFileSync(cooldownFile, JSON.stringify(data, null, 2));
}

function getCooldown(userId) {
    const cooldowns = loadCooldowns();
    return cooldowns[userId] || 0;
}

function setCooldown(userId, cooldownMs) {
    const cooldowns = loadCooldowns();
    cooldowns[userId] = Date.now() + cooldownMs;
    saveCooldowns(cooldowns);
}

const jobs = [
    { name: '💻 Programador', earnings: { min: 250, max: 500 } },
    { name: '🚕 Motorista de Uber', earnings: { min: 150, max: 350 } },
    { name: '📦 Entregador', earnings: { min: 100, max: 250 } },
    { name: '🧹 Gari', earnings: { min: 50, max: 150 } },
    { name: '👨‍⚕️ Médico', earnings: { min: 400, max: 800 } },
    { name: '🍕 Pizzaiolo', earnings: { min: 100, max: 200 } },
    { name: '🎸 Músico de Rua', earnings: { min: 80, max: 180 } },
    { name: '🏗️ Pedreiro', earnings: { min: 120, max: 280 } },
];

const COOLDOWN_TIME = 60 * 60 * 1000; // 1 hora em ms

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trabalhar')
        .setDescription('Trabalhe para ganhar coins'),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const cooldownEnd = getCooldown(userId);
        const now = Date.now();

        if (cooldownEnd > now) {
            const minutesLeft = Math.ceil((cooldownEnd - now) / 1000 / 60);
            return interaction.editReply({
                content: `⏰ Você precisa esperar **${minutesLeft} minutos** para trabalhar novamente!`
            });
        }

        // Escolher um trabalho aleatório
        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const earnings = Math.floor(Math.random() * (job.earnings.max - job.earnings.min + 1)) + job.earnings.min;

        // Criar embed perguntando qual trabalho fazer
        const embed = new EmbedBuilder()
            .setTitle('💼 Você encontrou um emprego!')
            .setDescription(`**${job.name}**`)
            .setColor('Blue')
            .addFields(
                { name: '📊 Ganho', value: `**${earnings}** coins`, inline: true },
                { name: '⏰ Próximo trabalho em', value: '1 hora', inline: true },
                { name: '📝 Descrição', value: 'Clique em "Trabalhar" para aceitar este emprego!' }
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('trabalhar_aceitar')
                .setLabel('Trabalhar')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('trabalhar_rejeitar')
                .setLabel('Rejeitar')
                .setStyle(ButtonStyle.Danger)
        );

        const response = await interaction.editReply({ embeds: [embed], components: [row] });

        const collector = response.createMessageComponentCollector({
            time: 30000
        });

        collector.on('collect', async button => {
            if (button.user.id !== interaction.user.id) {
                await button.deferReply({ flags: 64 });
                return button.editReply({ content: '❌ Este não é seu emprego!' });
            }

            if (button.customId === 'trabalhar_aceitar') {
                await button.deferUpdate();
                
                // Realizar minigame rápido (pressionar botão)
                const minigameEmbed = new EmbedBuilder()
                    .setTitle('⚡ Minigame: Reação Rápida')
                    .setDescription('Pressione o botão o mais rápido possível!\n\n🎯 Clique em "GO!"')
                    .setColor('Yellow');

                const minigameRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('minigame_go')
                        .setLabel('GO!')
                        .setStyle(ButtonStyle.Danger)
                );

                await button.editReply({ embeds: [minigameEmbed], components: [minigameRow] });

                const minigameCollector = response.createMessageComponentCollector({
                    time: 5000
                });

                let reacted = false;
                let reactionTime = 0;

                minigameCollector.on('collect', async minigameButton => {
                    if (!reacted && minigameButton.customId === 'minigame_go') {
                        reacted = true;
                        reactionTime = Date.now();
                        await minigameButton.deferUpdate();
                    }
                });

                minigameCollector.on('end', async () => {
                    let bonus = 0;
                    if (reacted) {
                        // Quanto mais rápido, mais bônus
                        const responseTime = reactionTime - Date.now();
                        if (responseTime > -2000) bonus = Math.floor(earnings * 0.5); // 50% bônus
                    }

                    const totalEarnings = earnings + bonus;
                    addCoins(userId, totalEarnings);
                    setCooldown(userId, COOLDOWN_TIME);

                    const successEmbed = new EmbedBuilder()
                        .setTitle('✅ Trabalho Concluído!')
                        .setDescription(`**${job.name}**`)
                        .setColor('Green')
                        .addFields(
                            { name: '💰 Ganho Base', value: `${earnings} coins`, inline: true },
                            { name: '🎁 Bônus', value: bonus > 0 ? `+${bonus} coins (reação rápida!)` : 'Nenhum', inline: true },
                            { name: '💵 Total Ganho', value: `**${totalEarnings}** coins`, inline: false }
                        );

                    try {
                        await button.editReply({ embeds: [successEmbed], components: [] });
                    } catch (error) {
                        // Mensagem expirou
                    }
                });
            } else if (button.customId === 'trabalhar_rejeitar') {
                await button.deferUpdate();

                const rejectEmbed = new EmbedBuilder()
                    .setTitle('❌ Emprego Rejeitado')
                    .setDescription('Você rejeitou este emprego. Tente novamente mais tarde!')
                    .setColor('Red');

                await button.editReply({ embeds: [rejectEmbed], components: [] });
            }
        });

        collector.on('end', () => {
            // Timeout - sem resposta
        });
    }
};
