
exports.canModifyQueue = (member) => {
  const { channelID } = member.voice;
  const botChannel = member.guild.voice.channelID;

  if (channelID !== botChannel) {
    return;
  }

  return true;
};

let config = require("./../../config.json");

exports.YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
exports.TOKEN = process.env.TOKEN;
// exports.SOUNDCLOUD_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;
exports.MAX_PLAYLIST_SIZE = config.music.MAX_PLAYLIST_SIZE || 10;
exports.PRUNING = config.music.PRUNING || false;
exports.STAY_TIME = config.music.STAY_TIME || 30;
exports.DEFAULT_VOLUME = config.music.DEFAULT_VOLUME || 100;
exports.LOCALE = config.music.LOCALE || "en";
exports.GUILD = config.guild;
