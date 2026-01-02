const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleta')
        .setDescription('Escolha aleatoriamente entre usuários')
        .addUserOption(option =>
            option
                .setName('usuario1')
                .setDescription('Primeiro usuário')
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName('usuario2')
                .setDescription('Segundo usuário')
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName('usuario3')
                .setDescription('Terceiro usuário')
                .setRequired(false)
        )
        .addUserOption(option =>
            option
                .setName('usuario4')
                .setDescription('Quarto usuário')
                .setRequired(false)
        )
        .addUserOption(option =>
            option
                .setName('usuario5')
                .setDescription('Quinto usuário')
                .setRequired(false)
        )
        .addUserOption(option =>
            option
                .setName('usuario6')
                .setDescription('Sexto usuário')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option
                .setName('vencedores')
                .setDescription('Quantos vencedores escolher?')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(6)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const usuarios = [];
        let numeroVencedores = interaction.options.getInteger('vencedores') || 1;

        for (let i = 1; i <= 6; i++) {
            const user = interaction.options.getUser(`usuario${i}`);
            if (user && !usuarios.find(u => u.id === user.id)) {
                usuarios.push(user);
            }
        }

        if (usuarios.length < 2) {
            return interaction.editReply('❌ Você precisa de pelo menos 2 usuários diferentes!');
        }

        if (usuarios.length > 6) {
            return interaction.editReply('❌ Você pode escolher no máximo 6 usuários!');
        }

        if (numeroVencedores > usuarios.length) {
            return interaction.editReply(`❌ Você não pode escolher ${numeroVencedores} vencedores com apenas ${usuarios.length} usuários!`);
        }

        // Animação da roleta
        let currentIndex = 0;
        const animationEmbed = new EmbedBuilder()
            .setTitle('🎡 ROLETA')
            .setColor('Yellow')
            .setDescription('🔄 Girando a roleta...');

        const response = await interaction.editReply({ embeds: [animationEmbed] });

        // Animar a roleta
        for (let i = 0; i < 15; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const displayEmbed = new EmbedBuilder()
                .setTitle('🎡 ROLETA')
                .setColor('Yellow')
                .setDescription(`🔄 ${usuarios[currentIndex % usuarios.length].toString()}`);
            
            try {
                await response.edit({ embeds: [displayEmbed] });
            } catch (error) {
                break;
            }

            currentIndex++;
        }

        // Selecionar vencedores sem repetição
        const vencedores = [];
        const shuffled = [...usuarios].sort(() => Math.random() - 0.5);
        for (let i = 0; i < numeroVencedores; i++) {
            vencedores.push(shuffled[i]);
        }

        // Resultado final
        let descricao = '';
        if (numeroVencedores === 1) {
            descricao = `🎉 **VENCEDOR:**\n${vencedores[0].toString()}`;
        } else {
            descricao = `🎉 **VENCEDORES (${numeroVencedores}):**\n`;
            vencedores.forEach((v, index) => {
                descricao += `${index + 1}. ${v.toString()}\n`;
            });
        }

        const resultEmbed = new EmbedBuilder()
            .setTitle('🎡 ROLETA')
            .setDescription(descricao)
            .setColor('Green')
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

        await response.edit({ embeds: [resultEmbed] });
    }
};
