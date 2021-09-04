const { MessageEmbed } = require('discord.js');
const admin = require('firebase-admin');
const db = admin.firestore();

//===EDIT_INFO===
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
				return;
			}
		}
		msg.channel.send(':white_check_mark: Update successfully!');
	} else {
		setSingleField(changeId, msg, opt).then((e) => {
			msg.channel.send(':white_check_mark: Update successfully!');
		}).catch(() => {

		});
	}
}

function set(tokens, msg) {
	if(tokens.length != 2 && tokens.length != 3) {
		msg.reply(':x: Wrong syntax!');
		return;
	}

	if(tokens.length == 3) {
		if(msg.mentions.users.size != 1) {
			msg.reply(':x: Wrong syntax!');
			return;
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
		return;
	}
	setCommand(msg.author.id, msg, tokens[1]);
}

function freeze(tokens, msg) {
	if(tokens.length != 2) {
		msg.reply(':x: Wrong syntax!');
		return;
	}

	if(!msg.member.permissions.has('ADMINISTRATOR')) {
		msg.reply(':x: Only admin can freeze user!');
		return;
	}

	if(msg.mentions.users.size != 1) {
		msg.reply(':x: You have to mention someone!');
		return;
	}

	db.collection('discord_users').doc(msg.mentions.users.first().id).set({freeze: true}, {merge: true}).then(() => {
		msg.channel.send(':white_check_mark: Freeze successfully!');
	}).catch(() => {
		msg.channel.send(':x: Unexpected error!');
	});
}

function unfreeze(tokens, msg) {
	if(tokens.length != 2) {
		msg.reply(':x: Wrong syntax!');
		return;
	}

	if(!msg.member.permissions.has('ADMINISTRATOR')) {
		msg.reply(':x: Only admin can unfreeze user!');
		return;
	}

	if(msg.mentions.users.size != 1) {
		msg.reply(':x: You have to mention someone!');
		return;
	}

	db.collection('discord_users').doc(msg.mentions.users.first().id).set({freeze: false}, {merge: true}).then(() => {
		msg.channel.send(':white_check_mark: Unfreeze successfully!');
	}).catch(() => {
		msg.channel.send(':x: Unexpected error!');
	});
}

async function getInfo(tokens, msg) {
	if(tokens.length > 2) {
		msg.reply(':x: Wrong syntax!');
		return;
	}

	if(tokens.length == 2 && msg.mentions.users.size == 0) {
		msg.reply(':x: You have to mention someone!');
		return;
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
	}
}


module.exports = {set, freeze, unfreeze, getInfo};