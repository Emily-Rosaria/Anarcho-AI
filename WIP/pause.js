const { canModifyQueue } = require("../util/Util");
const i18n = require("../util/i18n");
const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
	.setName("pause")
	.setDescription(i18n.__("pause.description"));

module.exports = {
  name: "pause",
  data: data,
  description: i18n.__("pause.description"),
  execute(message) {
    const queue = message.client.queue.get(message.guildId);
    if (!queue) return message.reply(i18n.__("pause.errorNotQueue")).catch(console.error);
    if (!canModifyQueue(message.member)) return i18n.__("common.errorNotChannel");

    if (queue.playing) {
      queue.playing = false;
      queue.connection.dispatcher.pause(true);
      return queue.textChannel
        .send(i18n.__mf("pause.result", { author: message.member.id }))
        .catch(console.error);
    }
  }
};
