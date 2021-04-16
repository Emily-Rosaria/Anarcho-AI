const mongoose = require("mongoose"); //database library
const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Discord = require('discord.js'); // Embed stuff

function getRankNumber(n) {
  if (isNaN(n) || !n || n<1) {
    return "unranked";
  }
  const s = ["th", "st", "nd", "rd"];
  return n + (s[n % 10] || s[0]);
}

module.exports = {
    name: 'leaderboard', // The name of the command
    aliases: ['leaderboards','topwords','lb','wordrank','wordranks','rank','ranks','ranking','rankings'],
    description: 'Shows a table with the counts of how much every user has said a certain word.', // The description of the command (for help text)
    perms: 'user',
    args: 1,
    allowDM: true,
    usage: '<word> [page-number]', // Help text to explain how to use the command (if it had any arguments)
    async execute(message, args) {
      const word = args[0].toLowerCase().replace(/<:([^\s:]+):\d{17,23}>/g, "$1").replace(/[^\w\s'-]/g, "");

      const query = {};
      //get query field
      query["wordcounts."+word] = {"$gte":1};
      query.bot = {"$ne":true}; // hide bots by default
      const data = await Users.find(query).exec();

      if (!data || data.length == 0) {
        return message.reply(`No users have been recorded to have said ${word}. Note that words shorter than 3 letters aren't logged, and most symbols and capitalisation is removed.`);
      }

      //map data so we only have what we need, and then sort it
      const leaderboard = data.map(d=>{
        const obj = {};
        obj.count = d.wordcounts.get(word);
        obj.userID = d._id;
        return obj;
      }).sort((a,b)=>b.count-a.count);

      var pages = [];
      const pagecount = Math.ceil(leaderboard.length/10);

      // get an array of "message" text for each leaderboard page
      for (var i = 0; i<pagecount; i++) {
        var page = "";
        let cap = 10;
        if (i+1 == pagecount) {
          cap = leaderboard.length - i*10;
        }
        for (var j = 0; j<cap; j++) {
          const usernum = (i*10)+j+1;
          page = page + "**" + usernum + ".** " + "<@" + leaderboard[(i*10)+j].userID + "> • `" + leaderboard[(i*10)+j].count + "`\n";
        }
        pages.push(page.trim());
      }

      var ranktext = `Your leaderboard rank: ${getRankNumber(-1)}`;

      const userScore = leaderboard.find((e,i)=>{
        if (e.userID == message.author.id) {
          ranktext = `Your leaderboard rank: ${getRankNumber(i+1)}`;
          return true;
        }
      });

      // get the guild's data
      var client = message.client;
      var guild = await client.guilds.resolve(config.guild);
      if (!guild || !guild.name) {
        guild = {};
        guild.name = client.user.name;
        guild.iconURL = (options) => client.user.displayAvatarURL(options);
      }

      // pagenum is one less than the actual page number, as it's the array index
      const getEmbed = (pagenum) => {
        const embed = new Discord.MessageEmbed()
        .setColor('#dc1414')
        .setAuthor(`${guild.name}'s Rankings: "${word}"`,guild.iconURL({format:"png",size:64,dynamic:true}))
        .setDescription(pages[pagenum])
        if (pagecount == 1) {
          embed.setFooter(`${ranktext}`);
          return embed;
        } else {
          embed.setFooter(`Page ${pagenum+1}/${pagecount} • ${ranktext}`);
          return embed;
        }
      }

      // get initial page number, set to 1 unless a valid input is given, if an input is given then shift it within the bounds [1,pagecount].
      var currentPage = args.length > 1 && !isNaN(args[1]) ? Math.floor(args[1]) : 1;
      currentPage = Math.max(1,Math.min(currentPage,pagecount));

      // subtract 1 so it matches the array index
      currentPage = currentPage - 1;

      // post leaderboard embed
      var msg = await message.channel.send(getEmbed(currentPage));

      // don't add reacts or anything if there's no other pages
      if (pagecount < 2) {
        return;
      }

      await msg.react('⬅️').then(()=>msg.react('➡️')).catch(()=>message.reply("Failed to post the full leaderboard. Do I have permission to add reactions and post embeds in this channel?"));

      let cooldown = 0;

      const filter = (r, u) => {
        if (!(['⬅️', '➡️'].includes(r.emoji.name) && u.id === message.author.id)) {return false}
        if (cooldown + 400 > (new Date()).getTime()) {return false}
        if (r.message.id != msg.id) {return false;}
        cooldown = (new Date()).getTime();
        return true;
      };

      const collector = msg.createReactionCollector(filter, { idle: 300000, dispose: true });

      const right = async (pg) => {
        let newPage =  (((pg+1) % pagecount ) + pagecount ) % pagecount;
        embed = getEmbed(newPage);
        msg.edit(embed);
        return newPage;
      }

      const left = async (pg) => {
        let newPage =  (((pg-1) % pagecount ) + pagecount ) % pagecount;
        embed = getEmbed(newPage);
        msg.edit(embed);
        return newPage;
      }

      collector.on('collect', async (r, u) => {
        if (['⬅️'].includes(r.emoji.name)) {currentPage = await left(currentPage)}
        if (['➡️'].includes(r.emoji.name)) {currentPage = await right(currentPage)}
      });

      collector.on('remove', async (r) => {
        if (['⬅️'].includes(r.emoji.name)) {currentPage = await left(currentPage)}
        if (['➡️'].includes(r.emoji.name)) {currentPage = await right(currentPage)}
      });
    },
};
