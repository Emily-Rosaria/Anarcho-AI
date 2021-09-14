const mongoose = require("mongoose"); //database library
const config = require('./../../config.json'); // load bot config
const adjectives = require('./../../assets/adjectives.json');
const nouns = require('./../../assets/nouns.json');
const Discord = require('discord.js'); // Embed stuff
const Confess = require("./../../database/models/confess.js"); // users model

module.exports = {
    name: 'peek', // The name of the command
    aliases: ['spy','confesslog'],
    description: 'Shows who posted a confession.', // The description of the command (for help text)
    perms: 'dev',
    group: 'dev',
    allowDM: true,
    cooldown: 5,
    usage: '<message-id>', // Help text to explain how to use the command (if it had any arguments)
    async execute(message, args) {

      let id = "";

      if (message.reference && message.reference.messageID) {
        id = message.reference.messageID;
      } else if (args && args.length > 0) {
        id = args[0];
      } else {
        return message.reply("No ID argument found. Please reply to a confession or input the message ID of the confession as an argument.")
      }

      const data = await Confess.findById({_id: args[0]}).exec();
      if (data) {
        message.reply(`User: ${data.user} - <@${data.user}>\nMessage: ${data.content}`);
      } else {
        message.reply("No confession could be found with that ID.");
      }
    },
};
