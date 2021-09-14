module.exports = {
  name: "onButton",
  async event(button) {
    const client = button.client;
    const clicked = client.buttons.get(button.customId) || client.buttons.find(btn => (btn.aliases && btn.aliases.includes(button.customId)) || (btn.prefix && button.customId.startsWith(btn.prefix)));
    if (clicked) {
      return clicked.click(button);
    }
  },
};
