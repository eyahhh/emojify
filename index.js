require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const loadCommands = require("./functions/handler");
const fs = require("fs");
const path = require("path");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// Carrega todos os comandos da pasta /commands
loadCommands(client);

// 📌 CARREGA EVENTOS
const eventsPath = path.join(__dirname, "events");
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));
    
    for (const file of eventFiles) {
        const event = require(path.join(eventsPath, file));
        
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
    
    console.log(`✔️ ${eventFiles.length} evento(s) carregado(s)!`);
}

client.once("clientReady", () => {
    console.log(`🤖 Bot conectado como ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command)
        return interaction.reply({ content: "❌ Comando não encontrado!", flags: 64 });

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('❌ Erro ao executar comando:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                content: "⚠️ Ocorreu um erro ao executar o comando!", 
                flags: 64
            }).catch(console.error);
        } else if (interaction.deferred) {
            await interaction.editReply({ 
                content: "⚠️ Ocorreu um erro ao executar o comando!" 
            }).catch(console.error);
        } else {
            await interaction.followUp({ 
                content: "⚠️ Ocorreu um erro ao executar o comando!", 
                flags: 64
            }).catch(console.error);
        }
    }
});

client.login(process.env.TOKEN);