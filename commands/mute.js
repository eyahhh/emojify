const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

function parseTime(input) {
    const timeRegex = /(\d+)\s*(s|m|h|d|segundo|segundos|minuto|minutos|hora|horas|dia|dias)/i;
    const match = input.match(timeRegex);
    if (!match) return null;

    let value = parseInt(match[1]);
    let unit = match[2].toLowerCase();

    if (unit.startsWith("s")) return value * 1000; // segundos
    if (unit.startsWith("m")) return value * 60000; // minutos
    if (unit.startsWith("h")) return value * 3600000; // horas
    if (unit.startsWith("d")) return value * 86400000; // dias

    return null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mute")
        .setDescription("Muta um membro do servidor por um tempo")
        .addUserOption(option =>
            option.setName("usuário")
                .setDescription("Quem você quer mutar?")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("tempo")
                .setDescription("Ex: 10m | 1h | 30s | 2 dias")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("motivo")
                .setDescription("Motivo do mute")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });
        
        const member = interaction.options.getMember("usuário");
        const timeInput = interaction.options.getString("tempo");
        const motivo = interaction.options.getString("motivo") || "Sem motivo";

        if (!member.moderatable)
            return interaction.editReply({ content: "❌ Não posso mutar esse usuário!" });

        const duration = parseTime(timeInput);
        if (!duration || duration < 1000)
            return interaction.editReply({ content: "❌ Tempo inválido! Exemplo: `10m`, `1h`, `30s`" });

        await member.timeout(duration, motivo);

        return interaction.editReply(`🔇 ${member.user.tag} foi mutado!\n⏱ Tempo: **${timeInput}**\n📌 Motivo: ${motivo}`);
    }
};
