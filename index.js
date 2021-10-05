const { Client, Intents, MessageEmbed } = require('discord.js');
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

//===DISCORD_FUNCTIONS===
const info = require('./functions/info.js');
const utils = require('./functions/utils.js');
const quiz = require('./functions/quiz.js');

//===DISCORD_CLIENT===
var prefix = '.';
const cmds = [
	'prefix',
	'set',
	'freeze',
	'unfreeze',
	'info',
	'help',
	'quiz',
	'edit-quiz',
	'endless-quiz', 'xào-đề',
	'add-quiz',
	'quiz-stat',
	'<(")'
];

const client = new Client({ intents: [
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MESSAGES,
] });

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity(prefix + 'help');
});

client.on('messageCreate', async (msg) => {
	if(msg.author.bot)
		return;

	if(msg.content[0] != prefix)
		return;

	
	var tokens = msg.content.split(' ');
	if(!cmds.includes(tokens[0].slice(1)))
		return;

	msg.react('<:pepeOK:883707335615340544>');

	switch(tokens[0]) {
		case prefix + 'prefix':
			prefix = utils.changePrefix(tokens, msg);
			client.user.setActivity(prefix + 'help');
			break;
		case prefix + 'set':
			info.set(tokens, msg);
			break;
		case prefix + 'freeze':
			info.freeze(tokens, msg);
			break;
		case prefix + 'unfreeze':
			info.unfreeze(tokens, msg);
			break;
		case prefix + 'info':
			info.getInfo(tokens, msg);
			break;
		case prefix + 'help':
			utils.sendHelp(tokens, msg, prefix);
			break;
		case prefix + 'quiz':
			quiz.showQuiz(tokens, msg);
			break;
		case prefix + 'add-quiz':
			quiz.addQuiz(tokens, msg);
			break;
		case prefix + 'edit-quiz':
			quiz.editQuiz(tokens, msg);
			break;
		case prefix + 'quiz-stat':
			quiz.showStat(tokens, msg);
			break;
		case prefix + 'xào-đề':
		case prefix + 'endless-quiz':
			quiz.endlessQuiz(tokens, msg);
			break;
		case prefix + '<(")':
			utils.debug(tokens, msg);
	}
});


client.login(process.env.BOT_TOKEN);
