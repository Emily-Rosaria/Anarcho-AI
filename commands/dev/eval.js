const config = require('./../../config.json'); // load bot config
const Discord = require('discord.js'); // Image embed

module.exports = {
    name: 'eval', // The name of the command
    description: 'Runs code if user is a dev. Only takes in the message sent as an argument.', // The description of the command (for help text)
    perms: 'dev',
    allowDM: true,
    usage: '<code>', // Help text to explain how to use the command (if it had any arguments)
    args: true,
    execute(message, args) {
      if (message.author.id != config.perms.dev) {
        return;
      }
      const chunks = message.content.split('```');
      if (chunks.length < 2) {
        return message.reply("Invalid input.");
      }
      const code = "message = arguments[0];\n" + message.content.split('```')[1].replace(/^.*\n/,'');
      var func = new Function(code);
      try {
        func(message);
        message.reply("Done!");
      } catch (err) {
        const error = err.stack.length > 1955 ? err.stack.substring(0,1950) : err.stack;
        message.reply("```\n"+err.stack+"\n```");
      }
    },
};
