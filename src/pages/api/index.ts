// pages/api/_app.ts or pages/api/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import { initializeServer } from "../../../lib/init";

// Track if we've initialized
let isInitialized = false;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!isInitialized) {
    try {
      await initializeServer();
      isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize:", error);
    }
  }

  // Handle your API request here
  res.status(200).json({ status: "ok" });
}
