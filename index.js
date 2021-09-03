const { Client, Intents, MessageEmbed } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('@discordjs/builders');
require('dotenv').config();
const admin = require('firebase-admin');

//===FIREBASE===
admin.initializeApp({
	credential: admin.credential.cert({
		"projectId": process.env.FIREBASE_PROJECT_ID,
		"private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
		"client_email": process.env.FIREBASE_CLIENT_EMAIL,
	})
});

const db = admin.firestore();


//===DISCORD_CLIENT===
var prefix = '.';
const cmds = [
	'prefix',
	'set',
	'freeze',
	'unfreeze',
	'info',
	'help'
];
const opts = [
	'name',
	'iot_username',
	'cpbo_username',
	'class'
];

const opts_map = {
	name: "name",
	iot_username: "IOT username",
	cpbo_username: "CPBO username",
	class: "class"
}

const helpMsg = 
`**All commands**
\`?prefix <character>\`: Change bot prefix to <character>
\`?info [@someone]\`: Show information about user
\`?set all|name|class|iot_username|cpbo_username\`: Set your info
\`?set [@someone] all|name|class|iot_username|cpbo_username\`: (Admin only) Set other user's info
\`?freeze @someone\`: (Admin only) Disallow \`@someone\` from changing their info
\`?unfreeze @someone\`: (Admin only) Undo the effect of the previous command
\`?help\`: Show this message`;

async function setSingleField(changeId, msg, opt) {
	var docRef = db.collection('discord_users').doc(changeId);
	const filter = m => {return m.author.id == msg.author.id};

	var msgInfo = await msg.channel.send(`Enter ${opts_map[opt]} (enter \`cancel\` to cancel):`);
	var msgPromise = msg.channel.awaitMessages({
		filter,
		max: 1,
		time: 20000,
		errors: ['time']
	}).then((collected) => {
		var info = collected.first().content;
		if(info == 'cancel') {
			collected.first().reply('Operation was cancelled!');
			throw {name: "OperationCancel", message: "Operation was cancelled!"};
		}
		var addVal = {};
		addVal[opt] = info;
		docRef.set(addVal, {merge: true}).catch(() => {
			msg.channel.send(':x: Unexpected error!');
		});
	}).catch((e) => {
		if(e.name != 'OperationCancel')
			msgInfo.reply(':x: No answer provided!');
		throw e;
	});

	return msgPromise;
}

async function setCommand(changeId, msg, opt) {
	if(!opts.includes(opt) && opt != 'all') {
		msg.channel.send(':x: Invalid option!');
		return;
	}

	var docRef = db.collection('discord_users').doc(changeId);
	var doc = await docRef.get();
	if(doc.exists) {
		if(doc.data().freeze && !msg.member.permissions.has('ADMINISTRATOR')) {
			msg.reply(':x: You\'re frozen by admin.');
			return;
		}
	}

	if(opt == 'all') {
		for(const field of opts) {
			try {
				await setSingleField(changeId, msg, field);
			} catch(e) {
				break;
			}
		}
	} else {
		setSingleField(changeId, msg, opt).then((e) => {
			msg.channel.send(':white_check_mark: Update successfully!');
		}).catch(() => {

		});
	}
}

const client = new Client({ intents: [
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MESSAGES,
] });

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity(prefix + 'help');
});

client.on('messageCreate', async (msg) => {
	if(msg.author.id == client.user.id)
		return;

	if(msg.content[0] != prefix)
		return;

	
	tokens = msg.content.split(' ');
	if(!cmds.includes(tokens[0].slice(1)))
		return;

	msg.react('👌');

	switch(tokens[0]) {
		case prefix + 'prefix':
			if(!msg.member.permissions.has("ADMINISTRATOR")) {
				msg.reply(':x: User is not admin!');
				break;
			}

			if(tokens.length != 2) {
				msg.reply(':x: Wrong syntax!');
				break;
			}

			if(tokens[1].length != 1) {
				msg.reply(':x: Prefix must be 1 character!');
				break;
			}

			prefix = tokens[1];
			client.user.setActivity(prefix + 'help');
			msg.reply(':white_check_mark: Changed prefix to ' + prefix);
			break;
		case prefix + 'set':
			if(tokens.length != 2 && tokens.length != 3) {
				msg.reply(':x: Wrong syntax!');
				break;
			}

			if(tokens.length == 3) {
				if(msg.mentions.users.size != 1) {
					msg.reply(':x: Wrong syntax!');
					break;
				}

				if(msg.mentions.users.first().id != msg.author.id) {
					if(!msg.member.permissions.has("ADMINISTRATOR")) {
						msg.reply(':x: Only admin can edit other user\'s info!');
					} else {
						setCommand(msg.mentions.users.first().id, msg, tokens[2]);
					}
				} else {
					setCommand(msg.mentions.users.first().id, msg, tokens[2]);
				}
				break;
			}
			setCommand(msg.author.id, msg, tokens[1]);
			break;
		case prefix + 'freeze':
			if(tokens.length != 2) {
				msg.reply(':x: Wrong syntax!');
				break;
			}

			if(!msg.member.permissions.has('ADMINISTRATOR')) {
				msg.reply(':x: Only admin can freeze user!');
				break;
			}

			if(msg.mentions.users.size != 1) {
				msg.reply(':x: You have to mention someone!');
				break;
			}

			db.collection('discord_users').doc(msg.mentions.users.first().id).set({freeze: true}, {merge: true}).then(() => {
				msg.channel.send(':white_check_mark: Freeze successfully!');
			}).catch(() => {
				msg.channel.send(':x: Unexpected error!');
			});
			break;
		case prefix + 'unfreeze':
			if(tokens.length != 2) {
				msg.reply(':x: Wrong syntax!');
				break;
			}

			if(!msg.member.permissions.has('ADMINISTRATOR')) {
				msg.reply(':x: Only admin can unfreeze user!');
				break;
			}

			if(msg.mentions.users.size != 1) {
				msg.reply(':x: You have to mention someone!');
				break;
			}

			db.collection('discord_users').doc(msg.mentions.users.first().id).set({freeze: false}, {merge: true}).then(() => {
				msg.channel.send(':white_check_mark: Unfreeze successfully!');
			}).catch(() => {
				msg.channel.send(':x: Unexpected error!');
			});
			break;
		case prefix + 'info':
			if(tokens.length > 2) {
				msg.reply(':x: Wrong syntax!');
				break;
			}

			if(tokens.length == 2 && msg.mentions.users.size == 0) {
				msg.reply(':x: You have to mention someone!');
				break;
			}

			var infoId;
			if(tokens.length == 1)
				infoId = msg.author.id;
			else
				infoId = msg.mentions.users.first().id;
			
			var doc = await db.collection('discord_users').doc(infoId).get();
			var data = doc.data();
			if(doc.exists && (data.name || data.iot_username || data.cpbo_username || data.class)) {
				var em = new MessageEmbed()
					.setColor('#0099ff');
				if(data.name)
					em.setTitle(data.name);
				else
					em.setTitle('Unknown');
				if(data.class)
					em.addField('Class', data.class);
				if(data.iot_username)
					em.addField('IOT username', data.iot_username);
				if(data.cpbo_username)
					em.addField('CPBO username', data.cpbo_username);
				if(data.freeze)
					em.addField('Freeze', ":white_check_mark:");
				else
					em.addField('Freeze', ":x:");

				msg.channel.send({embeds: [em]});
			} else {
				msg.reply('There is nothing to show :thinking:');
				break;
			}

			break;
		case prefix + 'help':
			msg.channel.send(helpMsg.replaceAll('?', prefix));
			break;
	}
});


client.login(process.env.BOT_TOKEN);
