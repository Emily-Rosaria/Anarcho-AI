const mongoose = require("mongoose"); //database library
const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Docs = require("./../../database/models/documents.js"); // users model
const Discord = require('discord.js'); // Embed stuff

module.exports = {
    name: 'doc', // The name of the command
    aliases: ['doc','postdoc','senddoc','saydoc','note','postnote','saynote','sendnote','pasta','copypasta','sendpasta','postpasta','saypasta'],
    description: 'Posts a previously created text document.', // The description of the command (for help text)
    perms: 'user',
    group: 'fun',
    allowDM: true,
    args: true,
    usage: '<doc-name>', // Help text to explain how to use the command (if it had any arguments)
    async execute(message, args) {
      var userID = message.author.id;

      var title = args.join(" ").trim().toLowerCase();

      const data = await Users.findById({_id: message.author.id}).exec();

      function sendDoc(doc) {
        const embed = new Discord.MessageEmbed()
        if (doc.image && (doc.content == doc.image || !doc.content)) {
          embed.setImage(doc.image);
          return message.channel.send({embeds: [embed]});
        } else if (!doc.image && doc.content) {
          return message.channel.send({content: doc.content,allowedMentions: { repliedUser: false }});
        } else if (doc.image && doc.content) {
          embed.setImage(doc.image);
          return message.channel.send({content: doc.content,embeds: [embed], allowedMentions: { repliedUser: false }});
        }

        return message.reply("Error with the database. Document format was invalid.");
      }

      // search database for docs from other users
      if (!data || !data.documents || !data.documents.has(title)) {
        Docs.find({name: title}, (err,docs)=>{
          if (err || !docs || docs.length == 0) {
            return message.reply(`No saved document found with that name in the database. You'll need to create your own with the \`+newdoc\` command.`);
          }
          let index = Math.floor(docs.length * Math.random());
          const doc = docs[index];
          if (doc.content || doc.image) {
            return sendDoc (doc);
          } else {
            return message.reply("Error with the database. No document content.");
          }
        });
        return;
      }

      Docs.findById({_id: data.documents.get(title)}, (err,doc)=>{
        if (err || !doc) {
          return message.reply("Error with the database. Document could not be found.");
          if (err) {console.error(err);}
        }
        if (doc.content || doc.image) {
          return sendDoc (doc);
        } else {
          return message.reply("Error with the database. No document content.");
        }
      });
    },
};
