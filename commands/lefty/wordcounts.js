const mongoose = require("mongoose"); //database library
const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model

module.exports = {
    name: 'wordcounts', // The name of the command
    aliases: ['words','counts','wordcount'],
    description: 'Shows a table with the counts of how much a user has said different words. Only displays counts for default words.', // The description of the command (for help text)
    perms: 'user',
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

      if (userID == message.client.user.id) {
        const randomword = config.default_words[Math.floor(config.default_words.length*Math.random())];
        return message.reply(`Wow! The data for <@${userID}> is off the charts! They've said "${randomword}" over one trillion times!`);
      }

      const data = await Users.findById(userID).exec();

      // get array of all words said
      const words = data && data.wordcounts ? [...data.wordcounts.keys()] : [];
      if (words.length == 0) {
        return message.reply(`No word data found for <@${userID}>. Make sure you properly pinged them or parsed their user ID as an argument. Otherwise, maybe they're just not very based.`);
      }

      // filter word array down to only the default words and words the user has chosen
      const mainwords = words.filter(w=>config.default_words.includes(w)||(data.counts && data.counts.includes(w)));
      if (mainwords.length == 0) {
        return message.reply(`No notable word data found for <@${userID}>. Maybe they're just not very based.`);
      }

      // format the data for a reply
      const reply = mainwords.sort((a,b)=>data.wordcounts.get(b) - data.wordcounts.get(a)).reduce((string,word)=>{
        return string + word + " - " + data.wordcounts.get(word) + "\n";
      },"```\n") + "```";
      message.channel.send(`<@${userID}>'s wordcounts:\n`+reply);
    },
};
