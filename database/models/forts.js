const mongoose = require("mongoose"); // Import mongoose library
const Schema = mongoose.Schema; // Define Schema method
const config = require("./../../config.json");

var BuildingsSchema = new Schema({
  type: {type: String, required: true}
});

var UpgradeSchema = new Schema({

});

// Schema for map tiles
var FortsSchema = new Schema({ // Create Schema
  owner: {type: String, required: true}, // ID of user on Discord
  safe: {type: Number, default: 0}, // timestamp of when the fort's safety will expire
  buildings: [],
  upgrades: {
    type: Map, // string - number pairs of upgrades and upgrade rank
    of: Number
  },
  soldiers: {},
  x: {type: Number, required: true}, // x from 0 to 127, int
  y: {type: Number, required: true} // y from 0 to 127, int
});

UserSchema.virtual('id').get(function() {
  return this._id;
});

// Model
var tiles = mongoose.model("forts", FortsSchema); // Create collection model from schema
module.exports = tiles; // export model
