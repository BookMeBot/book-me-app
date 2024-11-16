import { NextResponse } from "next/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "redis";

let client: ReturnType<typeof createClient>;
let isConnected = false;

export async function getRedisClient() {
  if (!client) {
    client = createClient({
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT ?? 13744),
      },
    });

    client.on("error", (err) => console.log("Redis Client Error", err));
  }

  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }

  return client;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const chatId = req.query.chatId as string;
    const redis = await getRedisClient();
    const existingDataStr = await redis.get(chatId);
    const existingData = existingDataStr ? JSON.parse(existingDataStr) : null;
    res.status(200).json({ success: true, data: existingData });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
