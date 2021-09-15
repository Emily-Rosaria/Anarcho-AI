const { canModifyQueue } = require("../util/Util");
const i18n = require("../util/i18n");
const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
	.setName("skipto")
	.setDescription(i18n.__("skipto.description"))
	.addIntegerOption(option =>
		option.setName('queue-id')
			.setDescription('The song to skip to.')
			.setRequired(true));

module.exports = {
  name: "skipto",
  data: data,
  aliases: ["st"],
  description: i18n.__("skipto.description"),
  execute(message) {

    const args = [message.getInteger('queue-id')];

    if (!args.length || isNaN(args[0]))
      return message
        .reply(i18n.__mf("skipto.usageReply", { prefix: message.client.prefix, name: module.exports.name }))
        .catch(console.error);

    const queue = message.client.queue.get(message.guild.id);
    if (!queue) return message.channel.send(i18n.__("skipto.errorNotQueue")).catch(console.error);
    if (!canModifyQueue(message.member)) return i18n.__("common.errorNotChannel");
    if (args[0] > queue.songs.length)
      return message
        .reply(i18n.__mf("skipto.errorNotValid", { length: queue.songs.length }))
        .catch(console.error);

    queue.playing = true;

    if (queue.loop) {
      for (let i = 0; i < args[0] - 2; i++) {
        queue.songs.push(queue.songs.shift());
      }
    } else {
      queue.songs = queue.songs.slice(args[0] - 2);
    }

    queue.connection.dispatcher.end();
    queue.textChannel
      .send(i18n.__mf("skipto.result", { author: message.author, arg: args[0] - 1 }))
      .catch(console.error);
  }
};
