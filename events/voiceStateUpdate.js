const { Events, GuildChannelManager, Guild } = require('discord.js');

// If a User Joines a channel and the channel has only that user, create a new empty channel.
// If a User leaves a channel and the channel has no members, delete the channel.
// handleAlwaysEmptyChannel = (oldState, newState, key) => {
//     if(key !== 'channel') return;
//     if (oldState.channelId && !newState.channelId) {
//         if (oldState.channel.members.size === 0) {
//             oldState.channel.delete().catch(console.error);
//         }
//     } else if (!oldState.channelId && newState.channelId) {
//         const channel = newState.guild.channels.cache.get(newState.channelId);
//         if (channel && channel.members.size === 1) {
//                 GuildChannelManager.create({
//                     name: `🍧Chill🍧`
//                 })
//                 .catch(console.error);
//         }
//     }
// }

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const guild = newState.guild;
        const logChannel = guild.channels.cache.find(channel => channel.name === 'bot-commands-admins');
        if (!logChannel) return;

        const user = newState.member.user;
        const changes = [];

        const stateChecks = [
            { key: 'channel', joinMsg: 'joined channel', leaveMsg: 'left channel', name: true },
            { key: 'serverDeaf', joinMsg: 'was server deafened', leaveMsg: 'was server undeafened' },
            { key: 'serverMute', joinMsg: 'was server muted', leaveMsg: 'was server unmuted' },
            { key: 'selfDeaf', joinMsg: 'self-deafened', leaveMsg: 'self-undeafened' },
            { key: 'selfMute', joinMsg: 'self-muted', leaveMsg: 'self-unmuted' },
            { key: 'selfVideo', joinMsg: 'turned on video', leaveMsg: 'turned off video' },
            { key: 'streaming', joinMsg: 'started streaming', leaveMsg: 'stopped streaming' },
        ];

        stateChecks.forEach(({ key, joinMsg, leaveMsg, name }) => {
            const oldValue = oldState[key];
            const newValue = newState[key];

            if (!oldValue && newValue) {
                let message = `User **${user.tag}** ${joinMsg}`;
                if (name) message += ` **${newState[key]?.name || 'Unknown'}**.`;
                changes.push(message);
            } else if (oldValue && !newValue) {
                let message = `User **${user.tag}** ${leaveMsg}`;
                if (name) message += ` **${oldState[key]?.name || 'Unknown'}**.`;
                changes.push(message);
            }
        });

        if (changes.length > 0) {
            logChannel.send(changes.join('\n'));
        }
    },
};
