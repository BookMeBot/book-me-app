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
const NILLION_USER_ID = process.env.NILLION_USER_ID;
const NILLION_API_BASE_URL = "https://nillion-storage-apis-v0.onrender.com";

if (!BOT_TOKEN || !NILLION_USER_ID) {
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

  const appId = await registerAppId();
  console.log(appId, "appid");
  await storePrivateKey(appId, NILLION_USER_ID, chatWallets[chatId].privateKey);

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

// NILLION
async function registerAppId() {
  try {
    const response = await axios.post(
      `${NILLION_API_BASE_URL}/api/apps/register`
    );

    if (response.status === 200 && response.data.app_id) {
      const appId = response.data.app_id;
      console.log(`Registered new App ID: ${appId}`);
      return appId;
    } else {
      console.error("Failed to register App ID:", response.data);
      return null;
    }
  } catch (error) {
    console.error("Error registering App ID:", error);
    throw new Error("Failed to register App ID with Nillion");
  }
}

async function storePrivateKey(
  appId: string,
  userSeed: string,
  privateKey: string
) {
  try {
    const response = await axios.post(
      `${NILLION_API_BASE_URL}/api/apps/${appId}/secrets`,
      {
        secret: {
          nillion_seed: userSeed,
          secret_value: privateKey,
          secret_name: "wallet_private_key",
        },
        permissions: {
          retrieve: [],
          update: [],
          delete: [],
          compute: {},
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.status === 200) {
      console.log(`Private key stored successfully for App ID: ${appId}`);
    } else {
      console.error(`Failed to store private key: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error storing private key in Nillion:", error);
    throw new Error("Nillion storage error");
  }
}
async function retrievePrivateKey(appId: string, userSeed: string) {
  try {
    const storeIdsResponse = await axios.get(
      `${NILLION_API_BASE_URL}/api/apps/${appId}/store_ids`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const storeIdsData = storeIdsResponse.data;

    if (
      !storeIdsData ||
      !storeIdsData.store_ids ||
      storeIdsData.store_ids.length === 0
    ) {
      console.error("No store IDs found for the App ID:", appId);
      return null;
    }

    const { store_id, secret_name } = storeIdsData.store_ids[0];

    const secretResponse = await axios.get(
      `${NILLION_API_BASE_URL}/api/secret/retrieve/${store_id}`,
      {
        params: {
          retrieve_as_nillion_user_seed: userSeed,
          secret_name: secret_name,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const secretData = secretResponse.data;

    if (secretData && secretData.secret) {
      console.log("Private key retrieved successfully:", secretData.secret);
      return secretData.secret;
    } else {
      console.error("Failed to retrieve the secret:", secretData);
      return null;
    }
  } catch (error) {
    console.error("Error retrieving private key from Nillion:", error);
    return null;
  }
}

bot.command("getkey", async (ctx: any) => {
  const chatId = ctx.chat.id.toString();
  const walletInfo = chatWallets[chatId];

  if (!walletInfo) {
    await ctx.reply(
      "No wallet has been created for this chat yet. Use /start to create one."
    );
    return;
  }

  const privateKey = await retrievePrivateKey(
    "e0925412-cd66-49c1-9709-727d9264ce60",
    NILLION_USER_ID
  );

  if (privateKey) {
    await ctx.reply(`The private key for this chat is:\n${privateKey}`);
  } else {
    await ctx.reply("Failed to retrieve the private key.");
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

// listen for messages
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
