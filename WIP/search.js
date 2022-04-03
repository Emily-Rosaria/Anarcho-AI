const { MessageEmbed } = require("discord.js");
const YouTubeAPI = require("simple-youtube-api");
const { YOUTUBE_API_KEY } = require("../util/Util");
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);
const i18n = require("../util/i18n");
const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
	.setName('search')
	.setDescription(i18n.__("search.description"))
	.addStringOption(option =>
		option.setName('search-query')
			.setDescription('Video Name')
			.setRequired(true));

module.exports = {
  name: "search",
  data: data,
  description: i18n.__("search.description"),
  async execute(message) {
    const args = [message.options.getString('search-query')];
    if (!args.length)
      return message
        .reply({content: i18n.__mf("search.usageReply", { prefix: message.client.prefix, name: module.exports.name }), ephemeral: true})
        .catch(console.error);
    if (message.channel.activeCollector) return message.reply(i18n.__("search.errorAlreadyCollector"));
    if (!message.member.voice.channel)
      return message.reply({content: i18n.__("search.errorNotChannel"), ephemeral: true}).catch(console.error);

    const search = args.join(" ");

    let resultsEmbed = new MessageEmbed()
      .setTitle(i18n.__("search.resultEmbedTtile"))
      .setDescription(i18n.__mf("search.resultEmbedDesc", { search: search }))
      .setColor("#F8AA2A");

    try {
      const results = await youtube.searchVideos(search, 10);
      results.map((video, index) => resultsEmbed.addField(video.shortURL, `${index + 1}. ${video.title}`));

      let resultsMessage = await message.channel.send({embeds: [resultsEmbed]});

      function filter(msg) {
        const pattern = /^[0-9]{1,2}(\s*,\s*[0-9]{1,2})*$/;
        return pattern.test(msg.content);
      }

      message.channel.activeCollector = true;
      const response = await message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ["time"] });
      const reply = response.first().content;

      if (reply.includes(",")) {
        let songs = reply.split(",").map((str) => str.trim());

        for (let song of songs) {
          await message.client.musicCommands
            .get("play")
            .execute(message, [resultsEmbed.fields[parseInt(song) - 1].name]);
        }
      } else {
        const choice = resultsEmbed.fields[parseInt(response.first()) - 1].name;
        message.client.musicCommands.get("play").execute(message, [choice]);
      }

      message.channel.activeCollector = false;
      resultsMessage.delete().catch(console.error);
      response.first().delete().catch(console.error);
    } catch (error) {
      console.error(error);
      message.channel.activeCollector = false;
      //message.reply(error.message).catch(console.error);
    }
  }
};
