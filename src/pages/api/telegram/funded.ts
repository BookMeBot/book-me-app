import { NextResponse } from "next/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { TelegramService } from "../../../../lib/telegram";

// Initialize the service with your bot token
// You should store this in an environment variable
const telegramService = new TelegramService(process.env.TELEGRAM_BOT_TOKEN!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const body = await req.body;
    const { chatId, command, params } = body;

    // Validate required fields
    if (!chatId || !command) {
      return res.status(200).json({
        error: "Missing required fields: chatId and command are required",
        status: 400,
      });
    }

    // Send command to Telegram
    const result = await telegramService.sendCommand(chatId, command);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("API Error:", error);
    return res
      .status(200)
      .json({ error: "Failed to process request", status: 500 });
  }
}
