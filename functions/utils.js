const { MessageEmbed } = require('discord.js');
const { API, } = require('nhentai-api');
const api = new API();
const helpMsg = 
`**User commands**
\`?prefix <character>\`: Change bot prefix to <character>
\`?info [@someone]\`: Show information about user
\`?set all|name|class|iot_username|cpbo_username\`: Set your info
\`?set [@someone] all|name|class|iot_username|cpbo_username\`: (Admin only) Set other user's info
\`?freeze @someone\`: (Admin only) Disallow \`@someone\` from changing their info
\`?unfreeze @someone\`: (Admin only) Undo the effect of the previous command
\`?help\`: Show this message

**Quiz commands**
\`?quiz <id>\`: Show quiz
\`?add-quiz\`: Add a new quiz
\`?edit-quiz <id>\`: Edit an existing quiz
\`?quiz-stat\`: Show statistics about quiz
\`?endless-quiz\`: Play endless quiz
`;

function changePrefix(tokens, msg) {
	if(!msg.member.permissions.has("ADMINISTRATOR")) {
		msg.reply(':x: User is not admin!');
		return;
	}

	if(tokens.length != 2) {
		msg.reply(':x: Wrong syntax!');
		return;
	}

	if(tokens[1].length != 1) {
		msg.reply(':x: Prefix must be 1 character!');
		return;
	}

	msg.reply(':white_check_mark: Changed prefix to ' + tokens[1]);
	return tokens[1];
}

function sendHelp(tokens, msg, prefix) {
	msg.channel.send(helpMsg.replaceAll('?', prefix));
}

function debug(tokens, msg) {
	if(!msg.attachments.size)
		return;
	var em = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`Hêh test tí <(")`)
				.setDescription('ádfsadfasdfafd')
				.setImage(msg.attachments.first().url)
				.addField('Tags', 'ád, sdafasd, ádfasdf')
				.setFooter(`ID: 999`);

	msg.channel.send({embeds: [em]});
}

function nnn(tokens, msg) {
	if(!msg.channel.nsfw) {
		msg.channel.send("Vào nsfw mà đọc.");
		return;
	}
	if((tokens.length != 2 && tokens.length != 3) || tokens[1].length != 6) {
		msg.reply(':x: Wrong syntax!');
		return;
	}

	var id = Math.floor(Number(tokens[1]));
	if(isNaN(id)) {
		msg.channel.send(':x: Id must be an positive integer!');
		return;
	}

	api.getBook(id).then(book => {
		var em = null;

		if(tokens.length == 3) {
			var page = Math.floor(Number(tokens[2]));
			if(isNaN(page)) {
				msg.channel.send(':x: Page number must be an positive integer!');
				return;
			}
			em = new MessageEmbed()
					.setColor('#0099ff')
					.setDescription(`Page ${page}/${book.pages.length}`)
					.setTitle(book.title.english)
					.setImage(api.getImageURL(book.pages[page - 1]))
					.setFooter(`${String(id).padStart(6, '0')}/${page}`)
					.setTimestamp();
		} else {
			em = new MessageEmbed()
					.setColor('#0099ff')
					.setDescription(`${book.pages.length} pages`)
					.setTitle(book.title.english)
					.setImage(api.getImageURL(book.cover))
					.addField('Tags', book.tags.map((tag) => {return tag.name}).join(', '))
					.setFooter(`${String(id).padStart(6, '0')}/${page||0}`)
					.setTimestamp();
		}
		msg.channel.send({embeds: [em]}).then((m) => {
			m.react('⬅️');
			m.react('➡️');
		});
	}).catch((e) => {
		msg.channel.send(":x: Error!");
		return;
	});
}

function reactAdd(react, user) {
	if(user.bot)
		return;
	if(react.message.member.id != react.client.user.id)
		return;

	var message = react.message;

	if(!message.embeds || !message.embeds[0] || !message.embeds[0].footer || !message.embeds[0].footer.text)
		return;

	var footer = message.embeds[0].footer.text.split('/');
	if(footer.length != 2)
		return;

	var id = Math.floor(Number(footer[0]));
	var page = Math.floor(Number(footer[1]));


	if(react.emoji.name == '➡️')
		page = page + 1;
	if(react.emoji.name == '⬅️')
		page = page - 1;
	if(page < 1)
		return;
	api.getBook(id).then(book => {
		if(page > book.pages.length)
			return;
		var em = new MessageEmbed()
					.setColor('#0099ff')
					.setDescription(`Page ${page}/${book.pages.length}`)
					.setTitle(book.title.english)
					.setImage(api.getImageURL(book.pages[page - 1]))
					.setFooter(`${String(id).padStart(6, '0')}/${page}`)
					.setTimestamp();
		message.edit({embeds: [em]}).then((m) => {
			if(message.guild.me.permissions.has('MANAGE_MESSAGES')) {
				m.reactions.removeAll();
				m.react('⬅️');
				m.react('➡️');				
			}
 		});
	}).catch((e) => {
		message.channel.send(":x: Error!");
		return;
	});
}

module.exports = {changePrefix, sendHelp, debug, nnn, reactAdd};