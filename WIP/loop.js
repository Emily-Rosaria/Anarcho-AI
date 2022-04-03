const { canModifyQueue } = require("../util/Util");
const i18n = require("../util/i18n");
const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
	.setName("loop")
	.setDescription(i18n.__("loop.description"));

module.exports = {
  name: "loop",
  aliases: ["l"],
  data: data,
  description: i18n.__("loop.description"),
  execute(message) {
    const queue = message.client.queue.get(message.guildId);
    if (!queue) return message.reply({content: i18n.__("loop.errorNotQueue"), ephemeral: true}).catch(console.error);
    if (!canModifyQueue(message.member)) return message.reply({content: i18n.__("common.errorNotChannel"), ephemeral: true});

    // toggle from false to true and reverse
    queue.loop = !queue.loop;
    return queue.textChannel
      .send(i18n.__mf("loop.result", { loop: queue.loop ? i18n.__("common.on") : i18n.__("common.off") }))
      .catch(console.error);
  }
};
