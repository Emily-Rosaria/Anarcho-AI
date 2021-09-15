const i18n = require("../util/i18n");
const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
	.setName("clip")
	.setDescription(i18n.__("clip.description"))
	.addStringOption(option =>
		option.setName('clip')
			.setDescription('The clip to play.')
			.setRequired(true));

module.exports = {
  name: "clip",
  data: data,
  description: i18n.__("clip.description"),
  async execute(message) {
    const { channel } = message.member.voice;
    const queue = message.client.queue.get(message.guild.id);

    const args = [message.getString('clip')];

    if (!args.length) return message.reply(i18n.__("clip.usagesReply")).catch(console.error);
    if (queue) return message.reply(i18n.__("clip.errorQueue"));
    if (!channel) return message.reply(i18n.__("clip.errorNotChannel")).catch(console.error);

    const queueConstruct = {
      textChannel: message.channel,
      channel,
      connection: null,
      songs: [],
      loop: false,
      volume: 100,
      muted: false,
      playing: true
    };

    message.client.queue.set(message.guild.id, queueConstruct);

    try {
      queueConstruct.connection = await channel.join();
      const dispatcher = queueConstruct.connection
        .play(`./sounds/${args[0]}.mp3`)
        .on("finish", () => {
          message.client.queue.delete(message.guild.id);
          channel.leave();
        })
        .on("error", (err) => {
          message.client.queue.delete(message.guild.id);
          channel.leave();
          console.error(err);
        });
    } catch (error) {
      console.error(error);
    }
  }
};
