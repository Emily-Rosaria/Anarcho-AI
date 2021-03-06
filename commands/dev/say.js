const mongoose = require("mongoose"); //database library
const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model

module.exports = {
    name: 'say', // The name of the command
    description: 'Says stuff in a channel. Use type `@{username}` within the message and the bot will replace it with a user ping if it can find a user with that rough name or ID.', // The description of the command (for help text)
    group: 'dev',
    perms: 'dev',
    allowDM: true,
    usage: '<channelID|channel-mention|channel-name> <message-text>', // Help text to explain how to use the command (if it had any arguments)
    args: 2,
    execute(message, args) {
      var message_text = message.content //.replace(/^\S+ +/,"");
      //var channel = message_text.match(/^("[^"]+"|\S+) +/g).trim();
      const re = new RegExp("^.*"+args[0]+" +");
      message_text = message_text.replace(re,"").trim();

      let channelID = args[0].match(/\d{15,23}/g);
      if (channelID && channelID[0] && Number(channelID[0]) < Number(message.id)) {
        channel = channelID[0];
      }

      // get channel
      message.client.channels.fetch(channelID).then(c=>{
        if (!c) {
          return message.react('❌')
        }
        if (!c.permissionsFor(message.client.user.id).has('SEND_MESSAGES')) {
          return message.reply("No perms :(")
        }
        c.send({content: message_text});
        message.react('✅')
      }).catch((err)=>console.log(err));
    },
};
