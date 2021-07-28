const mongoose = require("mongoose"); // Import mongoose library
const Schema = mongoose.Schema; // Define Schema method

// Schema
var ConfessSchema = new Schema({
  _id: {type: String, required: true}, // the "id" of the document, the same as the ID of the discord message that sent it
  content: {type: String, required: true}, // content of the confession
  user: {type: String, required: true}, // user ID of doc creator
});

// Model
var confess = mongoose.model("confess", ConfessSchema); // Create collection model from schema
module.exports = confess; // export model
