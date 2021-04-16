const mongoose = require("mongoose"); //database library
const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model

module.exports = {
    name: 'wordscan', // The name of the command
    alaises: ['scanwords','getallwords'],
    description: 'Scans the server, then populates the word database based on wordcounts over the past 14 days.', // The description of the command (for help text)
    perms: 'dev',
    allowDM: false,
    usage: '', // Help text to explain how to use the command (if it had any arguments)
    async execute(message, args) {
      const oneDay = 24*60*60*1000;
      const now = (new Date()).getTime();
      await Users.deleteMany({});
      const onWordcount = message.client.events.get("onWordcount").event;
      var channels = message.guild.channels.cache.filter(c=>{
        if (c.type != "text" && c.type != "news") {
          return false;
        }
        if (!c.viewable) {
          return false;
        }
        if (!c.lastMessageID) {
          return false; // no last message
        }
        const perms = c.permissionsFor(message.client.user.id);
        if (perms && perms.has("READ_MESSAGE_HISTORY") && perms.has("VIEW_CHANNEL")) {
          return true;
        } else if (perms) {
          return false;
        }
        console.log("Could not get perms for <#"+c.name+">");
        return false;
      });
      message.reply(`Scanning through roughly 2 weeks of messages in ${channels.size} channels...`);
      let cNum = 1;
      channels.each((c)=>{
        let timestamp = now;
        let loops = 0;
        let lastMessage = c.lastMessageID;
        onWordcount(c.lastMessage);
        while (loops<25 && now < timestamp+14*oneDay) {
          var oldest = {time: timestamp, id: lastMessage};
          c.messages.fetch({limit:100, before: lastMessage}).then((msgs)=>{
            console.log(`Loop ${loops}/25: ${msgs.size} messages`);
            if (!msgs || msgs.size<1) {
              timestamp = 0; // set timestamp to be low so the loop ends
              return;
            }
            msgs.each(m=>{
              if (oldest>m.createdTimestamp) {
                oldest.time = m.createdTimestamp;
                oldest.id = m.id;
              }
              if (m.author.id == message.client.user.id) {
                return;
              }
              onWordcount(m);
            });
          }).catch((err)=>{
            console.error(err);
          });
          loops = loops+1;
          timestamp = oldest.timestamp;
          lastMessage = oldest.id;
          console.log(`Loop ${loops}/25: ${c.name}`)
        }
        console.log(`Finished: ${c.name} - ${cNum}/${channels.size}`);
        cNum = cNum + 1;
        if (cNum > channels.size) {
          message.reply("Finished! All messages over the last 2 weeks should be logged.");
          console.log("Done.");
        }
      });
    },
};
