
module.exports = {
    name: 'clicky', // The name of the command
    description: 'Make the bot say random predetermined phrases (this is mostly a test function).', // The description of the command (for help text)
    args: false, // Specified that this command doesn't need any data other than the command
    perms: 'dev', //restricts to users with the "verifed" role noted at config.json
    usage: '', // Help text to explain how to use the command (if it had any arguments)
    execute(message, args) {
      const { MessageButton, MessageActionRow } = require('discord-buttons');

      let pub = "";

      if (args && args.length > 0 && ["pub","public","shame","share"].includes(args[0].toLowerCase())) {
        pub = "_pub";
      }

      let button = new MessageButton()
      .setStyle('red')
      .setLabel('Red Pill')
      .setID('click_red'+pub)

      let button2 = new MessageButton()
      .setStyle('blurple')
      .setLabel('Blue Pill')
      .setID('click_blue'+pub)

      let row = new MessageActionRow()
      .addComponents(button, button2);

      message.channel.send('What pill do you take?', row);
    },
};
