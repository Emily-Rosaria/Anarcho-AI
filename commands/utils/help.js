/**
 * Runs the help command, explaining each available command to the user.
 */

const config = require('./../../config.json'); // load bot config
const Discord = require('discord.js'); // Image embed

module.exports = {
    name: 'help',
    description: 'List all available commands, or info about a specific command.',
    aliases: ['commands','info'],
    perms: false, //no user-based restrictions
    usage: '<command name>',
    cooldown: 5,
    allowDM: true,
    group: 'util',
    async execute(message, args) {
        const prefix = config.prefix[0];

        const { commands } = message.client;

        // Send help data about ALL commands
        if(!args.length) {
          const filtered = commands.filter(c=>{
            if (c.perms && c.perms == 'dev' && config.perms.dev != message.author.id) {
              return false;
            }
            return true;
          });

          const mapped = filtered.reduce((acc,cur)=>{
            let temp = acc;
            if (cur.group) {
              temp[cur.group] = (temp[cur.group] || []).concat(cur.name);
            } else {
              temp.misc = (temp.misc || []).concat(cur.name);
            }
            return temp;
          },{});

          const embed = new Discord.MessageEmbed()
          .setColor('#dc1414')
          .setDescription(`Here\'s a list of all my available commands. You can send \`${prefix}help [command name]\` to get info on a specific command!`)
          .setTitle(`${message.client.user.username}'s Command List`)
          .setTimestamp()

          const fields = [];

          for (const key of [...Object.keys(mapped)]) {
            const cmds = mapped[key].sort();
            let order = 0;
            if (key == 'dev') {
              order = 99;
            } else if (key == 'misc') {
              order = 98;
            } else if (key == 'util') {
              order = 97;
            }
            fields.push({
              name: key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
              value: cmds.join(', '),
              order: order
            });
          }

          fields.sort((a,b)=>{
            if (a.order != b.order) {
              return a.order - b.order;
            } else if (a.name.toLowerCase() < b.name.toLowerCase()) {
              return -1;
            } else if (a.name.toLowerCase() > b.name.toLowerCase()) {
              return 1;
            }
            return 0;
          });

          embed.addFields(fields);

          return message.channel.send(embed);
        }

        // Send help data about the specific command
        const name = args[0].toLowerCase();
        const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

        if (!command) {
          return message.reply('that\'s not a valid command!');
        }

        const embed = new Discord.MessageEmbed()
        .setColor('#dc1414')
        .setTitle(`Help: ${prefix}${command.name}`)
        .setTimestamp()

        if (command.description) embed.setDescription(command.description);

        if (command.aliases) embed.addField("Aliases",`${command.aliases.join(', ')}`);
        if (command.perms && command.perms != 'user') {
          embed.addField("Perms",command.perms.charAt(0).toUpperCase() + command.perms.slice(1).toLowerCase());
        }
        if (command.usage) {
          embed.addField("Usage","```\n"+prefix+command.name+" "+command.usage+"\n```");
        } else {
          embed.addField("Usage","```\n"+prefix+command.name+"\n```");
        }
        message.channel.send({embeds: [embed]});
    },
};
