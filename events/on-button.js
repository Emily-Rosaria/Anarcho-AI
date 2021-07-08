module.exports = {
  name: "onButton",
  async event(button) {
    const client = button.client;
    const clicked = client.buttons.get(button.id) || client.buttons.find(btn => btn.aliases && btn.aliases.includes(button.id));
    if (clicked) {
      return clicked.click(button);
    }
  },
};
