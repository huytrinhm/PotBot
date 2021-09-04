const { MessageEmbed } = require('discord.js');
const admin = require('firebase-admin');
const db = admin.firestore();


function sendQuiz(msg, data, id) {
	try {
		if(data.type == 0) {
			var em = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`${data.score} points question`)
				.setDescription(data.question)
				.addField('Answers', `||${data.answers.join('|')}||`)
				.addField('Tags', data.tag.join(', '))
				.setFooter(`ID: ${id}`);

			msg.channel.send({embeds: [em]});
		}
	} catch(e) {
		msg.channel.send(':x: Unexpected error!');
	}
}

async function showQuiz(tokens, msg) {
	if(tokens.length != 2) {
		msg.channel.send(':x: You have to specify a quiz id!');
		return;
	}

	var id = Math.floor(Number(tokens[1]));
	if(isNaN(id)) {
		msg.channel.send(':x: Id must be an positive integer!');
		return;
	}

	var quiz = (await db.collection('quiz').doc(tokens[1]).get());
	if(!quiz.exists) {
		msg.channel.send('Not found :thinking:');
		return;
	}

	var data = quiz.data();
	sendQuiz(msg, data, id);
}

async function addQuiz(tokens, msg) {
	var newQuiz = {};
	newQuiz.type = 0;

	var count = (await db.collection('misc').doc('quiz-info').get('count')).data().count;
	db.collection('misc').doc('quiz-info').set({count: count + 1});
	var filter = m => {return m.author.id == msg.author.id};

	msg.channel.send(`Question's points (enter \`cancel\` to cancel):`);
	msg.channel.awaitMessages({
		filter,
		max: 1,
		time: 20000,
		errors: ['time']
	})
	.then((collected) => {
		var info = collected.first().content;
		if(info == 'cancel') {
			collected.first().reply('Operation was cancelled!');
			throw {name: "OperationCancel", message: "Operation was cancelled!"};
		}
		var score = Math.floor(Number(info));
		if(isNaN(score)) {
			collected.first().reply(':x: Value error!');
			throw {name: "ValueError", message: "Value error!"};
		}
		newQuiz.score = score;

		msg.channel.send(`Question's statement (enter \`cancel\` to cancel):`);
		return msg.channel.awaitMessages({
			filter,
			max: 1,
			time: 20000,
			errors: ['time']
		});
	})
	.then((collected) => {
		var info = collected.first().content;
		if(info == 'cancel') {
			collected.first().reply('Operation was cancelled!');
			throw {name: "OperationCancel", message: "Operation was cancelled!"};
		}
		var statement = info;
		newQuiz.question = statement;

		msg.channel.send(`Question's answers (use \`|\` to seperate answers, enter \`cancel\` to cancel):`);
		return msg.channel.awaitMessages({
			filter,
			max: 1,
			time: 20000,
			errors: ['time']
		});
	})
	.then((collected) => {
		var info = collected.first().content;
		if(info == 'cancel') {
			collected.first().reply('Operation was cancelled!');
			throw {name: "OperationCancel", message: "Operation was cancelled!"};
		}
		var answers = info.split('|');
		newQuiz.answers = answers;

		msg.channel.send(`Question's tags (use \`|\` to seperate tags, enter \`cancel\` to cancel):`);
		return msg.channel.awaitMessages({
			filter,
			max: 1,
			time: 20000,
			errors: ['time']
		});
	})
	.then(async (collected) => {
		var info = collected.first().content;
		if(info == 'cancel') {
			collected.first().reply('Operation was cancelled!');
			throw {name: "OperationCancel", message: "Operation was cancelled!"};
		}
		var tag = info.split('|');
		newQuiz.tag = tag;

		db.collection('quiz').doc(String(count + 1)).set(newQuiz).then(() => {
			msg.channel.send(':white_check_mark: Add successfully!');
		});
	})
	.catch((e) => {
		db.collection('misc').doc('quiz-info').set({count: count});
		if(e.name != 'OperationCancel' && e.name != 'ValueError')
			msg.channel.send(':x: No answer provided!');
	});
}

async function editQuiz(tokens, msg) {
	if(tokens.length != 2) {
		msg.channel.send(':x: You have to specify a quiz id!');
		return;
	}

	var id = Math.floor(Number(tokens[1]));
	if(isNaN(id)) {
		msg.channel.send(':x: Id must be an positive integer!');
		return;
	}

	var quiz = (await db.collection('quiz').doc(tokens[1]).get());
	if(!quiz.exists) {
		msg.channel.send('Not found :thinking:');
		return;
	}

	var data = quiz.data();
	msg.channel.send('Old quiz:');
	sendQuiz(msg, data, id);
	msg.channel.send('Please set new quiz:');

	var newQuiz = {};
	newQuiz.type = 0;

	var filter = m => {return m.author.id == msg.author.id};

	msg.channel.send(`Question's points (enter \`cancel\` to cancel):`);
	msg.channel.awaitMessages({
		filter,
		max: 1,
		time: 20000,
		errors: ['time']
	})
	.then((collected) => {
		var info = collected.first().content;
		if(info == 'cancel') {
			collected.first().reply('Operation was cancelled!');
			throw {name: "OperationCancel", message: "Operation was cancelled!"};
		}
		var score = Math.floor(Number(info));
		if(isNaN(score)) {
			collected.first().reply(':x: Value error!');
			throw {name: "ValueError", message: "Value error!"};
		}
		newQuiz.score = score;

		msg.channel.send(`Question's statement (enter \`cancel\` to cancel):`);
		return msg.channel.awaitMessages({
			filter,
			max: 1,
			time: 20000,
			errors: ['time']
		});
	})
	.then((collected) => {
		var info = collected.first().content;
		if(info == 'cancel') {
			collected.first().reply('Operation was cancelled!');
			throw {name: "OperationCancel", message: "Operation was cancelled!"};
		}
		var statement = info;
		newQuiz.question = statement;

		msg.channel.send(`Question's answers (use \`|\` to seperate answers, enter \`cancel\` to cancel):`);
		return msg.channel.awaitMessages({
			filter,
			max: 1,
			time: 20000,
			errors: ['time']
		});
	})
	.then((collected) => {
		var info = collected.first().content;
		if(info == 'cancel') {
			collected.first().reply('Operation was cancelled!');
			throw {name: "OperationCancel", message: "Operation was cancelled!"};
		}
		var answers = info.split('|');
		newQuiz.answers = answers;

		msg.channel.send(`Question's tags (use \`|\` to seperate tags, enter \`cancel\` to cancel):`);
		return msg.channel.awaitMessages({
			filter,
			max: 1,
			time: 20000,
			errors: ['time']
		});
	})
	.then(async (collected) => {
		var info = collected.first().content;
		if(info == 'cancel') {
			collected.first().reply('Operation was cancelled!');
			throw {name: "OperationCancel", message: "Operation was cancelled!"};
		}
		var tag = info.split('|');
		newQuiz.tag = tag;

		db.collection('quiz').doc(String(id)).set(newQuiz).then(() => {
			msg.channel.send(':white_check_mark: Edit successfully!');
		});
	})
	.catch((e) => {
		if(e.name != 'OperationCancel' && e.name != 'ValueError')
			msg.channel.send(':x: No answer provided!');
	});
}

async function showStat(tokens, msg) {
	var count = (await db.collection('misc').doc('quiz-info').get('count')).data().count;
	msg.channel.send(`:grey_exclamation: Quiz count: ${count}`)
}

function endlessQuiz(tokens, msg) {
	return;
}

module.exports = {showQuiz, addQuiz, editQuiz, showStat, endlessQuiz};