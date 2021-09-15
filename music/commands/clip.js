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
    const queue = message.client.queue.get(message.guildId);

    const args = [message.getString('clip')];

    if (!args.length) return message.reply({content: i18n.__("clip.usagesReply"), ephemeral: true}).catch(console.error);
    if (queue) return message.reply({content: i18n.__("clip.errorQueue"), ephemeral: true});
    if (!channel) return message.reply({content: i18n.__("clip.errorNotChannel"), ephemeral: true}).catch(console.error);

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

    message.client.queue.set(message.guildId, queueConstruct);

    try {
      queueConstruct.connection = await channel.join();
      const dispatcher = queueConstruct.connection
        .play(`./sounds/${args[0]}.mp3`)
        .on("finish", () => {
          message.client.queue.delete(message.guildId);
          channel.leave();
        })
        .on("error", (err) => {
          message.client.queue.delete(message.guildId);
          channel.leave();
          console.error(err);
        });
    } catch (error) {
      console.error(error);
    }
  }
};
