const { canModifyQueue } = require("../util/Util");
const i18n = require("../util/i18n");
const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
	.setName("volume")
	.setDescription(i18n.__("volume.description"))
	.addIntegerOption(option =>
		option.setName('volume')
			.setDescription('The volume out of 100.')
			.setRequired(true));

module.exports = {
  name: "volume",
  data: data,
  aliases: ["v"],
  description: i18n.__("volume.description"),
  execute(message) {
    const queue = message.client.queue.get(message.guildId);
    const args = [message.getInteger('volume')];

    if (!queue) return message.reply(i18n.__("volume.errorNotQueue")).catch(console.error);
    if (!canModifyQueue(message.member))
      return message.reply(i18n.__("volume.errorNotChannel")).catch(console.error);

    if (!args[0])
      return message.reply(i18n.__mf("volume.currentVolume", { volume: queue.volume })).catch(console.error);
    if (isNaN(args[0])) return message.reply(i18n.__("volume.errorNotNumber")).catch(console.error);
    if (Number(args[0]) > 100 || Number(args[0]) < 0)
      return message.reply(i18n.__("volume.errorNotValid")).catch(console.error);

    queue.volume = args[0];
    queue.connection.dispatcher.setVolumeLogarithmic(args[0] / 100);
    return queue.textChannel.send(i18n.__mf("volume.result", { arg: args[0] })).catch(console.error);
  }
};
