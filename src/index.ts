import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { registerCommands } from './utils/registerCommands.js';
import { loadCommands } from './utils/loadCommands.js';
import dotenv from 'dotenv';
import { TokenAnalyzer } from './services/tokenAnalyzer.js';

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
    
    const commands = await loadCommands();
    client.commands = commands;
    await registerCommands();

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
    console.log('Discord Token:', process.env.DISCORD_TOKEN);

    await client.login(process.env.DISCORD_TOKEN);
    console.log('Bot is online!');
  } catch (error) {
    console.error('Error starting bot:', error);
    process.exit(1);
  }
}
const tokenAnalyzer = new TokenAnalyzer(process.env.RPC_URL!)
const analysis = await tokenAnalyzer.analyzePnL("3dunE8UUExhFuXejqyYv6NUCiq2WQ25A21XrDFHNpNfU", "So11111111111111111111111111111111111111112");
console.log(analysis)

main();