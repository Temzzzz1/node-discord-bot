module.exports = {
	name: 'ping',
	description: 'Pinging',
	guildOnly: true,
	execute(message) {
        message.channel.send('Pong');
	},
};