const Discord = require('discord.js'); // Loads the discord API library

const guildID = '775503679339495435';
const channelID = '829319769659408384';

module.exports = async function (client) {
  const now = new Date();
  const oneHour = 1000*60*60;

  var lastBumps = client.bumpPings;
  var latest = Math.max(...[...lastBumps.values()]);
  if (now.getTime() - latest < 2*oneHour) {
    return; // recent bump
  }
  if (client.bumpPings.get("0") == latest) {
    if (now.getTime() - latest < 6*oneHour) {
      return; // don't remind if the recent "bump" was just a spoof for a reminder, unless 6 hours have passed
    }
  }

  var guild = await client.guilds.resolve(guildID);
  var channel = await guild.channels.resolve(channelID);

  lastBumps.forEach((timestamp, uID) => {
    // keep
    if (uID == "0") {
      return;
    }
    //if (now.getTime() - timestamp > 5*oneHour) {
      client.bumpPings.delete(uID);
    //}
  });
  // make next reminder check will be in 2 hours unless someone bumps sooner
  client.bumpPings.set("0",now.getTime());

  channel.send({
    content:`Remember to bump the server with the \`/bump\` command.`,
    allowedMentions: {
      parse:["users"]
    }
  });
};
