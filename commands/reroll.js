const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getGiveaway, pickWinners } = require("../functions/giveaways");
const { addCoins } = require("../database/coins");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reroll")
        .setDescription("🔁 Sorteia novamente com o mesmo ID")
        .addStringOption(option =>
            option.setName("id")
                .setDescription("ID do sorteio")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {

        await interaction.deferReply({ flags: 64 });

        const id = interaction.options.getString("id");
        const giveaway = getGiveaway(id);

        if (!giveaway)
            return interaction.editReply("❌ ID inválido!");

        const winners = pickWinners(giveaway);

        if (!winners.length)
            return interaction.editReply("❌ Ninguém participou!");

        let msg = `🎉 **NOVOS GANHADORES do sorteio \`${id}\`:**\n`;

        for (const w of winners) {
            msg += `<@${w}> 🏆\n`;

            if (giveaway.prize.endsWith("c")) {
                const coins = parseInt(giveaway.prize);
                await addCoins(w, coins);
                msg += `💰 +${coins} coins adicionados!\n`;
            }
        }

        interaction.editReply(msg);
    }
};
