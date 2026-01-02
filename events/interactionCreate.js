const { getGiveaway, updateGiveaway, pickWinners } = require('../functions/giveaways');
const { addCoins } = require('../database/coins');
const botconfigHandler = require('../functions/botconfigHandler');

module.exports = {
    name: "interactionCreate",
    async execute(interaction) {
        // Handle botconfig modals
        if (interaction.isModalSubmit() && interaction.customId.startsWith("botconfig_modal_")) {
            return botconfigHandler.handleBotconfigModal(interaction);
        }

        if (!interaction.isButton()) return;

        const parts = interaction.customId.split("_");
        const action = parts[0];
        
        // Handle botconfig buttons (sem defer, pois usam showModal)
        if (action === "botconfig") {
            return botconfigHandler.handleBotconfigButton(interaction);
        }

        // Ignore outros tipos de botões que não são sorteios
        if (!["join", "participants", "end"].includes(action)) {
            return;
        }

        // Defer imediatamente para ganhar mais tempo de resposta (para outros botões)
        await interaction.deferReply({ flags: 64 });

        const id = parts.slice(1).join("_"); // Junta todas as partes após o action com "_"
        const giveaway = getGiveaway(id);

        if (!giveaway) {
            return interaction.editReply({ content: "❌ Sorteio não encontrado!" });
        }

        const userId = interaction.user.id;

        // 📌 Participar:
        if (action === "join") {
            if (giveaway.participants.includes(userId)) {
                return interaction.editReply({ content: "❌ Você já está participando!" });
            }

            // Se houver cargo obrigatório
            if (giveaway.role) {
                const hasRole = interaction.member.roles.cache.has(giveaway.role);
                if (!hasRole)
                    return interaction.editReply({ content: "❌ Você não tem o cargo necessário!" });
            }

            // Se houver limite
            if (giveaway.maxParticipants && giveaway.participants.length >= giveaway.maxParticipants) {
                return interaction.editReply({ content: "❌ Limite de participantes atingido!" });
            }

            giveaway.participants.push(userId);
            updateGiveaway(giveaway);

            return interaction.editReply({ content: "🎉 Você entrou no sorteio!" });
        }

        // 📌 Ver participantes:
        if (action === "participants") {
            const list = giveaway.participants.map(id => `<@${id}>`).join("\n") || "Nenhum participante ainda";
            return interaction.editReply({ content: `👥 Participantes:\n${list}` });
        }

        // 📌 Finalizar
        if (action === "end") {
            if (interaction.user.id !== giveaway.host)
                return interaction.editReply({ content: "❌ Apenas quem criou pode finalizar!" });

            const winners = pickWinners(giveaway);
            const channel = interaction.channel;

            if (winners.length === 0) {
                return channel.send("😢 Ninguém participou do sorteio!");
            }

            let prizeText = giveaway.prizeCoins
                ? `💰 Prêmio: **${giveaway.prizeCoins} coins**`
                : `🏆 Prêmio: **${giveaway.prize}**`;

            const mentions = winners.map(id => `<@${id}>`).join(", ");

            channel.send(`🎉 **SORTEIO ENCERRADO!**\n👑 Ganhadores: ${mentions}\n${prizeText}`);

            // 📌 Recompensa via coins
            if (giveaway.prizeCoins) {
                winners.forEach(id => addCoins(id, giveaway.prizeCoins));
            }

            giveaway.finished = true;
            updateGiveaway(giveaway);

            interaction.editReply({ content: "✔ Sorteio finalizado!" });
        }
    },
};
