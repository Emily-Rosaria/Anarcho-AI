const mongoose = require("mongoose"); //database library
const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Docs = require("./../../database/models/documents.js"); // users model

module.exports = {
    name: 'doc', // The name of the command
    aliases: ['doc','postdoc','senddoc','saydoc','note','postnote','saynote','sendnote','pasta','copypasta','sendpasta','postpasta','saypasta'],
    description: 'Posts a previously created text document.', // The description of the command (for help text)
    perms: 'user',
    allowDM: true,
    args: true,
    usage: '<doc-name>', // Help text to explain how to use the command (if it had any arguments)
    async execute(message, args) {
      var userID = message.author.id;

      var title = args.join(" ").trim().toLowerCase();

      const data = await Users.findById({_id: message.author.id}).exec();

      if (!data || !data.documents || !data.documents.has(title)) {
        return message.reply(`No saved document found with that name.`);
      }

      Docs.findById({_id: data.documents.get(title)}, (err,doc)=>{
        if (err || !doc) {
          return message.reply("Error with the database. Document could not be found.");
          if (err) {console.error(err);}
        }
        if (doc.content) {
          return message.channel.send(doc.content,{disableMentions:"all"});
        } else {
          return message.reply("Error with the database. No document content.");
        }
      });
    },
};
