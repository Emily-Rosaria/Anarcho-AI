const mongoose = require("mongoose"); // Import mongoose library
const Schema = mongoose.Schema; // Define Schema method

// Schema
var StarSchema = new Schema({
  _id: {type: String, required: true}, // ID of the message that was posted,
  starID: {type: String, required: true}, // ID of the starboard message
  author: {type: String, required: true}, // ID of the author that posted the message
  channel: {type: String, required: true}, // ID of the channel the message was posted in
  content: {type: String}, // the text content of the message
  attachments: {type: [String]}, // the URL to any attachments or images
  voters: {type: [String], required: true}, // an array of the discord IDs of distinct users who have reacted to the message with valid reactions
  reacts: {
    type: Map,
    of: Number
  }, // map of emotes and how many of them were used
  timestamp: {type: String, required: true}, // timestamp of the message in unix ms
  deleted: {type: Boolean, default: false} // if the message has previously been starred
});

// Model
var starred = mongoose.model("starred", StarSchema); // Create collection model from schema
module.exports = starred; // export model
