const i18n = require("../util/i18n");
const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
	.setName("ping")
	.setDescription(i18n.__("ping.description"));

module.exports = {
  name: "ping",
  data: data,
  cooldown: 10,
  description: i18n.__("ping.description"),
  execute(message) {
    message
      .reply(i18n.__mf("ping.result", { ping: Math.round(message.client.ws.ping) }))
      .catch(console.error);
  }
};
