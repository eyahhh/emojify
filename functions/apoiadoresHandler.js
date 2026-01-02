const {
    UserSelectMenuBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    EmbedBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const apoiadoresFile = path.join(__dirname, '../database/apoiadores.json');

function loadApoiadores() {
    try {
        if (!fs.existsSync(apoiadoresFile)) {
            fs.writeFileSync(apoiadoresFile, JSON.stringify({}, null, 2));
            return {};
        }
        return JSON.parse(fs.readFileSync(apoiadoresFile, 'utf8'));
    } catch (error) {
        return {};
    }
}

function saveApoiadores(data) {
    fs.writeFileSync(apoiadoresFile, JSON.stringify(data, null, 2));
}

const ranks = {
    basic: { emoji: '🥉', nome: 'Basic', cor: '#7F8C8D' },
    grand: { emoji: '🥈', nome: 'Grand', cor: '#C0C0C0' },
    master: { emoji: '🥇', nome: 'Master', cor: '#FFD700' }
};

const handlers = {
    async handleApoiadoresButton(interaction) {
        const [, action] = interaction.customId.split('_');

        if (action === 'adicionar') {
            const userSelect = new UserSelectMenuBuilder()
                .setCustomId('apoiadores_select_adicionar')
                .setPlaceholder('Selecione um usuário para adicionar...')
                .setMaxValues(1);

            const row = new ActionRowBuilder().addComponents(userSelect);

            await interaction.reply({
                components: [row],
                flags: 64
            });
        } else if (action === 'remover') {
            const apoiadores = loadApoiadores();

            if (Object.keys(apoiadores).length === 0) {
                return interaction.reply({
                    content: '❌ Não há apoiadores para remover!',
                    flags: 64
                });
            }

            const userSelect = new UserSelectMenuBuilder()
                .setCustomId('apoiadores_select_remover')
                .setPlaceholder('Selecione um apoiador para remover...')
                .setMaxValues(1);

            const row = new ActionRowBuilder().addComponents(userSelect);

            await interaction.reply({
                components: [row],
                flags: 64
            });
        }
    },

    async handleApoiadoresSelect(interaction) {
        const customId = interaction.customId;
        const selectedUsers = interaction.values;

        // Verificar se é dropdown de rank
        if (customId.startsWith('apoiadores_select_rank_')) {
            const userId = customId.replace('apoiadores_select_rank_', '');
            const rankSelected = selectedUsers[0];

            const apoiadores = loadApoiadores();
            apoiadores[userId] = rankSelected;
            saveApoiadores(apoiadores);

            const user = await interaction.client.users.fetch(userId);
            const rankInfo = ranks[rankSelected];
            const embed = new EmbedBuilder()
                .setTitle('✅ Apoiador Adicionado')
                .setDescription(`${user.toString()} agora é apoiador ${rankInfo.emoji} **${rankInfo.nome}**!`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setColor(rankInfo.cor);

            await interaction.reply({
                embeds: [embed],
                flags: 64
            });
            return;
        }

        const [, , action] = customId.split('_');

        if (action === 'adicionar') {
            const userId = selectedUsers[0];
            const apoiadores = loadApoiadores();

            if (apoiadores[userId]) {
                return interaction.reply({
                    content: '❌ Este usuário já é um apoiador!',
                    flags: 64
                });
            }

            // Mostrar dropdown de ranks
            const rankSelect = new StringSelectMenuBuilder()
                .setCustomId(`apoiadores_select_rank_${userId}`)
                .setPlaceholder('Escolha o rank do apoiador...')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('🥉 Basic')
                        .setValue('basic')
                        .setDescription('Benefícios básicos'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('🥈 Grand')
                        .setValue('grand')
                        .setDescription('Benefícios intermediários'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('🥇 Master')
                        .setValue('master')
                        .setDescription('Todos os benefícios')
                );

            const row = new ActionRowBuilder().addComponents(rankSelect);

            await interaction.reply({
                content: 'Escolha o rank para este apoiador:',
                components: [row],
                flags: 64
            });
        } else if (action === 'remover') {
            const userId = selectedUsers[0];
            const apoiadores = loadApoiadores();

            if (!apoiadores[userId]) {
                return interaction.reply({
                    content: '❌ Este usuário não é um apoiador!',
                    flags: 64
                });
            }

            delete apoiadores[userId];
            saveApoiadores(apoiadores);

            const user = await interaction.client.users.fetch(userId);
            const embed = new EmbedBuilder()
                .setTitle('✅ Apoiador Removido')
                .setDescription(`${user.toString()} foi removido da lista de apoiadores.`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setColor('Red');

            await interaction.reply({
                embeds: [embed],
                flags: 64
            });
        }
    }
};

module.exports = handlers;

