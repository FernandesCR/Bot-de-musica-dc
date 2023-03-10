const { Client, Collection } = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");
const { TOKEN, PREFIX, LOCALE } = require("./util/bmc");
const path = require("path");
const i18n = require("i18n");

const client = new Client({ 
  disableMentions: "everyone",
  restTimeOffset: 0
});

client.login(process.env.TOKEN);
client.commands = new Collection();
client.prefix = PREFIX;
client.queue = new Map();
const cooldowns = new Collection();
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

i18n.configure({
  locales: ["pt_br"],
  directory: path.join(__dirname, "locales"),
  defaultLocale: "pt_br",
  objectNotation: true,
  register: global,

  logWarnFn: function (msg) {
    console.log("warn", msg);
  },

  logErrorFn: function (msg) {
    console.log("error", msg);
  },

  missingKeyFn: function (locale, value) {
    return value;
  },

  mustacheConfig: {
    tags: ["{{", "}}"],
    disable: false
  }
});

//Express
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Salve Salve Familia Estou online'));

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

client.on("ready", () => {
console.log(`O bot foi iniciado, com ${client.users.cache.size} usuários e em ${client.guilds.cache.size} servidores.`);
client.user.setActivity('!help', { type: 'PLAYING' });(`Eu estou em ${client.guilds.cache.size} servidores`);
});
 client.on("guildCreate", guild => {
 console.log(`O bot entrou no servidor: ${guild.name} (ID do servidor: ${guild.id}). Membros: ${guild.memberCount} membros!`);
 client.user.setActivity(`Estou em ${client.guilds.cache.size} servidores.`);
 });
 
client.on("guildDelete", guild => {
   console.log(`O bot foi removido do servidor: ${guild.name} (ID do servidor: ${guild.id}`);
   client.user.setActivity(`Serving ${client.guilds.cache.size} servers`);
   });

const commandFiles = readdirSync(join(__dirname, "commands")).filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(join(__dirname, "commands", `${file}`));
  client.commands.set(command.name, command);
}

client.on("message", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(PREFIX)})\\s*`);
  if (!prefixRegex.test(message.content)) return;

  const [, matchedPrefix] = message.content.match(prefixRegex);

  const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command =
    client.commands.get(commandName) ||
    client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 1) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(
        i18n.__mf("common.cooldownMessage", { time: timeLeft.toFixed(1), name: command.name })
      );
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply(i18n.__("common.errorCommend")).catch(console.error);
  }
});
