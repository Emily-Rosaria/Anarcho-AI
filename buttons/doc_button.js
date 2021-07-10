const mongoose = require("mongoose"); //database library
const config = require('./../config.json'); // load bot config
const Users = require("./../database/models/users.js"); // users model
const Docs = require("./../database/models/documents.js"); // users model

module.exports = {
  name: "doc_button",
  prefix: "doc_",
  async click(button) {

    const bArgs = button.id.split('_').slice(1);
    const uID = bArgs.pop();
    const title = bArgs.join('_');

    const data = await Users.findById({_id: uID}).exec();

    // search database for docs from other users
    if (!data || !data.documents || !data.documents.has(title)) {
      Docs.find({name: title}, (err,docs)=>{
        if (err || !docs || docs.length == 0) {
          return button.reply.send(`No saved document found with that name in the database. You'll need to create your own with the \`+newdoc ""${title}"\` command for this button to work.`,true);
        }
        let index = Math.floor(docs.length * Math.random());
        const doc = docs[index];
        if (doc.content) {
          return button.reply.send(doc.content,true);
        }
      });
      return;
    }

    Docs.findById({_id: data.documents.get(title)}, (err,doc)=>{
      if (err || !doc) {
        return button.reply.send("Error with the database. Document could not be found.",true);
        if (err) {console.error(err);}
      }
      if (doc.content) {
        return button.reply.send(doc.content,true);
      } else {
        return button.reply.send("Error with the database. No document content.",true);
      }
    });
  },
};
