const i18n = require("../util/i18n");
const fs = require("fs");
const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
	.setName("clips")
	.setDescription(i18n.__("clips.description"));

module.exports = {
  name: "clips",
  data: data,
  description: i18n.__("clips.description"),
  execute(message) {
    fs.readdir("./sounds", function (err, files) {
      if (err) return console.log("Unable to read directory: " + err);

      let clips = [];

      files.forEach(function (file) {
        clips.push(file.substring(0, file.length - 4));
      });

      message.reply(`${clips.join(" ")}`).catch(console.error);
    });
  }
};
