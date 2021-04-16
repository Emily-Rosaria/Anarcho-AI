const mongoose = require("mongoose"); //database library
const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model

module.exports = {
    name: 'say', // The name of the command
    description: 'Says stuff in a channel.', // The description of the command (for help text)
    perms: 'dev',
    allowDM: true,
    usage: '<channelID> <message-text>', // Help text to explain how to use the command (if it had any arguments)
    args: 2,
    execute(message, args) {
      var channelID = args[0];
      const contentArr = message.content.split(/" "/);
      contentArr.shift();
      const content = contentArr.join(" ");

      // get channel
      message.client.channels.fetch(channelID).then(c=>{
        c.send(content);
      }).catch((err)=>console.log(err));
    },
};
