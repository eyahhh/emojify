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
        .setName('duelo')
        .setDescription('Desafie um usuário para um duelo de coins')
        .addIntegerOption(option =>
            option
                .setName('coins')
                .setDescription('Quantidade de coins que você quer apostar')
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName('alvo')
                .setDescription('Usuário que você deseja desafiar')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const challenger = interaction.user;
        const target = interaction.options.getUser('alvo');
        const betAmount = interaction.options.getInteger('coins');

        // Validações
        if (target.id === challenger.id)
            return interaction.editReply('❌ Você não pode desafiar a si mesmo!');

        if (target.bot)
            return interaction.editReply('❌ Você não pode desafiar um bot!');

        if (betAmount <= 0)
            return interaction.editReply('❌ O valor da aposta deve ser positivo!');

        // Verificar saldo do challenger
        const challengerBalance = getCoins(challenger.id);
        if (challengerBalance < betAmount)
            return interaction.editReply(`❌ Você não tem ${betAmount} coins! Você tem ${challengerBalance} coins.`);

        // Remover coins do challenger imediatamente
        removeCoins(challenger.id, betAmount);

        let acceptCount = 0; // 0 = ninguém aceitou, 1 = um aceitou, 2 = ambos aceitaram
        let targetAccepted = false;
        let targetStarted = false;

        // Criar embed inicial
        const duelEmbed = new EmbedBuilder()
            .setTitle('⚔️ DESAFIO DE DUELO')
            .setDescription(`${target.toString()}, você foi desafiado para um duelo!`)
            .setColor('Red')
            .addFields(
                { name: '🥊 Desafiante', value: challenger.toString(), inline: true },
                { name: '🎯 Alvo', value: target.toString(), inline: true },
                { name: '💰 Aposta', value: `**${betAmount}** coins cada um`, inline: false },
                { name: '📊 Status', value: '0/2 - Aguardando aceitação...', inline: false }
            )
            .setFooter({ text: 'Clique em "Aceitar Duelo" para participar' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('duelo_aceitar')
                .setLabel('Aceitar Duelo')
                .setStyle(ButtonStyle.Success)
        );

        const response = await interaction.editReply({ embeds: [duelEmbed], components: [row] });

        const collector = response.createMessageComponentCollector({
            time: 60000 // 60 segundos para aceitar
        });

        collector.on('collect', async button => {
            if (button.user.id !== target.id) {
                await button.deferReply({ flags: 64 });
                return button.editReply({ content: '❌ Você não foi desafiado!' });
            }

            await button.deferUpdate();

            // Verificar saldo do target
            const targetBalance = getCoins(target.id);
            if (targetBalance < betAmount) {
                addCoins(challenger.id, betAmount); // Devolver coins do challenger
                const noMoneyEmbed = new EmbedBuilder()
                    .setTitle('❌ Duelo Cancelado')
                    .setDescription(`${target.toString()} não tem ${betAmount} coins suficientes!`)
                    .setColor('Red');

                await button.editReply({ embeds: [noMoneyEmbed], components: [] });
                collector.stop();
                return;
            }

            targetAccepted = true;
            acceptCount = 2;

            // Remover coins do target
            removeCoins(target.id, betAmount);

            // Atualizar embed para mostrar que ambos aceitaram
            const waitingEmbed = new EmbedBuilder()
                .setTitle('⚔️ DUELO ACEITO')
                .setDescription('Os dois jogadores aceitaram! O duelo vai começar...')
                .setColor('Yellow')
                .addFields(
                    { name: '🥊 Desafiante', value: challenger.toString(), inline: true },
                    { name: '🎯 Alvo', value: target.toString(), inline: true },
                    { name: '💰 Aposta', value: `**${betAmount}** coins cada um`, inline: false },
                    { name: '📊 Status', value: '2/2 - Duelo começando...', inline: false }
                );

            await button.editReply({ embeds: [waitingEmbed], components: [] });

            // Aguardar um pouco antes de começar
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Começar duelo
            startDuel(response, challenger, target, betAmount);
            collector.stop();
        });

        collector.on('end', () => {
            if (!targetAccepted) {
                addCoins(challenger.id, betAmount); // Devolver coins se ninguém aceitar
            }
        });

        async function startDuel(msg, player1, player2, bet) {
            // Animação de duelo
            const vs1 = new EmbedBuilder()
                .setTitle('⚔️ DUELO')
                .setDescription(`${player1.toString()} VS ${player2.toString()}`)
                .setColor('Orange')
                .addFields(
                    { name: `❤️ ${player1.username}`, value: '███████████ 100%', inline: true },
                    { name: `❤️ ${player2.username}`, value: '███████████ 100%', inline: true }
                );

            await msg.edit({ embeds: [vs1], components: [] });
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Calcular vencedor (50/50)
            const winner = Math.random() < 0.5 ? player1 : player2;
            const loser = winner.id === player1.id ? player2 : player1;

            // Calcular prêmios
            const winnings = bet + Math.floor(bet * 0.85);

            // Creditar ao vencedor
            addCoins(winner.id, winnings);

            // Resultado final
            const resultEmbed = new EmbedBuilder()
                .setTitle('⚔️ DUELO FINALIZADO')
                .setDescription(`🎉 **${winner.toString()} VENCEU!**`)
                .setColor('Gold')
                .addFields(
                    { name: '🏆 Vencedor', value: winner.toString(), inline: true },
                    { name: '😢 Perdedor', value: loser.toString(), inline: true },
                    { name: '💰 Prêmio', value: `**${winnings}** coins`, inline: false },
                    { name: '📝 Detalhes', value: `Ganhou sua aposta (${bet}) + 85% da aposta do adversário (${Math.floor(bet * 0.85)})` }
                )
                .setThumbnail(winner.displayAvatarURL({ dynamic: true }));

            await msg.edit({ embeds: [resultEmbed], components: [] });
        }
    }
};
