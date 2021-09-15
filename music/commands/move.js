const move = require("array-move");
const { canModifyQueue } = require("../util/Util");
const i18n = require("../util/i18n");
const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
	.setName("move")
	.setDescription(i18n.__("move.description"))
	.addIntegerOption(option =>
		option.setName('queue-id-1')
			.setDescription('The first song to move.')
			.setRequired(true))
  .addIntegerOption(option =>
		option.setName('queue-id-2')
			.setDescription('The song to swap it with.')
			.setRequired(false));

module.exports = {
  name: "move",
  aliases: ["mv"],
  data: data,
  description: i18n.__("move.description"),
  execute(message) {
    const args = [message.options.getInteger('queue-id-1')];
    if (message.getInteger('queue-id-2')) {
      args.push(message.options.getInteger('queue-id-2'));
    }
    const queue = message.client.queue.get(message.guildId);
    if (!queue) return message.channel.send(i18n.__("move.errorNotQueue")).catch(console.error);
    if (!canModifyQueue(message.member)) return;

    if (!args.length) return message.reply(i18n.__mf("move.usagesReply", { prefix: message.client.prefix }));
    if (isNaN(args[0]) || args[0] <= 1)
      return message.reply(i18n.__mf("move.usagesReply", { prefix: message.client.prefix }));

    let song = queue.songs[args[0] - 1];

    queue.songs = move(queue.songs, args[0] - 1, args[1] == 1 ? 1 : args[1] - 1);
    queue.textChannel.send(
      i18n.__mf("move.result", {
        author: message.member.id,
        title: song.title,
        index: args[1] == 1 ? 1 : args[1]
      })
    );
  }
};
