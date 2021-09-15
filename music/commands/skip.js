const { canModifyQueue } = require("../util/Util");
const i18n = require("../util/i18n");
const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
	.setName("skip")
	.setDescription(i18n.__("skip.description"));

module.exports = {
  name: "skip",
  aliases: ["s"],
  data: data,
  description: i18n.__("skip.description"),
  execute(message) {
    const queue = message.client.queue.get(message.guildId);
    if (!queue) return message.reply({content: i18n.__("skip.errorNotQueue"), ephemeral: true}).catch(console.error);
    if (!canModifyQueue(message.member)) return message.reply({content: i18n.__("common.errorNotChannel"), ephemeral: true});

    queue.playing = true;
    queue.connection.dispatcher.end();
    queue.textChannel.send(i18n.__mf("skip.result", { author: message.member.id })).catch(console.error);
  }
};
