const config = require('./../../config.json'); // load bot config

/**
 * Runs the help command, explaining each available command to the user.
 */
module.exports = {
    name: 'github',
    description: 'Posts a link to the github repository.',
    aliases: ['code','git'],
    perms: false, //no user-based restrictions
    allowDM: true,
    async execute(message, args) {
        message.reply("My source code can be found here:\n> "+config.github);
    },
};
