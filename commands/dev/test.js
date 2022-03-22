const mongoose = require("mongoose"); //database library
const Users = require("./../../database/models/users.js"); // users model
const config = require('./../../config.json'); // load bot config

module.exports = {
    name: 'test', // The name of the command
    description: 'Test.', // The description of the command (for help text)
    group: 'dev',
    perms: 'dev',
    allowDM: true,
    async execute(message, args) {
      const query = {"$and":[{bot:{"$ne":true}}, {"$or":[{"wordcounts.based":{"$gte":1}},{"wordcounts.cringe":{"$gte":1}}]}]};
      const data = await Users.find(query).select("wordcounts.based wordcounts.cringe").exec();
      const csv = data.map(d=>`${(d.wordcounts.get("based") || 0)},${(d.wordcounts.get("cringe") || 0)}`);
      message.reply(csv.join('\n'));
    },
};
