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
			return message.reply({content: "The clip library is work in progress. Send `.mp3`, `.ogg`, or other short sound clips to `@Dabony#0001` to have them added to the bot.\n"+`> ${clips.join(", ")}`,ephemeral: true}).catch(console.error);
    });
  }
};