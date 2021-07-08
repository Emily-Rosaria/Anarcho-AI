module.exports = {
  name: "click_red",
  async click(button) {
    await button.reply.send(`You took the red pill, so that means you are based!`,true);
  },
};
