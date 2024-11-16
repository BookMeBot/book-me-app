const { Telegraf } = require("telegraf");
const { ethers } = require("ethers");
require("dotenv").config();

async function test() {
  // Load client with specific private key
  const principal = Signer.parse(process.env.STORACHA_PRIVATE_KEY);
  const store = new StoreMemory();
  const client = await Client.create({ principal, store });
  // Add proof that this agent has been delegated capabilities on the space
  const proof = await Proof.parse(process.env.STORACHA_PROOF);
  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());
  //use upload directory since it will maintain the file name

  // w3s.link/ipfs/-4555870136/1.0.0.json
  // w3s.link/ipfs/-4555870136/2.0.0.json

  // w3s.link/ipfs/asdhashdlakwsjfklasf/-4555870136.json

  // READY to go!
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("Please define TELEGRAM_BOT_TOKEN in your .env.local file");
}

const bot = new Telegraf(BOT_TOKEN);

let totalMembers = 0;
const agreedUsers = new Set();

// /start command handler
bot.start((ctx: any) => {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;

  ctx.reply(`Welcome! Your chat ID is: ${chatId}\nYour user ID is: ${userId}`);
});

// /book command handler
bot.command("book", (ctx: any) => {
  const messageText = ctx.message?.text;

  if (messageText) {
    const argsString = messageText.replace("/book", "").trim();
    const args = parseArguments(argsString);

    if (!args.location || !args.nights || !args.budget || !args.dates) {
      ctx.reply(
        "Please provide booking details in this format:\n" +
          "`/book location=<Location> nights=<Number> budget=<Amount> dates=<Start Date>-<End Date>`",
        { parse_mode: "Markdown" }
      );
      return;
    }

    ctx.reply(
      `Booking details:\n` +
        `- Location: ${args.location}\n` +
        `- Nights: ${args.nights}\n` +
        `- Budget: $${args.budget}\n` +
        `- Dates: ${args.dates}` +
        `Please respond with ✅ if you agree to this trip.`
    );
  }
});

// Listen for emoji responses (✅)
bot.on("text", (ctx: any) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const messageText = ctx.message?.text;

  if (messageText === "✅") {
    if (!agreedUsers.has(userId)) {
      agreedUsers.add(userId);
      ctx.reply(`User ${ctx.from.first_name} has agreed to the trip!`);

      // Check if all users have agreed
      if (agreedUsers.size >= totalMembers) {
        ctx.reply(
          "All members have agreed to the trip! 🎉 Booking will proceed now."
        );
        // add booking logic
      }
    } else {
      ctx.reply("You have already responded with ✅.");
    }
  }
});

function parseArguments(args: string): {
  location?: string;
  nights?: number;
  budget?: number;
  dates?: string;
} {
  const argPairs = args.split(" ");
  const argsObj: {
    location?: string;
    nights?: number;
    budget?: number;
    dates?: string;
  } = {};

  argPairs.forEach((pair) => {
    const [key, value] = pair.split("=");
    switch (key) {
      case "location":
        argsObj.location = value;
        break;
      case "nights":
        argsObj.nights = parseInt(value, 10);
        break;
      case "budget":
        argsObj.budget = parseFloat(value);
        break;
      case "dates":
        argsObj.dates = value;
        break;
      default:
        break;
    }
  });

  return argsObj;
}

// function funding() {
//   const chatId = ctx.chat.id;
//   const userId = ctx.from.id;
//   const messageText = ctx.message?.text;

//   if (messageText === "✅") {
//     if (!agreedUsers.has(userId)) {
//       agreedUsers.add(userId);
//       ctx.reply(`User ${ctx.from.first_name} has agreed to the trip!`);

//       // Check if all users have agreed
//       if (agreedUsers.size >= totalMembers) {
//         ctx.reply(
//           "All members have agreed to the trip! 🎉 Booking will proceed now."
//         );
//         // add booking logic
//       }
//     } else {
//       ctx.reply("You have already responded with ✅.");
//     }
//   }
// }

// start bot
bot.launch().then(() => {
  console.log("Bot is running");
});

// shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
