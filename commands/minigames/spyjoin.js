const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const activeGames = require('./spycreate').activeGames;
const categoriesPath = path.join(__dirname, 'categories.json');
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('joinspy')
        .setDescription('Join an active Spy game in this channel'),
    async execute(interaction) {
        const channelId = interaction.channel.id;
        const userId = interaction.user.id;
        const game = activeGames.get(channelId);

        if (!game || game.status !== 'waiting') {
            await interaction.reply({ content: 'No joinable game found in this channel.', flags: MessageFlags.Ephemeral });
            return;
        }
        if (game.players.includes(userId)) {
            await interaction.reply({ content: 'You have already joined the game.', flags: MessageFlags.Ephemeral });
            return;
        }
        if (game.players.length >= game.playersNeeded) {
            await interaction.reply({ content: 'The game is already full.', flags: MessageFlags.Ephemeral });
            return;
        }

        game.players.push(userId);

        await interaction.reply({ content: `<@${userId}> joined the game! (${game.players.length}/${game.playersNeeded})` });

        if (game.players.length === game.playersNeeded) {
            game.status = 'started';
            const words = categories[game.category];
            const word = words[Math.floor(Math.random() * words.length)];
            const oddIndex = Math.floor(Math.random() * game.players.length);

            for (let i = 0; i < game.players.length; i++) {
                const user = await interaction.client.users.fetch(game.players[i]);
                if (i === oddIndex) {
                    await user.send('You are the odd one out!');
                } else {
                    await user.send(`Your word is: **${word}**`);
                }
            }

            await interaction.followUp({ content: 'DMs have been sent to all players. Discuss and find the odd one out!', });
            activeGames.delete(channelId);
        }
    }
};