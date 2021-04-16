const mongoose = require("mongoose"); //database library
const Users = require("./../database/models/users.js"); // users model
const Messages = require("./../database/models/messages.js"); // messages model

module.exports = {
  name: "onWordcount",
  async event(message) {

    if (!message || !message.content || !message.author || !message.author.id || message.content == "") {
      return;
    }

    var options = { upsert: true, setDefaultsOnInsert: true }; //new: true if new data needed after
    const now = new Date();

    // const oldUserData = await Users.findOneAndUpdate({_id: message.author.id},{last:now.getTime()},options).exec();

    // remove custom emotes from string, then remove pings of users/roles/channel mentions, then get any usable text from urls, then
    var counts = message.content.replace(/<:([^\s:]+):\d{17,23}>/g, "").replace(/<(@!?|#|@&)\d{17,23}>/g, "").replace(/(?:https?|ftp):\/\/(?:www\.)?([^\.\s\/]+)(?:\.([^\.\s\/]{4,}))?[^\s\/]+(?:\/([^\s\/]{3,})|\/[^\s\/]{1,2})?(?:\/([^\s\/]{3,}))?\S*/g, "$1 $2 $3 $4").replace(/[^\w\s]/g, "").split(/\s+/).reduce((map, word)=>{
      if (word.length < 3) {
        return map;
      }
      const newWord = word.toLowerCase();
      const newMap = map;
      newMap["wordcounts."+newWord] = (newMap["wordcounts."+newWord]||0)+1;
      return newMap;
    }, {});
    /*
    await Messages.create({
      _id: message.id,
      author: message.author.id,
      channel: message.channel.id,
      counts, // already prefixed with wordcounts
      timestamp: message.createdAt.getTime()
    });
    */
    if (Object.keys(counts).length == 0) {
      return; //no change to user word counts
    }

    var update = {"$inc": counts};

    // update user word counts
    const newUserData = await Users.findOneAndUpdate({_id: message.author.id},update,options).exec();
  },
};
