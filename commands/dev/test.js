const mongoose = require("mongoose"); //database library
const Users = require("./../../database/models/users.js"); // users model
const Discord = require('discord.js'); // Image embed
const config = require('./../../config.json'); // load bot config
const fetch = require("node-fetch");

module.exports = {
    name: 'test', // The name of the command
    description: 'Test.', // The description of the command (for help text)
    group: 'dev',
    perms: 'dev',
    allowDM: true,
    async execute(message, args) {
      if (args.length > 0) {
        const res = await fetch(args[0]);
        const buff = await res.blob();
        console.log(buff.type);
      }
      console.log(message.embeds);
      console.log(message.attachments);
    },
};
