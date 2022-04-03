const i18n = require("../util/i18n");
const ytdl = require("ytdl-core");
require('dotenv').config(); //for .env file
const Discord = require('discord.js'); // Image embed
const tts_key = process.env.TTS_API_KEY
const fetch = require('node-fetch'); // This lets me get stuff from api.
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const { Readable } = require('stream');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { createAudioPlayer, VoiceConnectionStatus, AudioPlayerStatus, createAudioResource, joinVoiceChannel, getVoiceConnection, StreamType, demuxProbe } = require ('@discordjs/voice');

const data = new SlashCommandBuilder()
	.setName('join')
	.setDescription("Join you in a voice channel");

module.exports = {
  name: "join",
  data: data,
  cooldown: 3,
  description: "Join you in a voice channel",
  async execute(message) {
		if (message.member && message.member.voice) {
			const { channel } = message.member.voice;

			const permissions = channel.permissionsFor(message.client.user);
	    if (!permissions.has("CONNECT")) return message.reply({content: i18n.__("play.missingPermissionConnect"),ephemeral: true});
	    if (!permissions.has("SPEAK")) return message.reply({content: i18n.__("play.missingPermissionSpeak"),ephemeral: true});

			const connection = getVoiceConnection(message.channel.guild.id);
			if (connection) {
				connection.destroy();
			}
			joinVoiceChannel({
				channelId: channel.id,
				guildId: channel.guild.id,
				adapterCreator: channel.guild.voiceAdapterCreator,
			});

			const guildId = channel.guild.id;

			var timeoutFunc = setTimeout(function() {
				try {
					getVoiceConnection(guildId).destroy();
					message.client.voiceTimeouts.delete(guildId);
				} catch (e) {

				}
      }, 20 * 60 * 1000, guildId);

			message.client.voiceTimeouts.set(guildId,timeoutFunc);

			return message.reply("Successfully joined you in the voice channel!");
		}
		return message.reply({content:"You're not currently in a voice channel right now.",ephemeral: true});
  }
};
