const mongoose = require("mongoose"); // Import mongoose library
const Schema = mongoose.Schema; // Define Schema method
const config = require("./../../config.json");

// Schema
var UserSchema = new Schema({ // Create Schema
  _id: {type: String, required: true}, // ID of user on Discord
  wordcounts: {
    type: Map,  // key-value pairs of a string (word/phrase)
    of: Number // and a number (how many times it's said)
  },
  documents: {
    type: Map,  // key-value pairs of a string (that invokes the command)
    of: String // and a string (what the bot will say when the command is invoked)
  },
  count: [String], // array of other words to count under wordcounts
  last: Number, // last message date unix
});

UserSchema.virtual('id').get(function() {
  return this._id;
});

// Model
var users = mongoose.model("users", UserSchema); // Create collection model from schema
module.exports = users; // export model
