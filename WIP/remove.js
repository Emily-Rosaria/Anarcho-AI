const { canModifyQueue } = require("../util/Util");
const i18n = require("../util/i18n");

const pattern = /^[0-9]{1,2}(\s*,\s*[0-9]{1,2})*$/;
const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
	.setName("remove")
	.setDescription(i18n.__("remove.description"))
	.addIntegerOption(option =>
		option.setName('queue-id')
			.setDescription('The song to remove from the queue.')
			.setRequired(true));

module.exports = {
  name: "remove",
  data: data,
  aliases: ["rm"],
  description: i18n.__("remove.description"),
  execute(message) {
    const queue = message.client.queue.get(message.guildId);
    const args = [message.options.getInteger('queue-id')];
    if (!queue) return message.channel.send(i18n.__("remove.errorNotQueue")).catch(console.error);
    if (!canModifyQueue(message.member)) return i18n.__("common.errorNotChannel");
    if (!args.length) return message.reply(i18n.__mf("remove.usageReply", { prefix: message.client.prefix }));

    const arguments = args.join("");
    const songs = arguments.split(",").map((arg) => parseInt(arg));
    let removed = [];

    if (pattern.test(arguments)) {
      queue.songs = queue.songs.filter((item, index) => {
        if (songs.find((songIndex) => songIndex - 1 === index)) removed.push(item);
        else return true;
      });

      queue.textChannel.send(
        i18n.__mf("remove.result", {
          title: removed.map((song) => song.title).join("\n"),
          author: message.member.id
        })
      );
    } else if (!isNaN(args[0]) && args[0] >= 1 && args[0] <= queue.songs.length) {
      console.log("we got elsed!");
      return queue.textChannel.send(
        i18n.__mf("remove.result", {
          title: queue.songs.splice(args[0] - 1, 1)[0].title,
          author: message.member.id
        })
      );
    } else {
      console.log("we got the last one");
      return message.reply({content: i18n.__mf("remove.usageReply", { prefix: message.client.prefix }), ephemeral: true});
    }
  }
};
