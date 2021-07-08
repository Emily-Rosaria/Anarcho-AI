module.exports = {
  name: "click_red_pub",
  async click(button) {
    await button.clicker.fetch();
    const uID = button.clicker.user.id;
    await button.reply.send(`<@${uID}>, You took the red pill, so that means you are based!`);
  },
};
