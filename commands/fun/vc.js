const Discord = require('discord.js'); // Image embed

module.exports = {
    name: 'vc', // The name of the command
    description: 'Make the bot post a thing to get people in the VC.', // The description of the command (for help text)
    args: false, // Specified that this command doesn't need any data other than the command
    perms: 'user', //restricts to users with the "verifed" role noted at config.json
    allowDM: false,
    group: 'images',
    usage: '', // Help text to explain how to use the command (if it had any arguments)
    execute(message, args) {
        const attachment = new Discord.MessageAttachment('./assets/bernie-vc.png', 'bernie-vc.png');
        const embed = new Discord.MessageEmbed()
          .setColor('#EDEDED')
          .setImage('attachment://bernie-vc.png')
          .setTitle(`${message.member.displayName} needs your help!`)
        message.channel.send({files: [attachment], embeds: [embed]});
    },
};
