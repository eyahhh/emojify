const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    UserSelectMenuBuilder,
    PermissionFlagsBits
} = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('apoiadores')
        .setDescription('Gerenciar apoiadores do bot'),

    async execute(interaction) {
        // Verificar se é owner
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({
                content: "❌ Apenas o owner pode usar este comando!",
                flags: 64
            });
        }

        const apoiadores = loadApoiadores();
        const bot = interaction.client;

        // Criar embed com lista de apoiadores por rank
        let descricao = '';
        
        for (const [rank, rankInfo] of Object.entries(ranks)) {
            const usuariosRank = Object.entries(apoiadores)
                .filter(([, r]) => r === rank)
                .map(([id]) => `<@${id}>`)
                .join('\n');
            
            if (usuariosRank) {
                descricao += `**${rankInfo.emoji} ${rankInfo.nome}**\n${usuariosRank}\n\n`;
            }
        }

        if (!descricao) {
            descricao = '❌ Nenhum apoiador cadastrado ainda';
        }

        const totalApoiadores = Object.keys(apoiadores).length;

        const embed = new EmbedBuilder()
            .setTitle('⭐ Apoiadores do Bot')
            .setDescription(descricao)
            .setColor('Gold')
            .addFields(
                { name: '🥉 Basic', value: '• Benefício 1\n• Benefício 2', inline: true },
                { name: '🥈 Grand', value: '• Benefício 1\n• Benefício 2\n• Benefício 3', inline: true },
                { name: '🥇 Master', value: '• Todos os benefícios\n• Premium total', inline: true }
            )
            .setFooter({ text: `Total: ${totalApoiadores} apoiador(es)` });

        // Botões de controle
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('apoiadores_adicionar')
                .setLabel('➕ Adicionar')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('apoiadores_remover')
                .setLabel('➖ Remover')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({
            embeds: [embed],
            components: [row],
            flags: 64
        });
    }
};
