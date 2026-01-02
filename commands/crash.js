const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const { getCoins, removeCoins, addCoins } = require('../database/coins');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crash')
        .setDescription('Jogue crash e aposte suas coins')
        .addIntegerOption(option =>
            option
                .setName('valor')
                .setDescription('Quantidade de coins para apostar')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const bet = interaction.options.getInteger('valor');
        const userBalance = getCoins(userId);

        if (bet <= 0)
            return interaction.editReply({ content: '❌ Valor inválido!' });

        if (userBalance < bet)
            return interaction.editReply({ content: '❌ Você não tem coins suficientes!' });

        removeCoins(userId, bet);

        let multiplier = 0.45;
        let crashed = false;
        let stopped = false;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('stop')
                .setLabel('PARAR')
                .setStyle(ButtonStyle.Danger)
        );

        const initialEmbed = new EmbedBuilder()
            .setTitle('🎲 Crash')
            .setDescription(`🚀 Multiplicador: **${multiplier.toFixed(2)}x**`)
            .setColor('Yellow')
            .setFooter({ text: `Aposta: ${bet} coins` })
            .setAuthor({ name: interaction.user.username });

        await interaction.editReply({ embeds: [initialEmbed], components: [row] });

        const msg = await interaction.fetchReply();

        const collector = msg.createMessageComponentCollector({
            time: 20000
        });

        collector.on('collect', async button => {
            if (button.user.id !== interaction.user.id) {
                await button.deferReply({ flags: 64 });
                return button.editReply({ content: '❌ Este não é seu jogo!' });
            }

            await button.deferUpdate();
            stopped = true;
            clearInterval(interval);
            
            const win = Math.floor(bet * multiplier);
            addCoins(userId, win);

            const winEmbed = new EmbedBuilder()
                .setTitle('🎲 Crash')
                .setDescription(`🟩 Você PAROU!\n💰 Ganhou: **${win} coins**\n📈 Multiplicador: **${multiplier.toFixed(2)}x**`)
                .setColor('Green')
                .setFooter({ text: `Aposta: ${bet} coins` })
                .setAuthor({ name: interaction.user.username });

            await msg.edit({ embeds: [winEmbed], components: [] });
            collector.stop();
        });

        collector.on('end', () => {
            if (!stopped && !crashed) {
                clearInterval(interval);
            }
        });

        const interval = setInterval(async () => {
            if (stopped || crashed) {
                clearInterval(interval);
                return;
            }

            multiplier += (Math.random() * 0.20);

            const chanceToCrash = Math.random();
            if (chanceToCrash < 0.08 + (multiplier / 80)) {
                crashed = true;
            }

            try {
                if (!crashed) {
                    const updateEmbed = new EmbedBuilder()
                        .setTitle('🎲 Crash')
                        .setDescription(`🚀 Multiplicador: **${multiplier.toFixed(2)}x**`)
                        .setColor('Yellow')
                        .setFooter({ text: `Aposta: ${bet} coins` })
                        .setAuthor({ name: interaction.user.username });
                    
                    await msg.edit({ embeds: [updateEmbed], components: [row] });
                } else {
                    const crashEmbed = new EmbedBuilder()
                        .setTitle('🎲 Crash')
                        .setDescription(`💥 CRASHOU em **${multiplier.toFixed(2)}x**!\n😢 Você perdeu **${bet} coins**`)
                        .setColor('Red')
                        .setFooter({ text: `Aposta: ${bet} coins` })
                        .setAuthor({ name: interaction.user.username });
                    
                    await msg.edit({ embeds: [crashEmbed], components: [] });
                    clearInterval(interval);
                    collector.stop();
                }
            } catch (error) {
                clearInterval(interval);
                collector.stop();
            }
        }, 400);
    }
};


