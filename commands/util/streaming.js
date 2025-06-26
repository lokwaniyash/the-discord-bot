const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { Octokit } = require('@octokit/rest');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('streaming')
		.setDescription('Replies with streaming sites from the FMHY repository')
		.addStringOption(option =>
			option.setName('type')
				.setDescription('Type of streaming sites')
				.setRequired(true)
				.addChoices(
					{ name: 'Movies/TV', value: 'movie' },
					{ name: 'Anime', value: 'anime' }
				)
		),
	async execute(interaction) {
		const octokit = new Octokit();
		const owner = 'fmhy';
		const repo = 'edit';
		const path = 'docs/videopiracyguide.md';
		const branch = 'main';

		const { data } = await octokit.repos.getContent({
			owner,
			repo,
			path,
			ref: branch,
		});

		const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
		const lines = fileContent.split('\n');
		const type = interaction.options.getString('type');
		const sectionHeader = type === 'anime' ? '## ▷ Anime Streaming' : '# ► Streaming Sites';
		let inSection = false;
		const allSites = [];

		const parseLine = (line) => {
			const mainMatch = line.match(/\*\s*(?:⭐\s*)?\*\*?\[([^\]]+)\]\(([^)]+)\)\*?\*/)
				|| line.match(/^\*\s*\[([^\]]+)\]\(([^)]+)\)/)
				|| line.match(/^\[([^\]]+)\]\(([^)]+)\)/);
			if (!mainMatch) return null;
			const mainName = mainMatch[1];
			const mainUrl = mainMatch[2];
			const alternatives = [];
			const altMatches = [...line.matchAll(/\[(\d+)\]\(([^)]+)\)/g)];
			for (let i = 0; i < altMatches.length; i++) {
				alternatives.push(`[Alternative ${altMatches[i][1] - 1}](<${altMatches[i][2]}>)`);
			}
			const allLinks = [
				`[${mainName}](<${mainUrl}>)`,
				...alternatives
			];
			return allLinks.join(', ');
		};

		for (const line of lines) {
			if (line.trim().startsWith(sectionHeader)) {
				inSection = true;
				continue;
			}
			if (inSection && line.trim().startsWith('#') && !line.trim().startsWith(sectionHeader)) {
				break;
			}
			if (inSection) {
				const parsed = parseLine(line);
				if (parsed) allSites.push(parsed);
			}
		}

		const pageSize = 10;
		let page = 0;
		const maxPage = Math.ceil(allSites.length / pageSize);

		const getPageContent = (page) => {
			const start = page * pageSize;
			const end = start + pageSize;
			return allSites.slice(start, end).join('\n') || 'No sites found.';
		};

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('prev')
					.setLabel('Previous')
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true),
				new ButtonBuilder()
					.setCustomId('next')
					.setLabel('Next')
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(allSites.length <= pageSize)
			);

		const title = type === 'anime'
			? 'Anime Streaming Sites'
			: 'Movie/TV Streaming Sites';

		await interaction.reply({
			content: `${title} (from [FMHY](<https://fmhy.net>)):\n${getPageContent(page)}`,
			components: [row],
			flags: MessageFlags.Ephemeral
		});
		const reply = await interaction.fetchReply();

		const filter = i => i.user.id === interaction.user.id && (i.customId === 'prev' || i.customId === 'next');
		const collector = reply.createMessageComponentCollector({ filter, time: 120000 });

		collector.on('collect', async i => {
			if (i.customId === 'prev') page--;
			if (i.customId === 'next') page++;
			await i.update({
				content: `${title} (from [FMHY](<https://fmhy.net>)):\n${getPageContent(page)}`,
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setCustomId('prev')
							.setLabel('Previous')
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(page === 0),
						new ButtonBuilder()
							.setCustomId('next')
							.setLabel('Next')
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(page >= maxPage - 1)
					)
				]
			});
		});
	},
};
