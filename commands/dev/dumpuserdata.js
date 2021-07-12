const mongoose = require("mongoose"); //database library
const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model

module.exports = {
    name: 'dumpuserdata', // The name of the command
    description: 'Dumps wordcounts in the console.', // The description of the command (for help text)
    aliases: ['dumpdata','dumpwords'],
    perms: 'dev',
    group: 'dev',
    allowDM: true,
    usage: '[@user]', // Help text to explain how to use the command (if it had any arguments)
    async execute(message, args) {
      var userID = message.author.id;
      if (args.length > 0) {
        const tempID = args[0].match(/\d{17,23}/);
        if (tempID && tempID.length > 0) {
          userID = tempID[0];
        }
      }
      const data = await Users.findById(userID).exec();

      // get array of all words said
      const words = data && data.wordcounts ? [...data.wordcounts.keys()] : [];
      if (words.length == 0) {
        return message.reply(`No word data found for <@${userID}>. Make sure you properly pinged them or parsed their user ID as an argument. Otherwise, maybe they're just not very based.`);
      }

      // format the data for a reply
      const reply = words.sort((a,b)=>data.wordcounts.get(b) - data.wordcounts.get(a)).reduce((string,word)=>{
        return string + word + " - " + data.wordcounts.get(word) + "\n";
      },"```\n") + "```";
      message.channel.send((`<@${userID}>'s wordcounts:\n`+reply).split("\n"), { split: true });
    },
};
