import { SlashCommandBuilder, EmbedBuilder, CommandInteraction, TextChannel, Message } from 'discord.js';
import { TokenAnalyzer } from '@/services/tokenAnalyzer.js';

export const data = new SlashCommandBuilder()
    .setName('pnl')
    .setDescription('Get PnL analysis for your token');

export async function execute(interaction: CommandInteraction) {
    try {
        const channel = interaction.channel as TextChannel;
        if (!channel) {
            return await interaction.reply({ content: "This command must be used in the server channel", flags: 64 });
        }

        await interaction.reply({ content: 'Please enter your wallet address:', flags: 64 });

        const filter = (msg: Message) => msg.author.id === interaction.user.id;
        const collector = channel.createMessageCollector({ filter, time: 30000, max: 1 });

        collector.on('collect', async (message) => {
            console.log('Wallet address collected:', message.content);
            const walletAddress = message.content.trim();
             
            if (!walletAddress) {
                return await message.reply('Please provide a valid wallet address.');
            }
            console.log("wallet address:", walletAddress);

            await message.reply('Now enter the contract address for your token:');
            
            const contractCollector = channel.createMessageCollector({ filter, time: 30000, max: 1 });

            contractCollector.on('collect', async (msg) => {
                console.log('Contract address collected:', msg.content);
                const contractAddress = msg.content.trim();
                
                if (!contractAddress) {
                    return await msg.reply('Please provide a valid contract address.');
                }

                const tokenAnalyzer = new TokenAnalyzer(process.env.RPC_URL!);

                await msg.reply('Fetching PnL data... Please wait.');

                console.log("Wallet Address:", walletAddress);
                console.log("Contract Address:", contractAddress);

                const analysis = await tokenAnalyzer.analyzePnL(walletAddress, contractAddress);

                const embed = new EmbedBuilder()
                    .setTitle(`PnL Analysis for ${analysis.tokenName}`)
                    .setColor(analysis.profitSol > 0 ? '#00ff00' : '#ff0000')
                    .addFields([
                        { name: 'Total Spent', value: `${analysis.totalSpent.toFixed(4)} SOL`, inline: true },
                        { name: 'Total Fees', value: `${analysis.totalFees.toFixed(4)} SOL`, inline: true },
                        { name: 'Total Sales', value: `${analysis.totalSales.toFixed(4)} SOL`, inline: true },
                        { name: 'Profit (SOL)', value: `${analysis.profitSol.toFixed(4)} SOL`, inline: true },
                        { name: 'Profit (USD)', value: `$${analysis.profitUsd.toFixed(2)}`, inline: true },
                        { name: 'ROI', value: `${analysis.roi.toFixed(2)}%`, inline: true }
                    ])
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Solana PnL Bot' });

                await msg.reply({ embeds: [embed] });
            });

            contractCollector.on('end', (_, reason) => {
                if (reason === 'time') {
                    message.reply('You took too long to respond. Please run `/pnl` again.');
                }
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') {
                interaction.followUp({ content: 'You took too long to respond. Please run `/pnl` again.', flags: 64 });
            }
        });

    } catch (error) {
        console.error('Error in PnL command:', error);
        await interaction.reply({
            content: 'There was an error processing your request. Please check the provided addresses and try again.',
            ephemeral: true 
        });
    }
}