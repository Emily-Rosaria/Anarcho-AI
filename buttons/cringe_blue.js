module.exports = {
  name: "click_blue",
  async click(button) {
    await button.reply.send(`You took the blue pill, so that means you are cringe!`,true);
  },
};
