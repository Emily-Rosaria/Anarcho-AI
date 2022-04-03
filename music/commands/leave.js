const i18n = require("../util/i18n");
const ytdl = require("ytdl-core");
require('dotenv').config(); //for .env file
const Discord = require('discord.js'); // Image embed
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require ('@discordjs/voice');

const data = new SlashCommandBuilder()
	.setName('leave')
	.setDescription("Leave current voice channel");

module.exports = {
  name: "leave",
  data: data,
  cooldown: 3,
  description: "Leave current voice channel",
  async execute(message) {
    const connection = getVoiceConnection(message.channel.guild.id);

		if (connection) {
			if ((!message.member || !message.member.voice || !message.member.voice.channel || message.member.voice.channel.id != message.guild.me.voice.channel.id) && message.guild.me.voice.channel.members && message.guild.me.voice.channel.members.size > 1) {
				return message.reply({content:"Sorry, other members are using the bot in a voice channel right now, so you can't use this command without joining them.",ephemeral: true});
			}
			connection.destroy();
			return message.reply("Successfully left the voice channel!");
		}
		return message.reply({content:"The bot is not currently in a voice channel right now.",ephemeral: true});
  }
};
