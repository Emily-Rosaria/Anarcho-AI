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
	.setName('say')
	.setDescription("Speak text in a voice channel")
	.addStringOption(option =>
		option.setName('text')
			.setDescription('Words to say.')
			.setRequired(true))
	.addStringOption(option =>
		option.setName('gender')
			.setDescription('Gender presentation of the voice.')
			.setRequired(false)
			.addChoice('Male', 'MALE')
			.addChoice('Female', 'FEMALE')
			.addChoice('Neutral', 'NEUTRAL'))
	.addStringOption(option =>
		option.setName('accent')
			.setDescription('Accent of the voice.')
			.setRequired(false)
			.addChoice('English (Australia)', 'en-AU')
			.addChoice('English (UK)', 'en-GB')
			.addChoice('English (India)', 'en-IN')
			.addChoice('English (US)', 'en-US'));

module.exports = {
  name: "say",
  data: data,
  cooldown: 3,
  description: "Speak text in a voice channel using a custom voice",
  async execute(message) {
    const { channel } = message.member.voice;

    const text = message.options.getString('text');
		const gender = message.options.getString('gender') || "NEUTRAL";
		const accent = message.options.getString('accent') || "en-US";

    const serverQueue = message.client.queue.get(message.guildId);

    if (!channel) return message.reply({content: i18n.__("play.errorNotChannel"),ephemeral: true}).catch(console.error);

    if (serverQueue && channel !== message.guild.me.voice.channel)
      return message
        .reply({content: i18n.__mf("play.errorNotInSameChannel", { user: message.client.user }),ephemeral: true})
        .catch(console.error);

    const permissions = channel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT")) return message.reply({content: i18n.__("play.missingPermissionConnect"),ephemeral: true});
    if (!permissions.has("SPEAK")) return message.reply({content: i18n.__("play.missingPermissionSpeak"),ephemeral: true});

		try {

			// Creates a client
			const googleClient = new textToSpeech.TextToSpeechClient();

		  // Construct the request
		  const request = {
		    input: {text: text},
		    // Select the language and SSML voice gender (optional)
		    voice: {languageCode: accent, ssmlGender: gender},
		    // select the type of audio encoding
		    audioConfig: {audioEncoding: 'OGG_OPUS'},
		  };

		  // Performs the text-to-speech request
		  const [response] = await googleClient.synthesizeSpeech(request);

		  // const writeFile = util.promisify(fs.writeFile);
		  // await writeFile('output.mp3', response.audioContent, 'binary');

			var connection = getVoiceConnection(channel.guild.id);

			const player = createAudioPlayer();

			const speech = createAudioResource(Readable.from(response.audioContent), {
				inputType: StreamType.OggOpus
			});

			function playVoice() {
				const subscription = connection.subscribe(player);
				player.play(speech);

				player.once(AudioPlayerStatus.Idle, () => {
					player.stop();
					subscription.unsubscribe();
				});

				player.once(AudioPlayerStatus.AutoPaused, () => {
					player.stop();
					subscription.unsubscribe();
				});
			}

			if (!connection || (channel.guild.me.voice && channel.guild.me.voice.channel && channel.guild.me.voice.channel.id != channel.id)) {
				connection = joinVoiceChannel({
					channelId: channel.id,
					guildId: channel.guild.id,
					adapterCreator: channel.guild.voiceAdapterCreator,
				});
				connection.once(VoiceConnectionStatus.Ready, () => {
					playVoice()
				});
				connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
					try {
						await Promise.race([
							entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
							entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
						]);
						// Seems to be reconnecting to a new channel - ignore disconnect
					} catch (error) {
						// Seems to be a real disconnect which SHOULDN'T be recovered from
						connection.destroy();
					}
				});
			} else {
				playVoice();
			}

			if (message.client.voiceTimeouts.get(channel.guild.id)) {
				try {
			    clearTimeout(message.client.voiceTimeouts.get(channel.guild.id));
			  } catch(e) {
			    // there's no leaveTimer
			  }
			}

			const guildId = channel.guild.id;

			var timeoutFunc = setTimeout(function() {
				try {
					getVoiceConnection(guildId).destroy();
					message.client.voiceTimeouts.delete(guildId);
				} catch (e) {

				}
      }, 20 * 60 * 1000, guildId);

			message.client.voiceTimeouts.set(guildId,timeoutFunc);

			const embed = new Discord.MessageEmbed()
			.setDescription(text)
			.setColor(message.member.displayHexColor || "#000000")
			.setFooter(`Sent by ${message.user.username}, ${gender}, ${accent}`)
			.setTimestamp()
			return message.reply({embeds: [embed]});
		} catch (error) {
			console.error(error);
			return message.reply({content:"An error occured. This usually happens when a message is too long or has lots of emojis.",ephemeral: true});
		}
  }
};
