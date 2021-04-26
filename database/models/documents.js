const mongoose = require("mongoose"); // Import mongoose library
const Schema = mongoose.Schema; // Define Schema method

// Schema
var DocumentSchema = new Schema({
  _id: {type: String, required: true}, // the "id" of the document, the same as the ID of the discord message that created it
  name: {type: String, required: true}, // content "title"
  content: {type: String, required: true}, // content to post
  user: {type: String, required: true}, // user ID of doc creator
  image: {type: String, default: ""} // url of image link, if any
});


// Model
var documents = mongoose.model("documents", DocumentSchema); // Create collection model from schema
module.exports = documents; // export model
