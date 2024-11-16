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
    // Send command to Telegram
    const result = await telegramService.getBotInfo();

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
