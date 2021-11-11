const { MessageEmbed } = require('discord.js');
const admin = require('firebase-admin');
const quizDict = require('./dict.js');
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
			if(data.image)
				em.setImage(data.image);

			msg.channel.send({embeds: [em]});
		}
	} catch(e) {
		msg.channel.send(':x: Unexpected error!');
	}
}

function sendQuizWithoutAns(msg, data, id) {
	try {
		if(data.type == 0) {
			var em = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`${data.score} points question for ${msg.author.tag}`)
				.setDescription(data.question)
				.addField('Tags', data.tag.join(', '))
				.setFooter(`ID: ${id}`);
			if(data.image)
				em.setImage(data.image);

			msg.channel.send({embeds: [em]});
		}
	} catch(e) {
		msg.channel.send(':x: Unexpected error!');
	}
}

async function showQuiz(tokens, msg) {
	if(!msg.member.permissions.has("ADMINISTRATOR")) {
		msg.reply(':x: User is not admin!');
		return;
	}

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
	if(!msg.member.permissions.has("ADMINISTRATOR")) {
		msg.reply(':x: User is not admin!');
		return;
	}

	var newQuiz = {};
	newQuiz.type = 0;

	var count = (await db.collection('misc').doc('quiz-info').get('count')).data().count;
	db.collection('misc').doc('quiz-info').set({count: count + 1}, {merge: true});
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

		if(collected.first().attachments.size)
			newQuiz.image = collected.first().attachments.first().url;

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
		for(var i = 0; i < answers.length; i++)
			answers[i] = answers[i].trim().replaceAll(' ~> ', '~> ').replaceAll('~> ', '~>').replaceAll(' ~+ ', '~+ ').replaceAll('~+ ', '~+').replaceAll(' , ', ',').replaceAll(',', ', ');
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
		var tagSet = new Set();
		for(var i = 0; i < tag.length; i++) {
			tag[i] = tag[i].trim();
			if(quizDict.tagDict.get(tag[i].toLowerCase())) {
				tagSet.add(quizDict.tagDict.get(tag[i].toLowerCase()));
			} else {
				tagSet.add(tag[i]);
			}

			if(quizDict.otherDict.get(tag[i].toLowerCase()))
				tagSet.add(quizDict.otherDict.get(tag[i].toLowerCase()));
		}
		newQuiz.tag = Array.from(tagSet);

		db.collection('quiz').doc(String(count + 1)).set(newQuiz).then(() => {
			msg.channel.send(':white_check_mark: Add successfully!');
		});
	})
	.catch((e) => {
		db.collection('misc').doc('quiz-info').set({count: count}, {merge: true});
		if(e.name != 'OperationCancel' && e.name != 'ValueError')
			msg.channel.send(':x: No answer provided!');
	});
}

async function editQuiz(tokens, msg) {
	if(!msg.member.permissions.has("ADMINISTRATOR")) {
		msg.reply(':x: User is not admin!');
		return;
	}
	
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
		if(collected.first().attachments.size)
			newQuiz.image = collected.first().attachments.first().url;

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
		for(var i = 0; i < answers.length; i++)
			answers[i] = answers[i].trim().replaceAll(' ~> ', '~> ').replaceAll('~> ', '~>').replaceAll(' ~+ ', '~+ ').replaceAll('~+ ', '~+').replaceAll(' , ', ',').replaceAll(',', ', ');
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
		var tagSet = new Set();
		for(var i = 0; i < tag.length; i++) {
			tag[i] = tag[i].trim();
			if(quizDict.tagDict.get(tag[i].toLowerCase())) {
				tagSet.add(quizDict.tagDict.get(tag[i].toLowerCase()));
			} else {
				tagSet.add(tag[i]);
			}

			if(quizDict.otherDict.get(tag[i].toLowerCase()))
				tagSet.add(quizDict.otherDict.get(tag[i].toLowerCase()));
		}
		newQuiz.tag = Array.from(tagSet);

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

function random(n) {
	return Math.floor(Math.random() * n + 1);
}

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

function checkAns(sys, usr) {
	var uans = usr.toLowerCase().replaceAll(' , ', ', ').replaceAll(', ', ',').replaceAll(',', ', ').trim();
	for(const ans of sys) {
		if(uans == ans.toLowerCase().replaceAll(' , ', ', ').replaceAll(', ', ',').replaceAll(',', ', ').replaceAll(' ~> ', '~> ').replaceAll('~> ', '~>').replaceAll('~>', ', ').trim())
			return true;
		if(ans.includes('~+')) {
			var uans_arr = uans.split(', ').sort();
			var ans_arr = ans.split('~+').sort();
			if(uans_arr.length == ans_arr.length) {
				var flag = false;
				for(var i = 0; i < uans_arr.length; i++) {
					if(uans_arr[i] != ans_arr[i].toLowerCase().trim()) {
						flag = true;
						break;
					}
				}

				if(!flag)
					return true;
			}
		}
	}
	return false;
}

function wordCount(s) {
	return s.split(' ').length;
}

async function quizLoop(msg, count, alone, timeoutCount, list) {
	if(timeoutCount >= 3) {
		msg.channel.send('AFK ròi à');
		return;
	}
	if(list.length == 0)
		list = shuffle([...Array(count).keys()]);
	var id = list.shift();
	var quiz = (await db.collection('quiz').doc(String(id)).get()).data();
	sendQuizWithoutAns(msg, quiz, id);
	var startTime = Date.now();
	var length = (5000 + quiz.score*500) + wordCount(quiz.question)*300;
	var filter = (m) => {
		if(alone)
			return m.author.id == msg.author.id;
		else
			return !m.author.bot;
	};
	var quit = false, skip = false, correct = false, answered = false;
	while(!quit && !skip && !correct) {
		await msg.channel.awaitMessages({
			filter,
			max: 1,
			time: startTime + length - Date.now(),
			errors: ['time']
		}).then((collected) => {
			if(collected.first().content.toLowerCase() == 'quit') {
				quit = true;
			} else {
				answered = true;
				if(collected.first().content.toLowerCase() != 'skip') {
					if(checkAns(quiz.answers, collected.first().content)) {
						collected.first().react('<:pepeOK:883707335615340544>');
						collected.first().reply('Correct!');
						correct = true;
					} else {
						collected.first().react('<:sadge:883698222634254416>');
					}
				} else {
					skip = true;
				}
			}
		}).catch(() => {
			msg.channel.send('Time\'s up!');
			skip = true;
		});
		if(answered) {
			timeoutCount = 0;
		} else {
			timeoutCount++;
		}
	}
	msg.channel.send(`The answer is **${quiz.answers[0].replaceAll('~+', ', ').replaceAll('~>', ', ')}**`);
	if(quit) {
		msg.channel.send('Bye!');
		return;
	}
	quizLoop(msg, count, alone, timeoutCount, list);
}

async function endlessQuiz(tokens, msg) {
	var count = (await db.collection('misc').doc('quiz-info').get('count')).data().count;
	var list = shuffle([...Array(count).keys()]);
	if(tokens.length == 2 && tokens[1].toLowerCase() == 'alone')
		quizLoop(msg, count, true, 0, list);
	else
		quizLoop(msg, count, false, 0, list);
}

module.exports = {showQuiz, addQuiz, editQuiz, showStat, endlessQuiz};