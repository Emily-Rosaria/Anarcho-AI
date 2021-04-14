const mongoose = require("mongoose"); // Import mongoose library
const Schema = mongoose.Schema; // Define Schema method

// Schema
var MessageSchema = new Schema({
  _id: {type: String, required: true}, // ID of the message that was posted
  author: {type: String, required: true}, // ID of the author that posted the message
  channel: {type: String, required: true}, // ID of the channel the message was posted in
  wordcounts: {
    type: Map,  // key-value pairs of a string (word/phrase)
    of: Number // and a number (how many times it's said)
  },
  timestamp: {type: String, required: true} // timestamp of the message in unix ms
});

MessageSchema.statics.prune = async function (days) {
  const now = new Date().getTime();
  const time = !days || isNaN(days) ? 14 : Math.min(14,Math.max(1,Number(days)));
  const oneDay = 24*60*60*1000; // in ms
  const pastTimestamp = now - time*oneDay;
  const delet = await this.deleteMany({quest: false, "$lte": {timestamp: pastTimestamp}}).exec();
  return delet;
}

// Model
var messages = mongoose.model("messages", MessageSchema); // Create collection model from schema
module.exports = messages; // export model
