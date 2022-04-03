const { MessageEmbed } = require("discord.js");
const lyricsFinder = require("lyrics-finder");
const i18n = require("../util/i18n");
const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
	.setName("lyrics")
	.setDescription(i18n.__("lyrics.description"));

module.exports = {
  name: "lyrics",
  aliases: ["ly"],
  data: data,
  description: i18n.__("lyrics.description"),
  async execute(message) {
    const queue = message.client.queue.get(message.guildId);
    if (!queue) return message.channel.send(i18n.__("lyrics.errorNotQueue")).catch(console.error);

    let lyrics = null;
    const title = queue.songs[0].title;
    try {
      lyrics = await lyricsFinder(queue.songs[0].title, "");
      if (!lyrics) lyrics = i18n.__mf("lyrics.lyricsNotFound", { title: title });
    } catch (error) {
      lyrics = i18n.__mf("lyrics.lyricsNotFound", { title: title });
    }

    let lyricsEmbed = new MessageEmbed()
      .setTitle(i18n.__mf("lyrics.embedTitle", { title: title }))
      .setDescription(lyrics)
      .setColor("#F8AA2A")
      .setTimestamp();

    if (lyricsEmbed.description.length >= 4048)
      lyricsEmbed.description = `${lyricsEmbed.description.substr(0, 4045)}...`;
    return message.channel.send({embeds: [lyricsEmbed]}).catch(console.error);
  }
};
