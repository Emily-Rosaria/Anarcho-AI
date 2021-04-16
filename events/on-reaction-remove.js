const config = require('./../config.json'); // load bot config
const mongoose = require("mongoose"); //database library

module.exports = {
  name: "onReactionRemove",
  async event(reaction, user) {
    return;
  },
};
