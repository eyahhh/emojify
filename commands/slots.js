const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');
const { getCoins, removeCoins, addCoins } = require('../database/coins');

const symbols = ['🍎', '🍊', '🍋', '🍇', '💎', '👑', '7️⃣'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('Jogue na máquina caça-níqueis')
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
            return interaction.editReply('❌ Valor inválido!');

        if (userBalance < bet)
            return interaction.editReply('❌ Você não tem coins suficientes!');

        removeCoins(userId, bet);

        // Spin inicial
        const spinEmbed = new EmbedBuilder()
            .setTitle('🎰 SLOTS')
            .setDescription(`🔄 Girando...\n\n${symbols[Math.floor(Math.random() * symbols.length)]} | ${symbols[Math.floor(Math.random() * symbols.length)]} | ${symbols[Math.floor(Math.random() * symbols.length)]}`)
            .setColor('Yellow')
            .setFooter({ text: `Aposta: ${bet} coins` });

        const response = await interaction.editReply({ embeds: [spinEmbed] });

        // Animação
        for (let i = 0; i < 8; i++) {
            await new Promise(resolve => setTimeout(resolve, 200));
            const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
            const reel2 = symbols[Math.floor(Math.random() * symbols.length)];
            const reel3 = symbols[Math.floor(Math.random() * symbols.length)];
            
            const animEmbed = new EmbedBuilder()
                .setTitle('🎰 SLOTS')
                .setDescription(`🔄 Girando...\n\n${reel1} | ${reel2} | ${reel3}`)
                .setColor('Yellow')
                .setFooter({ text: `Aposta: ${bet} coins` });
            
            try {
                await response.edit({ embeds: [animEmbed] });
            } catch (error) {
                break;
            }
        }

        // Resultado final
        const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
        const reel2 = symbols[Math.floor(Math.random() * symbols.length)];
        const reel3 = symbols[Math.floor(Math.random() * symbols.length)];

        let winAmount = 0;
        let multiplier = 0;

        // Verificar combinações
        if (reel1 === reel2 && reel2 === reel3) {
            // 3 iguais - Jackpot!
            multiplier = 5;
            winAmount = bet * multiplier;
            addCoins(userId, winAmount);

            const jackpotEmbed = new EmbedBuilder()
                .setTitle('🎰 SLOTS')
                .setDescription(`🎉 JACKPOT!!!\n\n${reel1} | ${reel2} | ${reel3}\n\n💰 Você ganhou **${winAmount}** coins!`)
                .setColor('Gold')
                .setFooter({ text: `Aposta: ${bet} coins | Multiplicador: ${multiplier}x` });

            await response.edit({ embeds: [jackpotEmbed] });
        } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
            // 2 iguais - Vitória!
            multiplier = 2;
            winAmount = bet * multiplier;
            addCoins(userId, winAmount);

            const winEmbed = new EmbedBuilder()
                .setTitle('🎰 SLOTS')
                .setDescription(`🎊 Você venceu!\n\n${reel1} | ${reel2} | ${reel3}\n\n💰 Você ganhou **${winAmount}** coins!`)
                .setColor('Green')
                .setFooter({ text: `Aposta: ${bet} coins | Multiplicador: ${multiplier}x` });

            await response.edit({ embeds: [winEmbed] });
        } else {
            // Nenhuma combinação - Derrota
            const loseEmbed = new EmbedBuilder()
                .setTitle('🎰 SLOTS')
                .setDescription(`😢 Você perdeu!\n\n${reel1} | ${reel2} | ${reel3}\n\n💸 Perdeu **${bet}** coins`)
                .setColor('Red')
                .setFooter({ text: `Aposta: ${bet} coins` });

            await response.edit({ embeds: [loseEmbed] });
        }
    }
};
