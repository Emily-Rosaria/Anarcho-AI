const mongoose = require("mongoose"); //database library
const config = require('./../../config.json'); // load bot config
const Docs = require("./../../database/models/documents.js"); // users model
const Discord = require('discord.js'); // Embed stuff

module.exports = {
    name: 'doclist', // The name of the command
    aliases: ['mydocs','listdoc','listdocs'],
    description: 'Lists the names of a user\'s saved documents.', // The description of the command (for help text)
    perms: 'user',
    allowDM: true,
    args: false,
    usage: '[@user|all] [a(alphabetical)|t(timestamp)|p(popular)] [+(accending)|-(descending)] [r(repeats)] [page-number]', // Help text to explain how to use the command (if it had any arguments)
    async execute(message, args) {

      let uID = message.author.id;
      let sort = null;
      let order = 0;
      let repeats = false;
      let pageArg = 1;

      if (args && args.length > 0) {
        const temp = args.slice(0,4).map(a=>a.toLowerCase().replace(/[()[\]]/g,''));
        for (var i = 0; i < args.length; i++) {
          const tempArg = temp.shift();
          const tempID = tempArg.match(/(<@)?!?\d{17,24}>?/);
          if (tempID) {
            uID = tempID[0];
          }
          if (tempArg=='all') {
            uID = 'all';
          }
          if (tempArg.startsWith('a') && !tempArg.startsWith('acc')) {
            sort = "name";
          }
          if (tempArg.startsWith('t')) {
            sort = "time";
          }
          if (tempArg.startsWith('p')) {
            sort = "popular";
          }
          if (tempArg.startsWith('acc') || tempArg.startsWith('+')) {
            order = 1;
          }
          if (tempArg.startsWith('dec') || tempArg.startsWith('-')) {
            order = -1;
          }
          if (tempArg.startsWith('r')) {
            repeats = true;
          }
          const tempNum = Number(tempArg);
          if (!isNaN(tempArg) && tempNum < 100000 && tempNum > 1) {
            pageArg = Math.floor(tempNum);
          }
        }
      }

      let query = {};
      if (uID != 'all') {
        query.user = uID;
        if (sort == 'popular' || sort == null) {
          sort = 'time';
        }
        repeats = false;
      } else {
        if (sort == null) {
          sort = 'name';
        }
      }

      if (sort == 'time') {
        repeats = true;
      } else if (sort == 'popular') {
        repeats = false;
      }

      if (order = 0) {
        if (sort = 'time' || sort = 'popular') {
          order = -1;
        } else {
          order = 1;
        }
      }

      const data = await Docs.find(query).exec();

      if (!data || data.length == 0) {
        if (uID == 'all') {
          return message.reply(`No documents were able to be found. Was there a database error?`);
        }
        if (uID == message.user.id) {
          return message.reply(`You have no documents saved. Use the \`+newdoc\` command to create some. Or, use \`+doclist all\` to see documents from other users.`);
        }
        return message.reply(`This user has no saved documents. Make sure you either pinged/mentioned them, or used their userID in the command arguments.`);
      }

      //map data so we only have what we need, and then sort it
      let documents = data.map(d=>{
        const obj = {};
        obj.name = d.name;
        obj.user = d.user;
        obj.id = Number(d._id);
        return obj;
      });

      let counts = {};

      if (uID == 'all' && !repeats) {
        // get number of each object
        counts = documents.reduce((map, title)=>{
          const newMap = map;
          newMap[title] = (newMap[title]||0)+1;
          return newMap;
        }, {});
      }

      if (sort && sort != null) {
        if (sort == 'name' || sort == 'popular') {
          documents = documents.sort((objA,objB) => {
            const textA = objA.name.toUpperCase();
            const textB = objB.name.toUpperCase();
            return (textA < textB) ? -(order) : (textA > textB) ? order : 0;
          });
          if (!repeats || sort == 'popular') {
            let lastName = "";
            documents = documents.reduce((acc,cur) => {
              if (cur.name == lastName) {
                return acc;
              }
              lastName = cur.name;
              return acc.concat(cur);
            },[]).map((obj)=>{
              const tempObj = {};
              tempObj.count = counts[obj.name];
              tempObj.name = obj.name;
              return tempObj;
            });
            if (sort == 'popular') {
              documents = documents.map((d,i)=>[d,i]).sort((objA,objB)=>{
                if (objA[0].count != objB[0].count) {
                  return (objA[0].count - objB[0].count)*order;
                }
                return objA[1] - objB[1];
              }).map(d=>d[0]);
            }
          }
        } else if (sort == 'time') {
          documents = documents.sort((objA,objB) => {
            return (objA.id - objB.id)*order;
          });
        }
      } else {
        return message.reply("Sorting method undefined.");
      }

      var pages = [];

      const pagecount = Math.ceil(documents.length/20);

      // get an array of "message" text for each leaderboard page
      for (var i = 0; i<pagecount; i++) {
        var page = "";
        let cap = 20;
        if (i+1 == pagecount) {
          cap = documents.length - i*20;
        }
        for (var j = 0; j<cap; j++) {
          const index = (i*20)+j+1;
          const userText = uID != 'all' ? "" : repeats ? " • <@" + documents[(i*20)+j].user + ">" : " (" + documents[(i*20)+j].count + " users)";
          page = page + "**" + index + ".** " + documents[(i*20)+j].name + userText + "\n";
        }
        pages.push(page.trim());
      }

      // get the guild's data
      const client = message.client;
      let userData = {};
      if (uID == 'all') {
        userData.name = client.user.username;
        userData.iconURL = client.user.displayAvatarURL({format:"png",size:64,dynamic:true});
      } else if (uID == message.author.id) {
        userData.name = message.author.username;
        userData.iconURL = message.author.displayAvatarURL({format:"png",size:64,dynamic:true});
      } else {
        const user = await client.users.fetch(uID);
        userData.name = user.username;
        userData.iconURL = user.displayAvatarURL({format:"png",size:64,dynamic:true});
      }


      // pagenum is one less than the actual page number, as it's the array index
      const getEmbed = (pagenum) => {
        const embed = new Discord.MessageEmbed()
        .setColor('#dc1414')
        .setAuthor(`${userData.name}'s Documents`,userData.iconURL)
        const lines = pages[pagenum].split('\n');
        if (lines.length > 10) {
          embed.addField('\u200b',lines.slice(0, 10).join('\n'),true).addField('\u200b',lines.slice(10-lines.length).join('\n'),true);
        } else {
          embed.setDescription(pages[pagenum]);
        }
        if (pagecount == 1) {
          embed.setFooter(`${documents.length} Documents`);
          return embed;
        } else {
          embed.setFooter(`Page ${pagenum+1}/${pagecount} • ${documents.length} Documents`);
          return embed;
        }
      }

      // get initial page number, which is a positive integer, if an input is given then shift it within the bounds [1,pagecount].
      var currentPage = pageArg;
      currentPage = Math.max(1,Math.min(currentPage,pagecount));

      // subtract 1 so it matches the array index
      currentPage = currentPage - 1;

      // post doc embed
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
