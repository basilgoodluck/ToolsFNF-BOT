import { Collection } from 'discord.js';
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadCommands(): Promise<Collection<string, any>> {
  const commands = new Collection<string, any>();
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const fileUrl = `file://${filePath.replace(/\\/g, '/')}`; 
    const command = await import(fileUrl);

    if ('data' in command && 'execute' in command) {
      commands.set(command.data.name, command);
    }
  }

  return commands;
}