module.exports = {
    name: 'status', // The name of the command
    description: 'Sets the bots game status!', // The description of the command (for help text)
    perms: 'dev', //restricts to bot dev only (me)
    allowDM: true,
    cooldown: 10,
    usage: '[status]', // Help text to explain how to use the command (if it had any arguments)
    execute(message, args) {
      var status = { status: 'online' };
      if (args && args.length > 0) {
        const gameName = args.join(' ').length > 31 ? args.join(' ').slice(0,30) + '...' : args.join(' ');
        status.activity = { type: 'PLAYING', name: gameName };
      }
      message.client.user.setPresence(status);
    },
};
