require('dotenv').config(); //for .env file

// Bot stuff below

const Reddit = require('reddit'); // Reddit
const fetch = require('node-fetch'); // This lets me get stuff from api.
const Booru = require('booru'); // This lets me get stuff from weeb sites.
const fs = require('fs'); // Loads the Filesystem library
const path = require("path"); // Resolves file paths
const Discord = require('discord.js'); // Loads the discord API library
const readline = require('readline');
const {google} = require('googleapis');

const config = require('./config.json'); // load bot config

const mongoose = require("mongoose"); //database library
const connectDB = require("./database/connectDB.js"); // Database connection
const database = config.dbName; // Database name

const botIntents = new Discord.Intents();
botIntents.add(Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_VOICE_STATES, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING, Discord.Intents.FLAGS.DIRECT_MESSAGES, Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Discord.Intents.FLAGS.DIRECT_MESSAGE_TYPING);


const client = new Discord.Client({intents: botIntents, partials: ["CHANNEL"], allowedMentions: { parse: ['users', 'roles'], repliedUser: true}}); // Initiates the client

client.commands = new Discord.Collection(); // Creates an empty list in the client object to store all commands

// function to find all js files in folder+subfolders
const getAllCommands = function (dir, cmds) {
  files = fs.readdirSync(dir, { withFileTypes: true });
  fileArray = cmds || [];
  files.forEach((file) => {
    if (file.isDirectory()) {
      const newCmds = fs.readdirSync(dir + '/' + file.name);
      fileArray = fileArray.concat(newCmds.map((f) => dir + '/' + file.name + '/' + f));
    } else if (file.name.endsWith('.js')) {
      fileArray = fileArray.concat([dir + '/' + file.name]);
    }
  });
  return fileArray;
};
const commandFiles = getAllCommands('./commands').filter(file => file.endsWith('.js')); // Loads the code for each command from the "commands" folder

// Loops over each file in the command folder and sets the commands to respond to their name
for (const file of commandFiles) {
    const command = require(file);
    client.commands.set(command.name, command);
}

client.cooldowns = new Discord.Collection(); // Creates an empty list for storing timeouts so people can't spam with commands

// load the core events into client
client.events = new Discord.Collection();
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    client.events.set(event.name, event);
}

// load the core buttons into client
client.buttons = new Discord.Collection();
const buttonFiles = fs.readdirSync('./buttons').filter(file => file.endsWith('.js'));
for (const file of buttonFiles) {
    const button = require(`./buttons/${file}`);
    client.buttons.set(button.name, button);
}

// Starts the bot and makes it begin listening for commands.
client.on('ready', async function() {
    client.user.setPresence({ status: 'online' }); // activity: { type: 'PLAYING', name: 'with anti-fash' }
    console.log(`${client.user.username} is up and running! Launched at: ${(new Date()).toUTCString()}.`);
    const startMusic = require("./music/setup.js");
    startMusic(client);
});

client.on('messageCreate', async message => {
    if (message && message.author && message.author.bot) {
      if (message.channel.type != "DM") {
        client.events.get("onWordcount").event(message);
      }
      return; // don't respond to bots aside from counting their word usage
    }
    client.events.get("onMessage").event(message);
});

client.on('messageDelete', async message => {
    if (message.author && message.author.bot) {return} // don't respond to bots
    client.events.get("onDelete").event(message);
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (newMessage.author && newMessage.author.bot) {return} // don't respond to bots
    client.events.get("onEdit").event(oldMessage, newMessage);
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) {return}
    client.events.get("onReactionAdd").event(reaction, user);
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) {return}
    client.events.get("onReactionRemove").event(reaction, user);
});

client.on('messageReactionRemoveEmoji', async (reaction) => {
    client.events.get("onReactionTake").event(reaction);
});

client.on('messageReactionRemoveAll', async (message) => {
    client.events.get("onReactionClear").event(message);
});

client.on('clickButton', async (button) => {
    client.events.get("onButton").event(button);
});

connectDB("mongodb://localhost:27017/"+database);
client.login(process.env.TOKEN); // Log the bot in using the token provided in the .env file
