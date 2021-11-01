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
	if((tokens.length != 2 && tokens.length != 3) || tokens[1].length != 6) {
		msg.reply(':x: Wrong syntax!');
		return;
	}

	var id = Math.floor(Number(tokens[1]));
	if(isNaN(id)) {
		msg.channel.send(':x: Id must be an positive integer!');
		return;
	}

	var book = null;
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
					.setDescription(`Page ${page}`)
					.setTitle(book.title.english)
					.setImage(api.getImageURL(book.pages[page - 1]))
					.setTimestamp();
		} else {
			em = new MessageEmbed()
					.setColor('#0099ff')
					.setDescription(`${book.pages.length} pages`)
					.setTitle(book.title.english)
					.setImage(api.getImageURL(book.cover))
					.addField('Tags', book.tags.map((tag) => {return tag.name}).join(', '))
					.setTimestamp();
		}
		msg.channel.send({embeds: [em]});
	}).catch((e) => {
		msg.channel.send(":x: Error!");
		return;
	});	
}

module.exports = {changePrefix, sendHelp, debug, nnn};