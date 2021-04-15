const mongoose = require("mongoose"); //database library
const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Messages = require("./../../database/models/messages.js"); // messages model


module.exports = {
    name: 'wordcounts', // The name of the command
    aliases: ['words','counts','wordlist','userwords','wordtable','wordcount'],
    description: 'Shows a table with the counts of how much a user has said different words.', // The description of the command (for help text)
    perms: 'user', 
    allowDM: true,
    usage: '[@user]', // Help text to explain how to use the command (if it had any arguments)
    async execute(message, args) {
      var userID = message.author.id;
      if (args.length > 0) {
        const tempID = args[0].match(/\d{17}\d+/);
        if (tempID && tempID.length > 0 && tempID[0].length < 23) {
          userID = tempID;
        }
      }
      const data = await Users.findById(userID).exec();
      const words = data && data.wordcounts ? [...data.wordcounts.keys()] : [];
      if (words.length == 0) {
        return message.reply(`No word counters found for <@${userID}>. Make sure you properly pinged them or parsed their user ID as an argument. Otherwise, maybe they're just not very based.`);
      }
      const reply = words.reduce((string,word)=>{
        return string + word + ": " + data.wordcounts.get(word) + "\n";
      },"");
      message.channel.send(`<@${userID}>'s wordcounts:\n`+reply);
    },
};
