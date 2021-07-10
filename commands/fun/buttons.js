
module.exports = {
    name: 'buttons', // The name of the command
    description: 'Have the bot make post buttons. On-click actions are only visible to button clickers.', // The description of the command (for help text)
    aliases: ['button','newbutton','docbutton'],
    args: true, // Specified that this command doesn't need any data other than the command
    perms: 'user', //restricts to users with the "verifed" role noted at config.json
    allowDM: false,
    usage: '<message-text>\n<button-1-text> <button-1-doc|button-1-url> [button-1-style|"url"]\n<button-2-text> <button-2-doc|button-2-url> [button-2-style|"url"]\n...', // Help text to explain how to use the command (if it had any arguments)
    execute(message, args) {
      const { MessageButton, MessageActionRow } = require('discord-buttons');

      function getColor(colour) {
        if (["red","orange","danger","deny","warning","destructive"].includes(colour)) {
          return "red";
        }
        if (["blue","purple","blurple","primary"].includes(colour)) {
          return "blurple";
        }
        if (["green","success"].includes(colour)) {
          return "green";
        }
        if (["link","website","redirect","url"].includes(colour)) {
          return "url";
        }
        return "grey";
      }

      const text = args.join(' ').split('\n')[0].replace('\\n','\n');
      let lines = message.content.split('\n');
      lines = lines.slice(1,Math.min(10,lines.length));

      let hasURL = false;

      let row = new MessageActionRow()

      for (const line of lines) {
        lineArgs = line.match(/("[^"\n]+"|\S+)/g).map(l=>l.replace(/"/g,''));
        let btn = new MessageButton()
        .setLabel(lineArgs[0])
        if (lineArgs.length > 2) {
          const style = getColor(lineArgs[2].toLowerCase());
          if (style == 'url') {
            hasURL = true;
            let url = lineArgs[1].trim().split(' ')[0].replace(/(^<|>$)/g,'');
            btn.setURL(url).setStyle(style);
          } else {
            btn.setID(`doc_${lineArgs[1]}_${message.author.id}`).setStyle(style);
          }
        } else {
          btn.setID(`doc_${lineArgs[1]}_${message.author.id}`).setStyle("grey");
        }
        row.addComponents(btn);
      }

      try {
        message.channel.send(text, row);
      } catch (err) {
        if (hasURL) {
          message.reply("There was an error making your button message. Most likely, your url was invalid.");
        } else {
          message.reply("There was an error making your button message.");
        }
      }

    },
};
