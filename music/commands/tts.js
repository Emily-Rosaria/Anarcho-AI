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
	.setName('tts')
	.setDescription("Speak text in a voice channel")
	.addStringOption(option =>
		option.setName('text')
			.setDescription('Words to say.')
			.setRequired(true));

module.exports = {
  name: "tts",
  data: data,
  cooldown: 3,
  description: "Speak text in a voice channel",
  async execute(message) {
    const { channel } = message.member.voice;

    const text = message.options.getString('text');

    const serverQueue = message.client.queue.get(message.guildId);

    if (!channel) return message.reply({content: i18n.__("play.errorNotChannel"),ephemeral: true}).catch(console.error);

    if (serverQueue && channel !== message.guild.me.voice.channel)
      return message
        .reply({content: i18n.__mf("play.errorNotInSameChannel", { user: message.client.user }),ephemeral: true})
        .catch(console.error);

    const permissions = channel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT")) return message.reply({content: i18n.__("play.missingPermissionConnect"),ephemeral: true});
    if (!permissions.has("SPEAK")) return message.reply({content: i18n.__("play.missingPermissionSpeak"),ephemeral: true});

		await message.deferReply();

		try {

			// Creates a client
			const googleClient = new textToSpeech.TextToSpeechClient();

		  // Construct the request
		  const request = {
		    input: {text: text},
		    // Select the language and SSML voice gender (optional)
		    voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
		    // select the type of audio encoding
		    audioConfig: {audioEncoding: 'OGG_OPUS'},
		  };
		  // Performs the text-to-speech request
		  const [response] = await googleClient.synthesizeSpeech(request);

		  // const writeFile = util.promisify(fs.writeFile);
		  // await writeFile('output.mp3', response.audioContent, 'binary');

			var connection = getVoiceConnection(channel.guild.id);

			if (!connection || channel.guild.me.voice.channel.id != channel.id) {
				connection = joinVoiceChannel({
					channelId: channel.id,
					guildId: channel.guild.id,
					adapterCreator: channel.guild.voiceAdapterCreator,
				});
			}

			const player = createAudioPlayer();

			const speech = createAudioResource(Readable.from(response.audioContent), {
				inputType: StreamType.OggOpus
			});

			player.play(speech);
			const subscription = connection.subscribe(player);

			player.on(AudioPlayerStatus.Idle, () => {
				player.stop();
				subscription.unsubscribe();
			});

			player.on(AudioPlayerStatus.AutoPaused, () => {
				player.stop();
				subscription.unsubscribe();
			});

			const embed = new Discord.MessageEmbed()
			.setDescription(text)
			.setColor(message.member.displayHexColor || "#000000")
			.setFooter(`Sent by ${message.user.username}`)
			.setTimestamp()
			return message.reply({embeds: [embed]});
		} catch (error) {
			return message.reply("An error occured. This usually happens when a message is too long or has lots of emojis.");
		}
  }
};
