const helpMsg = 
`**All commands**
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
\`?random-quiz\`: Not yet implemented!
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

module.exports = {changePrefix, sendHelp};