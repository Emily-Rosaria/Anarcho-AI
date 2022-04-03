const { canModifyQueue } = require("../util/Util");
const i18n = require("../util/i18n");
const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
	.setName("shuffle")
	.setDescription(i18n.__("shuffle.description"));

module.exports = {
  name: "shuffle",
  data: data,
  description: i18n.__("shuffle.description"),
  execute(message) {
    const queue = message.client.queue.get(message.guildId);
    if (!queue) return message.reply({content: i18n.__("shuffle.errorNotQueue"), ephemeral: true}).catch(console.error);
    if (!canModifyQueue(message.member)) return message.reply({content: i18n.__("common.errorNotChannel"), ephemeral: true});

    let songs = queue.songs;
    for (let i = songs.length - 1; i > 1; i--) {
      let j = 1 + Math.floor(Math.random() * i);
      [songs[i], songs[j]] = [songs[j], songs[i]];
    }
    queue.songs = songs;
    message.client.queue.set(message.guildId, queue);
    queue.textChannel.send(i18n.__mf("shuffle.result", { author: message.member.id })).catch(console.error);
  }
};
