const { Telegraf } = require("telegraf");
const { ethers } = require("ethers");
require("dotenv").config();
const axios = require("axios");

// async function test() {
//   // Load client with specific private key
//   const principal = Signer.parse(process.env.STORACHA_PRIVATE_KEY);
//   const store = new StoreMemory();
//   const client = await Client.create({ principal, store });
//   // Add proof that this agent has been delegated capabilities on the space
//   const proof = await Proof.parse(process.env.STORACHA_PROOF);
//   const space = await client.addSpace(proof);
//   await client.setCurrentSpace(space.did());
//   //use upload directory since it will maintain the file name

//   // w3s.link/ipfs/-4555870136/1.0.0.json
//   // w3s.link/ipfs/-4555870136/2.0.0.json

//   // w3s.link/ipfs/asdhashdlakwsjfklasf/-4555870136.json

//   // READY to go!
// }

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("Please define required environment variables in .env");
}

const bot = new Telegraf(BOT_TOKEN);

let totalMembers = 0;
const agreedUsers = new Set();

// Define the structure of wallet information
interface WalletInfo {
  address: string;
  privateKey: string;
}

// In-memory chat history storage with enhanced structure
interface TextEntity {
  type: string;
  text: string;
}

interface ChatMessage {
  id: number;
  type: string;
  date: string;
  date_unixtime: string;
  from: string;
  from_id: string;
  text: string;
  text_entities: TextEntity[];
}

interface ChatHistory {
  [chatId: string]: {
    name: string;
    type: string;
    id: number;
    messages: ChatMessage[];
  };
}

const chatHistory: ChatHistory = {};

bot.use(async (ctx: any, next: any) => {
  const chatId = ctx.chat?.id.toString();
  const chatName = ctx.chat?.title || ctx.chat?.username || "Unknown Chat";
  const chatType = ctx.chat?.type || "unknown";

  if (!chatId || !ctx.message) return next();

  // Initialize chat history if not already present
  if (!chatHistory[chatId]) {
    chatHistory[chatId] = {
      name: chatName,
      type: chatType,
      id: ctx.chat.id,
      messages: [],
    };
  }

  // Prepare the message entity
  const messageId = ctx.message.message_id;
  const date = new Date(ctx.message.date * 1000);
  const dateIso = date.toISOString();
  const dateUnix = ctx.message.date.toString();
  const fromName =
    ctx.message.from?.username ||
    `${ctx.message.from?.first_name} ${ctx.message.from?.last_name}`;
  const fromId = `user${ctx.message.from?.id}`;
  const text = ctx.message.text || "";
  const textEntities: TextEntity[] = [{ type: "plain", text }];

  // Store the message
  chatHistory[chatId].messages.push({
    id: messageId,
    type: "message",
    date: dateIso,
    date_unixtime: dateUnix,
    from: fromName,
    from_id: fromId,
    text,
    text_entities: textEntities,
  });

  // Optional: Limit history size
  if (chatHistory[chatId].messages.length > 1000) {
    chatHistory[chatId].messages = chatHistory[chatId].messages.slice(-1000);
  }

  return next();
});

function generateChatHistoryPayload(chatId: string) {
  const chatData = chatHistory[chatId];

  if (!chatData) {
    return null;
  }

  return {
    name: chatData.name,
    type: chatData.type,
    id: chatData.id,
    messages: chatData.messages,
  };
}

bot.command("exporthistory", async (ctx: any) => {
  const chatId = ctx.chat?.id.toString();

  if (!chatId || !chatHistory[chatId]) {
    await ctx.reply("No chat history found for this chat.");
    return;
  }

  const payload = generateChatHistoryPayload(chatId);

  if (payload) {
    const payloadString = JSON.stringify(payload, null, 2);
    console.log("Exported Chat History:", payloadString);
    await ctx.reply(
      `Chat history exported:\n\`\`\`\n${payloadString}\n\`\`\``,
      { parse_mode: "Markdown" }
    );
  } else {
    await ctx.reply("Failed to generate chat history payload.");
  }
});

bot.command("sendhistory", async (ctx: any) => {
  const chatId = ctx.chat?.id.toString();

  if (!chatId || !chatHistory[chatId]) {
    await ctx.reply("No chat history found for this chat.");
    return;
  }

  const payload = generateChatHistoryPayload(chatId);

  if (!payload) {
    await ctx.reply("Failed to generate chat history payload.");
    return;
  }
});

const chatWallets: { [chatId: string]: WalletInfo } = {};

async function createWalletForChat(chatId: string) {
  const wallet = ethers.Wallet.createRandom();
  chatWallets[chatId] = {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };

  console.log(`Created wallet for chat ${chatId}: ${wallet.address}`);
  return wallet.address;
}

bot.start(async (ctx: any) => {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  console.log(ctx.update.message);

  // if (!chatWallets[chatId]) {
  //   //const walletAddress = await createWalletForChat(chatId);
  //   ctx.reply(
  //     `A new wallet has been created for this chat:\nAddress: ${walletAddress}\nYou can send funds to this address.`
  //   );
  // } else {
  // const walletAddress = chatWallets[chatId].address;
  // ctx.reply(`This chat already has a wallet:\nAddress: ${walletAddress}`);
  // //}

  // ctx.reply(`Welcome! Your chat ID is: ${chatId}\nYour user ID is: ${userId}`);
});

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

bot.command("wallet", (ctx: any) => {
  const chatId = ctx.chat.id;
  const walletInfo = chatWallets[chatId];
  console.log(walletInfo);

  if (walletInfo) {
    ctx.reply(`The wallet address for this chat is:\n${walletInfo.address}`);
  } else {
    ctx.reply(
      "No wallet has been created for this chat yet. Use /start to create one."
    );
  }
});

bot.command("checkfunds", async (ctx: any) => {
  const chatId = ctx.chat.id;
  const walletInfo = chatWallets[chatId];

  if (!walletInfo) {
    ctx.reply(
      "No wallet has been created for this chat yet. Use /start to create one."
    );
    return;
  }

  // Connect to the Ethereum network
  const provider = new ethers.providers.InfuraProvider(
    "mainnet",
    process.env.INFURA_API_KEY
  );
  const balance = await provider.getBalance(walletInfo.address);
  const balanceInEth = ethers.utils.formatEther(balance);

  if (balanceInEth === 0) ctx.reply("No funds");

  ctx.reply(`The current balance of the wallet is: ${balanceInEth} ETH`);
});

// Listen for emoji responses (✅)
bot.on("text", (ctx: any) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const messageText = ctx.message?.text;
  const isFromBot = ctx.from.is_bot;

  console.log(isFromBot);

  if (messageText === "funding is complete.") {
    ctx.reply(`funding complete for chat ${chatId}`);
  }

  // if (messageText === "✅") {
  //   if (!agreedUsers.has(userId)) {
  //     agreedUsers.add(userId);
  //     ctx.reply(`User ${ctx.from.first_name} has agreed to the trip!`);

  //     // Check if all users have agreed
  //     if (agreedUsers.size >= totalMembers) {
  //       ctx.reply(
  //         "All members have agreed to the trip! 🎉 Booking will proceed now."
  //       );
  //       // add booking logic
  //     }
  //   } else {
  //     ctx.reply("You have already responded with ✅.");
  //   }
  // }
});

// Function to handle messages
async function handleBotMessage(ctx: any, text: string) {
  const chatId = ctx.chat?.id;

  if (!chatId) {
    console.log("No chat ID found");
    return;
  }

  console.log(`Processing message: "${text}" in chat ${chatId}`);

  if (text.toLowerCase().includes("funding is complete")) {
    console.log("Funding complete detected");
    await ctx.reply("working");
    // await handleFundingComplete(ctx);
  }

  if (text.toLowerCase().includes("withdrawal processed")) {
    console.log("Withdrawal detected");
    // await handleWithdrawal(ctx);
  }
}

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
// Function to handle "funding is complete."
function handleFundingComplete(chatId: any) {
  bot.telegram.sendMessage(
    chatId,
    "Funding is complete! This event was triggered successfully."
  );
  console.log(`Funding complete message sent to chat ${chatId}`);
}

// Start the bot
bot.launch().then(() => {
  console.log("Bot is running");
});

// shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
