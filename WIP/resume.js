const { canModifyQueue } = require("../util/Util");
const i18n = require("../util/i18n");
const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
	.setName("resume")
	.setDescription(i18n.__("resume.description"));

module.exports = {
  name: "resume",
  data: data,
  aliases: ["r"],
  description: i18n.__("resume.description"),
  execute(message) {
    const queue = message.client.queue.get(message.guildId);
    if (!queue) return message.reply(i18n.__("resume.errorNotQueue")).catch(console.error);
    if (!canModifyQueue(message.member)) return i18n.__("common.errorNotChannel");

    if (!queue.playing) {
      queue.playing = true;
      queue.connection.dispatcher.resume();
      return queue.textChannel
        .send(i18n.__mf("resume.resultNotPlaying", { author: message.member.id }))
        .catch(console.error);
    }

    return message.reply({content: i18n.__("resume.errorPlaying"), ephemeral: true}).catch(console.error);
  }
};
