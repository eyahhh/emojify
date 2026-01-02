const { SlashCommandBuilder } = require("discord.js");
const { ensureUser, addCoins } = require("../database/coins");
const fs = require("fs");
const path = require("path");

const cooldownPath = path.join(__dirname, "../database/dailyCooldown.json");

// Se o arquivo não existir, cria um novo
if (!fs.existsSync(cooldownPath)) {
    fs.writeFileSync(cooldownPath, JSON.stringify({}, null, 4));
}

function loadCooldowns() {
    return JSON.parse(fs.readFileSync(cooldownPath, "utf8"));
}

function saveCooldowns(data) {
    fs.writeFileSync(cooldownPath, JSON.stringify(data, null, 4));
}

const DAILY_REWARD = 1500;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("daily")
        .setDescription("Receba seus coins diários!"),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const userId = interaction.user.id;

        ensureUser(userId);
        const cooldowns = loadCooldowns();

        const currentTime = Date.now();
        const cooldownTime = 24 * 60 * 60 * 1000; // 24 horas

        // Verifica se está no cooldown
        if (cooldowns[userId] && currentTime - cooldowns[userId] < cooldownTime) {
            const timeLeft = cooldownTime - (currentTime - cooldowns[userId]);
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

            return interaction.editReply({
                content: `⏳ Você já coletou seu daily!\nVolte em **${hours}h ${minutes}min**`
            });
        }

        // Adiciona coins
        const novoSaldo = addCoins(userId, DAILY_REWARD);

        // Registra cooldown
        cooldowns[userId] = currentTime;
        saveCooldowns(cooldowns);

        interaction.editReply(`🎉 Você recebeu **${DAILY_REWARD}** coins!\n💰 Novo saldo: **${novoSaldo}** coins`);
    }
};
