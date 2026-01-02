const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("nuke")
        .setDescription("💣 Deleta e recria o canal atual (com mesmas configurações)")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const canal = interaction.channel;
        const canalNome = canal.name;
        const canalCategoria = canal.parentId;
        const canalPosicao = canal.position;
        const canalPermissoes = canal.permissionOverwrites.cache;
        const canalTipo = canal.type;

        try {
            // Cria o novo canal com as mesmas configurações
            const novoCanalData = {
                name: canalNome,
                type: canalTipo,
                parent: canalCategoria,
                position: canalPosicao,
                permissionOverwrites: Array.from(canalPermissoes.values())
            };

            const novoCanal = await interaction.guild.channels.create(novoCanalData);

            // Envia mensagem de destruição no novo canal
            await novoCanal.send("nuked channel succesfully");

            // Deleta o canal antigo
            await canal.delete();

            // Responde ao usuário (usando o novo canal)
            await novoCanal.send({
                content: `Nuked by ${interaction.user}!`
            });

            console.log(`✅ Canal ${canalNome} foi nukado!`);
        } catch (error) {
            console.error("Erro ao fazer nuke do canal:", error);
            return interaction.editReply({
                content: "❌ Erro ao fazer nuke do canal. Verifique as permissões."
            });
        }
    }
};
