/**
 * Module Imports
 */
const { Collection } = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");
const { TOKEN, PREFIX, GUILD, DEFAULT_VOLUME } = require("./util/Util");
const i18n = require("./util/i18n");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

module.exports = async function(client) {
  client.queue = new Map();
  //client.volume = DEFAULT_VOLUME;
  const cooldowns = new Collection();
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  /**
   * Client Events
   */
  client.on("warn", (info) => console.log(info));
  client.on("error", console.error);

  /**
   * Import all commands
   */
  const commandFiles = readdirSync(join(__dirname, "commands")).filter((file) => file.endsWith(".js"));
  const clientId = client.user.id;
  const guildId = GUILD;

  client.slashCommands = new Collection();

  const commands = [];

  for (const file of commandFiles) {
  	const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
    client.slashCommands.set(command.data.name, command);
  }

  client.voiceTimeouts = new Collection();

  const rest = new REST({ version: '9' }).setToken(TOKEN);

  (async () => {
  	try {
  		console.log('Started refreshing application (/) commands for music.');

  		await rest.put(
  			Routes.applicationGuildCommands(clientId, guildId),
  			{ body: commands },
  		);

  		console.log('Successfully reloaded application (/) commands for music.');
  	} catch (error) {
  		console.error(error);
  	}
  })();

  client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    if (!cooldowns.has(command.name)) {
      cooldowns.set(command.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 1) * 1000;

    if (timestamps.has(interaction.member.id)) {
      const expirationTime = timestamps.get(interaction.member.id) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return await interaction.reply({ content: i18n.__mf("common.cooldownMessage", { time: timeLeft.toFixed(1), name: command.name }), ephemeral: true});
      }
    }

    timestamps.set(interaction.member.id, now);
    setTimeout(() => timestamps.delete(interaction.member.id), cooldownAmount);
    try {
        await command.execute(interaction,[]);
    } catch (error) {
        if (error) console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  });
}
