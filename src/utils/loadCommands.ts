import { Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';

export async function loadCommands(): Promise<Collection<string, any>> {
  const commands = new Collection<string, any>();
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      commands.set(command.data.name, command);
    }
  }

  return commands;
}