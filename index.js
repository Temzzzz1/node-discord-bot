const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token } = require('./config.json');

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

const cooldowns = new Discord.Collection();

// Логинемся
client.on('ready', () => {
  console.log(`Logged!`);
});

client.on('message', message => {


    // Проверяем сообщения с префиксом
	if (!message.content.startsWith(prefix) || message.author.bot) return;


    // Дополнительные штуки для удобной работы с аргументами команд
	const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    console.log(args);

    // Проверяем и подключаем команду с директории
	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    // Если команда не найдена, сворачиваем все
	if (!command) return;

    // Если команда только для админов
	if (command.guildOnly && message.channel.type === 'dm') {
		return message.reply('I can\'t execute that command inside DMs!');
	}

    // Если аргументов нет
	if (command.args && !args.length) {
		let reply = `You didn't provide any arguments, ${message.author}!`;
        // Говорим юзеру, как правильно надо вводить команду
		if (command.usage) {
			reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
		}

        // Отправляем ответ
		return message.channel.send(reply);
	}

    // Создаем коллекцию, если в командах написано про кулдауны
	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

    // Подключаем время, время кулдауна и прочие штуки
	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 3) * 1000;

    // Если у юзера есть кулдаун, то говорим ему, что нужно подождать
	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
		}
	}

    // Включаем таймер, через сколько надо удалить из коллекции кулдаун
	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    // Включаем обработчик исключений, потому что если команда будет 
    // с ошибкой, то сервер крашнется, а зачем нам это?
	try {
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
});


// Нужен, чтобы подключиться к боту
client.login(token);