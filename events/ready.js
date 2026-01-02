const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getAllGiveaways, updateGiveaway, pickWinners, deleteGiveaway } = require("../functions/giveaways");
const { addCoins } = require("../database/coins");
const { applyInterest, chargeLoan, getAllUsers, removeBalance } = require("../database/bank");

module.exports = {
    name: "clientReady",
    once: true,
    async execute(client) {
        console.log("📡 Monitorando sorteios...");

        // Verifica sorteios a cada 10 segundos
        setInterval(async () => {
            const giveaways = getAllGiveaways();
            const now = Date.now();

            for (const giveaway of giveaways) {
                // Pula se já foi finalizado
                if (giveaway.ended) continue;

                // Verifica se o tempo acabou
                if (giveaway.endTime <= now) {
                    await endGiveaway(client, giveaway);
                }
            }
        }, 10000); // 10 segundos

        // Sistema de juros no banco - a cada 1 hora
        console.log("💰 Sistema de juros e empréstimos ativado!");
        setInterval(async () => {
            const allUsers = getAllUsers();
            
            for (const userId in allUsers) {
                // Aplica juros
                const interest = applyInterest(userId);
                if (interest.applied) {
                    console.log(`💸 ${userId} ganhou ${interest.interest} 💰 de juros!`);
                }

                // Cobra empréstimos vencidos
                const chargeResult = chargeLoan(userId);
                if (chargeResult.charged) {
                    console.log(`⚠️ ${userId} foi cobrado ${chargeResult.penalty} 💰 por atraso no empréstimo!`);
                }
            }
        }, 60 * 60 * 1000); // 1 hora
    }
};

async function endGiveaway(client, giveaway) {
    try {
        const guild = client.guilds.cache.get(giveaway.guildId);
        if (!guild) return;

        const channel = guild.channels.cache.get(giveaway.channelId);
        if (!channel) return;

        const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
        if (!message) return;

        // Seleciona os ganhadores
        const winners = pickWinners(giveaway);

        // Atualiza o embed
        const endEmbed = new EmbedBuilder()
            .setTitle("🎉 SORTEIO ENCERRADO! 🎉")
            .setDescription(`🎁 **${giveaway.prize}**`)
            .setColor("Red")
            .setTimestamp();

        if (winners.length === 0) {
            endEmbed.addFields({
                name: "😢 Sem ganhadores",
                value: "Ninguém participou do sorteio!"
            });
        } else {
            const winnersMention = winners.map(id => `<@${id}>`).join(", ");
            endEmbed.addFields({
                name: `🏆 Ganhador${winners.length > 1 ? 'es' : ''}:`,
                value: winnersMention
            });

            // Se o prêmio for coins, adiciona para os ganhadores
            const coinMatch = giveaway.prize.match(/(\d+)\s*c(?:oins?)?/i);
            if (coinMatch) {
                const coinAmount = parseInt(coinMatch[1]);
                
                for (const winnerId of winners) {
                    try {
                        await addCoins(winnerId, coinAmount);
                    } catch (error) {
                        console.error(`Erro ao adicionar coins para ${winnerId}:`, error);
                    }
                }

                endEmbed.setFooter({ 
                    text: `${coinAmount} coins adicionados automaticamente para ${winners.length > 1 ? 'os ganhadores' : 'o ganhador'}!` 
                });
            }
        }

        endEmbed.addFields(
            { name: "👥 Total de Participantes:", value: `${giveaway.participants.length}`, inline: true },
            { name: "📛 ID:", value: `\`${giveaway.id}\``, inline: true }
        );

        // Desabilita os botões
        const disabledRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`join_${giveaway.id}`)
                    .setLabel("🎟️ Participar")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId(`participants_${giveaway.id}`)
                    .setLabel("👥 Participantes")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );

        await message.edit({ embeds: [endEmbed], components: [disabledRow] });

        // Anuncia os ganhadores
        if (winners.length > 0) {
            const winnersMention = winners.map(id => `<@${id}>`).join(", ");
            await channel.send({
                content: `🎊 **PARABÉNS!** ${winnersMention}\n\nVocê${winners.length > 1 ? 's' : ''} ganhou${winners.length > 1 ? 'aram' : ''}: **${giveaway.prize}**! 🎉`
            });
        }

        // Marca como finalizado e deleta do arquivo
        giveaway.ended = true;
        giveaway.winners = winners;
        deleteGiveaway(giveaway.id);

        console.log(`✅ Sorteio ${giveaway.id} finalizado e removido!`);
    } catch (error) {
        console.error(`❌ Erro ao finalizar sorteio ${giveaway.id}:`, error);
    }
}