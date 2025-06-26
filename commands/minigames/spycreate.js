const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const activeGames = new Map();
const categoriesPath = path.join(__dirname, 'categories.json');
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spy')
        .setDescription('Start a Spy game (Odd One Out)')
        .addIntegerOption(option =>
            option.setName('players')
                .setDescription('Number of players')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Category')
                .setRequired(true)
                .addChoices(
                    ...Object.keys(categories).map(cat => ({ name: cat, value: cat }))
                )
        ),
    async execute(interaction) {
        const playersNeeded = interaction.options.getInteger('players');
        const category = interaction.options.getString('category');
        const channelId = interaction.channel.id;

        if (activeGames.has(channelId)) {
            await interaction.reply({ content: 'A game is already running in this channel.', flags: MessageFlags.Ephemeral });
            return;
        }

        const game = {
            host: interaction.user.id,
            playersNeeded,
            category,
            players: [interaction.user.id],
            status: 'waiting'
        };
        activeGames.set(channelId, game);

        await interaction.reply({
            content: `Spy game started! Category: **${category}**\nPlayers needed: **${playersNeeded}**\nType \`/joinspy\` to join the game.`
        });
    },
    activeGames
};