module.exports = {
  name: "onBump",
  async event(message) {
    if (message.interaction && message.interaction.commandName && message.interaction.commandName == "bump" && message.interaction.user && message.interaction.user.id) {
      message.client.bumpPings.set(""+message.interaction.user.id,(new Date()).getTime());
      message.react("👍");
    }
  },
};
