const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
} = require("discord.js");
const {
    createGiveaway,
    updateGiveaway,
    getGiveaway,
    pickWinners,
} = require("../functions/giveaways");
const { addCoins } = require("../database/coins");
const ms = require("ms");
require("dotenv").config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sorteio")
        .setDescription("🎉 Cria um sorteio!")
        .addStringOption(option =>
            option.setName("tempo")
                .setDescription("Ex: 1h | 2d | 30m | 28/12/2035 4:30")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("prêmio")
                .setDescription("Ex: 5000c ou 'Sorteio de jogar comigo'")
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName("cargo")
                .setDescription("Cargo necessário para participar (opcional)")
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName("ganhadores")
                .setDescription("Número de ganhadores (padrão: 1)")
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName("participantes")
                .setDescription("Máximo de participantes (opcional)")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {

        await interaction.deferReply({ flags: 64 }); // EPHEMERAL

        const tempo = interaction.options.getString("tempo");
        const prizeInput = interaction.options.getString("prêmio") || "Sem prêmio definido";
        const roleReq = interaction.options.getRole("cargo") || null;
        const winnerCount = interaction.options.getInteger("ganhadores") || 1;
        const maxParticipants = interaction.options.getInteger("participantes") || null;

        const user = interaction.user;

        // Verificar se é owner quando o prêmio tem coins
        const coinMatch = prizeInput.match(/(\d+)\s*c(?:oins?)?/i);
        if (coinMatch && user.id !== process.env.OWNER_ID) {
            return interaction.editReply("❌ Apenas o owner pode criar sorteios com prêmio de coins!");
        }

        const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        let duration;

        if (tempo.includes("/") || tempo.includes(":")) {
            const date = new Date(tempo);
            if (isNaN(date.getTime())) return interaction.editReply("❌ Data inválida!");
            duration = date.getTime() - Date.now();
        } else {
            duration = ms(tempo);
        }

        if (!duration || duration < 5000)
            return interaction.editReply("❌ Tempo inválido ou muito curto!");

        const endTime = Date.now() + duration;

        const giveaway = {
            id,
            guildId: interaction.guild.id,
            channelId: interaction.channel.id,
            messageId: null,
            prize: prizeInput,
            roleRequired: roleReq ? roleReq.id : null,
            maxParticipants,
            winnerCount,
            endTime,
            participants: []
        };

        const embed = new EmbedBuilder()
            .setTitle("🎉 SORTEIO!!! 🎉")
            .setDescription(`🎁 **${prizeInput}**\nClique no botão abaixo para participar!`)
            .addFields(
                { name: "⏱️ Termina em:", value: `<t:${Math.floor(endTime / 1000)}:R>` },
                { name: "🏆 Ganhadores:", value: `${winnerCount}`, inline: true },
                { name: "👥 Participantes:", value: `0${maxParticipants ? `/${maxParticipants}` : ''}`, inline: true },
                { name: "📛 ID:", value: `\`${id}\``, inline: true },
            )
    .setColor("Yellow")
    .setFooter({ text: `Criado por: ${user.tag}` });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`join_${id}`)
                    .setLabel("🎟️ Participar")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`participants_${id}`)
                    .setLabel("👥 Participantes")
                    .setStyle(ButtonStyle.Secondary)
            );

        // Envia apenas o aviso do comando em EPHEMERAL
        await interaction.editReply(`🎉 Sorteio criado com sucesso!\n🆔 ID: \`${id}\``);

        // Manda o sorteio no chat
        const msg = await interaction.channel.send({ embeds: [embed], components: [row] });
        giveaway.messageId = msg.id;
        createGiveaway(giveaway);
    }
};
