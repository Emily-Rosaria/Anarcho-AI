const mongoose = require("mongoose"); //database library
const config = require('./../config.json'); // load bot config
const Users = require("./../database/models/users.js"); // users model
const Messages = require("./../database/models/messages.js"); // messages model

module.exports = {
  name: "onWordcount",
  async event(message) {

    var options = { upsert: true, new: true, setDefaultsOnInsert: true };
    const now = new Date();

    const oldUserData = await Users.findOneAndUpdate({_id: message.author.id},{last:now.getTime()},options).exec();

    var words = !oldUserData.counts ? [] : oldUserData.counts;
    words = words.concat(config.default_words).map(w=>w.toLowerCase());

    var counts = message.content.replace(/[^\w\s]/g, "").split(/\s+/).reduce((map, word)=>{
      const newWord = word.toLowerCase();
      const newMap = map;
      if (words.includes(newWord)) {
        newMap["wordcounts."+newWord] = (newMap["wordcounts."+newWord]||0)+1;
      }
      return newMap;
    }, {});

    await Messages.create({
      _id: message.id,
      author: message.author.id,
      channel: message.channel.id,
      counts, // already prefixed with wordcounts
      timestamp: message.createdAt.getTime()
    });

    if (Object.keys(counts).length == 0) {
      return; //no change to user word counts
    }

    var update = {"$inc": counts};

    // update user word counts
    const newUserData = await Users.findOneAndUpdate({_id: message.author.id},update).exec();
  },
};
