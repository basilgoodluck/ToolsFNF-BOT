import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { registerCommands } from './utils/registerCommands';
import { loadCommands } from './utils/loadCommands';
import dotenv from 'dotenv';

dotenv.config();

declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, any>;
  }
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.commands = new Collection();

async function main() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Load and register commands
    const commands = await loadCommands();
    client.commands = commands;
    await registerCommands();

    // Handle interactions
    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: 'There was an error executing this command!',
          ephemeral: true
        });
      }
    });

    // Login
    await client.login(process.env.DISCORD_TOKEN);
    console.log('Bot is online!');
  } catch (error) {
    console.error('Error starting bot:', error);
    process.exit(1);
  }
}

main();