const ytdl = require("ytdl-core-discord");
const scdl = require("soundcloud-downloader").default;
const { canModifyQueue, STAY_TIME } = require("../util/Util");
const i18n = require("../util/i18n");
const {
	AudioPlayerStatus,
  VoiceConnectionStatus,
	StreamType,
	createAudioPlayer,
	createAudioResource,
	joinVoiceChannel
} = require('@discordjs/voice');


module.exports = {
  async play(song, interaction) {
    const { SOUNDCLOUD_CLIENT_ID } = require("../util/Util");

    let config = require("./../../config.json");

    const PRUNING = config.music.PRUNING || false;

    const queue = interaction.client.queue.get(interaction.guildId);
    const connection = getVoiceConnection(interaction.guildId);

    if (!song) {
      setTimeout(function () {
        if (AudioPlayerStatus.Idle && interaction.guild.me.voice.channel) {
          getVoiceConnection(interaction.guildId).destroy();
        }
      }, STAY_TIME * 1000);
      !PRUNING && queue.textChannel.send(i18n.__("play.queueEnded")).catch(console.error);
      return interaction.client.queue.delete(interaction.guild.id);
    }

    let stream = null;
    let streamType = song.url.includes("youtube.com") ? "opus" : "ogg/opus";

    try {
      if (song.url.includes("youtube.com")) {
        stream = await ytdl(song.url, { filter: 'audioonly' });
      } else if (song.url.includes("soundcloud.com")) {
        try {
          stream = await scdl.downloadFormat(song.url, scdl.FORMATS.OPUS, SOUNDCLOUD_CLIENT_ID);
        } catch (error) {
          stream = await scdl.downloadFormat(song.url, scdl.FORMATS.MP3, SOUNDCLOUD_CLIENT_ID);
          streamType = "unknown";
        }
      }
    } catch (error) {
      if (queue) {
        queue.songs.shift();
        module.exports.play(queue.songs[0], interaction);
      }

      console.error(error);
      return interaction.channel.send(
        i18n.__mf("play.queueError", { error: error.message ? error.message : error })
      );
    }

    connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
    	try {
    		await Promise.race([
    			entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
    			entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
    		]);
    		// Seems to be reconnecting to a new channel - ignore disconnect
    	} catch (error) {
    		interaction.client.queue.delete(interaction.guild.id);
    		connection.destroy();
    	}
    });

    const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
    const player = createAudioPlayer();

    player.play(resource);
    connection.subscribe(player);


    const dispatcher = queue.connection
      .play(stream, { type: streamType })
      .on("finish", () => {
        if (collector && !collector.ended) collector.stop();

        queue.connection.removeAllListeners("disconnect");

        if (queue.loop) {
          // if loop is on, push the song back at the end of the queue
          // so it can repeat endlessly
          let lastSong = queue.songs.shift();
          queue.songs.push(lastSong);
          module.exports.play(queue.songs[0], interaction);
        } else {
          // Recursively play the next song
          queue.songs.shift();
          module.exports.play(queue.songs[0], interaction);
        }
      })
      .on("error", (err) => {
        console.error(err);
        queue.songs.shift();
        module.exports.play(queue.songs[0], interaction);
      });
    dispatcher.setVolumeLogarithmic(queue.volume / 100);

    try {
      var playingMessage = await queue.textChannel.send(
        i18n.__mf("play.startedPlaying", { title: song.title, url: song.url })
      );
      await playingMessage.react("⏭");
      await playingMessage.react("⏯");
      await playingMessage.react("🔇");
      await playingMessage.react("🔉");
      await playingMessage.react("🔊");
      await playingMessage.react("🔁");
      await playingMessage.react("⏹");
    } catch (error) {
      console.error(error);
    }

    const filter = (reaction, user) => user.id !== interaction.client.user.id;
    var collector = playingMessage.createReactionCollector(filter, {
      time: song.duration > 0 ? song.duration * 1000 : 600000
    });

    collector.on("collect", (reaction, user) => {
      if (!queue) return;
      const member = interaction.guild.member(user);

      switch (reaction.emoji.name) {
        case "⏭":
          queue.playing = true;
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
          queue.connection.dispatcher.end();
          queue.textChannel.send(i18n.__mf("play.skipSong", { author: user })).catch(console.error);
          collector.stop();
          break;

        case "⏯":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
          if (queue.playing) {
            queue.playing = !queue.playing;
            queue.connection.dispatcher.pause(true);
            queue.textChannel.send(i18n.__mf("play.pauseSong", { author: user })).catch(console.error);
          } else {
            queue.playing = !queue.playing;
            queue.connection.dispatcher.resume();
            queue.textChannel.send(i18n.__mf("play.resumeSong", { author: user })).catch(console.error);
          }
          break;

        case "🔇":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
          queue.muted = !queue.muted;
          if (queue.muted) {
            queue.connection.dispatcher.setVolumeLogarithmic(0);
            queue.textChannel.send(i18n.__mf("play.mutedSong", { author: user })).catch(console.error);
          } else {
            queue.connection.dispatcher.setVolumeLogarithmic(queue.volume / 100);
            queue.textChannel.send(i18n.__mf("play.unmutedSong", { author: user })).catch(console.error);
          }
          break;

        case "🔉":
          reaction.users.remove(user).catch(console.error);
          if (queue.volume == 0) return;
          if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
          queue.volume = Math.max(queue.volume - 10, 0);
          queue.connection.dispatcher.setVolumeLogarithmic(queue.volume / 100);
          queue.textChannel
            .send(i18n.__mf("play.decreasedVolume", { author: user, volume: queue.volume }))
            .catch(console.error);
          break;

        case "🔊":
          reaction.users.remove(user).catch(console.error);
          if (queue.volume == 100) return;
          if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
          queue.volume = Math.min(queue.volume + 10, 100);
          queue.connection.dispatcher.setVolumeLogarithmic(queue.volume / 100);
          queue.textChannel
            .send(i18n.__mf("play.increasedVolume", { author: user, volume: queue.volume }))
            .catch(console.error);
          break;

        case "🔁":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
          queue.loop = !queue.loop;
          queue.textChannel
            .send(
              i18n.__mf("play.loopSong", {
                author: user,
                loop: queue.loop ? i18n.__("common.on") : i18n.__("common.off")
              })
            )
            .catch(console.error);
          break;

        case "⏹":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
          queue.songs = [];
          queue.textChannel.send(i18n.__mf("play.stopSong", { author: user })).catch(console.error);
          try {
            queue.connection.dispatcher.end();
          } catch (error) {
            console.error(error);
            queue.connection.disconnect();
          }
          collector.stop();
          break;

        default:
          reaction.users.remove(user).catch(console.error);
          break;
      }
    });

    collector.on("end", () => {
      playingMessage.reactions.removeAll().catch(console.error);
      if (PRUNING && playingMessage && !playingMessage.deleted) {
        playingMessage.delete({ timeout: 3000 }).catch(console.error);
      }
    });
  }
};
