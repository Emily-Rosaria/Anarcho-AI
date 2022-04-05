const i18n = require("../util/i18n");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { createAudioPlayer, VoiceConnectionStatus, AudioPlayerStatus, createAudioResource, joinVoiceChannel, getVoiceConnection, StreamType, demuxProbe } = require ('@discordjs/voice');
const fs = require("fs");
const path = require('path');
const Discord = require('discord.js'); // Image embed
const util = require('util');
const { Readable } = require('stream');


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

		const soundsPath = path.resolve(__dirname, '../sounds');

		async function probeAndCreateResource(readableStream) {
			const { stream, type } = await demuxProbe(readableStream);
			return createAudioResource(stream, { inputType: type });
		}

		async function createResource(file_path) {
			// Creates an audio resource with inputType = StreamType.Arbitrary
			const readStream = await probeAndCreateResource(fs.createReadStream(file_path));
			return readStream;
		}

    const { channel } = message.member.voice;

    const args = [message.options.getString('clip')];

    if (!args.length) return message.reply({content: i18n.__("clip.usagesReply"), ephemeral: true}).catch(console.error);

		const serverQueue = message.client.queue.get(message.guildId);

		if (!channel) return message.reply({content: i18n.__("play.errorNotChannel"),ephemeral: true}).catch(console.error);

		if (serverQueue && channel !== message.guild.me.voice.channel)
			return message
				.reply({content: i18n.__mf("play.errorNotInSameChannel", { user: message.client.user }),ephemeral: true})
				.catch(console.error);

		const permissions = channel.permissionsFor(message.client.user);
		if (!permissions.has("CONNECT")) return message.reply({content: i18n.__("play.missingPermissionConnect"),ephemeral: true});
		if (!permissions.has("SPEAK")) return message.reply({content: i18n.__("play.missingPermissionSpeak"),ephemeral: true});

		let clip = args[0].toLowerCase().trim().replace(/ +/g,"_");

		fs.readdir(soundsPath, function (err, files) {
      if (err) return console.log("Unable to read directory: " + err);

      const clips = files.filter(file => file.substring(0, file.length - 4).toLowerCase() == clip);
			if (clips.length < 1) {
				return message.reply({content: "Your clip could not be found. The clip library is work in progress. Send `.mp3`, `.ogg`, or other short sound clips to `@Dabony#0001` to have them added to the bot.",ephemeral: true}).catch(console.error);
			} else if (clips.length > 1) {
				return message.reply({content: "An error occured. Multiple clips with that name were found, likely due to dupilcates with different file extensions.",ephemeral: true}).catch(console.error);
			}
			// found a clip
			clip = clips[0];

			try {
				var connection = getVoiceConnection(channel.guild.id);

				const player = createAudioPlayer();

				const sound = createResource(path.join(soundsPath,clip));

				function playClip(connection, player, sound) {
					const subscription = connection.subscribe(player);
					player.play(sound);

					player.once(AudioPlayerStatus.Idle, () => {
						player.stop();
						subscription.unsubscribe();
					});

					player.once(AudioPlayerStatus.AutoPaused, () => {
						player.stop();
						subscription.unsubscribe();
					});
				}

				if (!connection || (channel.guild.me.voice && channel.guild.me.voice.channel.id != channel.id)) {
					connection = joinVoiceChannel({
						channelId: channel.id,
						guildId: channel.guild.id,
						adapterCreator: channel.guild.voiceAdapterCreator,
					});
					connection.once(VoiceConnectionStatus.Ready, () => {
						playClip(connection, player, sound)
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
					playClip(connection, player, sound);
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
				.setDescription(`Playing Clip: ${clip.substring(0, clip.length - 4)}`)
				.setColor(message.member.displayHexColor || "#000000")
				.setFooter(`Requested by ${message.user.username}`)
				.setTimestamp()
				return message.reply({embeds: [embed]});
			} catch (error) {
				console.error(error);
				return message.reply({content:"There was an error while executing this command.",ephemeral: true});
			}
    });
  }
};
