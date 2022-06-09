const mongoose = require('mongoose'); // Import mongoose library
const Starboard = require("./database/models/Starboard.js"); // Database

const settings = {
  "serverID": "775503679339495435",
  "channelID": "966180934804181083",
  "threshold": 5,
  "dateCutoff": 3,
  "exclude": {
    "815572313164218378":["👍","👎","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"],
    "800399675828076604":["👍","👎","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"],
    "924841909762007060":["👍","👎","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"],
    "847822628576165908":[],
    "800401944312414248":["👍","👎","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"],
    "886855355487907841":["👍","👎","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"]
  }
};

function fetchStructure(structure) {
  return new Promise((resolve, reject) => {
    if (structure.partial) {
      structure.fetch()
        .then((structure) => resolve(structure))
        .catch((error) => reject(error));
    } else {
      resolve(structure);
    }
  })
};

// check if message qualifies, and if so, post a starboard message and add to the database
function newStar (msg, postChannel) {

}

// update the starboard message and counts
function updateStarboard (data, msg, postChannel) {

}

module.exports =  {
  // manage the message board on reaction add/remove
  async manageBoard (reaction) {

    const msg = reaction.message;
    const postChannel = client.guilds.cache.get(settings.serverID).channels.cache.get(settings.channelID);

    // if message is older than set amount
    const dateDiff = (new Date()) - msg.createdAt
    const dateCutoff = 1000 * 60 * 60 * 24
    if (dateDiff > dateCutoff * settings.dateCutoff) {
      return; // old message
    }

    Starboard.findById({_id: msg.id}, (err,doc)=>{
      if (err) {
        return console.error(err);
      }
      if (!doc) {
        return newStar (msg, postChannel);
      }
      if (!doc.deleted) {
        return updateStarboard (msg, doc, postChannel);
      }
    });

    // did message reach threshold
    if (reaction.count >= settings.threshold) {
      // if message is already posted
      if (messagePosted[msg.id]) {
        const editableMessageID = messagePosted[msg.id]
        if (editableMessageID === true) return // message not yet posted (too fast)

        console.log(`updating count of message with ID ${editableMessageID}. reaction count: ${reaction.count}`)
        const messageFooter = `${reaction.count} ${settings.embedEmoji} (${msg.id})`
        postChannel.messages.fetch(editableMessageID).then(message => {
          message.embeds[0].setFooter(messageFooter)
          message.edit({ embeds: [message.embeds[0]] })

          // if db
          if (db)
            db.updatePost(message, msg, reaction.count, message.embeds[0].image)

        }).catch(err => {
          console.error(`error updating post: ${editableMessageID}\noriginal message: ${msg.id}\n${err}`)
        })
      } else {
        console.log(`posting message with content ID ${msg.id}. reaction count: ${reaction.count}`)

        // add message to ongoing object in memory
        messagePosted[msg.id] = true

        // create content data
        const data = {
          content: (msg.content.length < 3920) ? msg.content : `${msg.content.substring(0, 3920)} **[ ... ]**`,
          avatarURL: `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.jpg`,
          imageURL: '',
          footer: `${reaction.count} ${settings.embedEmoji} (${msg.id})`
        }

        // add msg origin info to content prop
        const msgLink = `https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`
        const channelLink = (msg.channel.type.includes('THREAD')) ? `<#${msg.channel.parent.id}>/<#${msg.channel.id}>` : `<#${msg.channel.id}>`
        data.content += `\n\n→ [original message](${msgLink}) in ${channelLink}`

        // resolve any images
        if (msg.embeds.length) {
          const imgs = msg.embeds
            .filter(embed => embed.thumbnail || embed.image)
            .map(embed => (embed.thumbnail) ? embed.thumbnail.url : embed.image.url)
          data.imageURL = imgs[0]

          // twitch clip check
          const videoEmbed = msg.embeds.filter(embed => embed.type === 'video')[0]
          if (videoEmbed && videoEmbed.video.url.includes("clips.twitch.tv")) {
            data.content += `\n⬇️ [download clip](${videoEmbed.thumbnail.url.replace("-social-preview.jpg", ".mp4")})`
          }

        } else if (msg.attachments.size) {
          data.imageURL = msg.attachments.first().url
          data.content += `\n📎 [${msg.attachments.first().name}](${msg.attachments.first().proxyURL})`
        }

        const embed = new Discord.MessageEmbed()
          .setAuthor(msg.author.username, data.avatarURL)
          .setColor(settings.hexcolor)
          .setDescription(data.content)
          .setImage(data.imageURL)
          .setTimestamp(new Date())
          .setFooter(data.footer)
        postChannel.send({ embeds: [embed] }).then(starMessage => {
          messagePosted[msg.id] = starMessage.id

          // if db
          if (db)
            db.updatePost(starMessage, msg, reaction.count, starMessage.embeds[0].image)
        })
      }
    }
  },

  // delete a starboard post, called if reactions are purged from the pinned message or the message is deleted
  deletePost (msg) {
    const postChannel = client.guilds.cache.get(settings.serverID).channels.cache.get(settings.channelID);

    const options = { returnDocument: 'before', upsert: false };
    const update = { deleted: true, content: "", attachments: [], reacts: (new Map()), voters: [], starID: "" };
    Starboard.findByIdAndUpdate({_id: message.author.id},update,options, (err,doc)=>{
      if (err) {
        return console.error(err);
      }
      if (data && data.starID) {
        return postChannel.messages.fetch(data.starID).then(m => m.delete()).catch(console.error);
      }
    });
  },

  // calls if the starboard channel bot post was deleted
  purgeStarPost (msg) {
    const options = { returnDocument: 'before', upsert: false };
    const update = { deleted: true, content: "", attachments: [], reacts: (new Map()), voters: [], starID: "" };
    Starboard.findOneAndUpdate({starID: msg.id},update,options}).exec();
  }
}
