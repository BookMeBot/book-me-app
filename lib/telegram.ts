export class TelegramService {
  private baseUrl: string;

  constructor(private readonly botToken: string) {
    this.baseUrl = `https://api.telegram.org/bot${botToken}`;
  }

  async sendCommand(chatId: string, command: string, params?: string) {
    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: command,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.description || "Failed to send command to Telegram"
        );
      }

      return data;
    } catch (error) {
      console.error("Error sending Telegram command:", error);
      throw error;
    }
  }

  async getBotInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/getMe`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.description || "Failed to get bot info");
      }

      return data;
    } catch (error) {
      console.error("Error getting bot info:", error);
      throw error;
    }
  }

  async getAllChats() {
    try {
      const allChats = new Map();
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `${this.baseUrl}/getUpdates?offset=${offset}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.description || "Failed to get updates");
        }

        if (data.result.length === 0) {
          hasMore = false;
          continue;
        }

        // Process updates and collect chats
        data.result.forEach((update: any) => {
          const chat =
            update.message?.chat ||
            update.channel_post?.chat ||
            update.edited_message?.chat ||
            update.callback_query?.message?.chat;

          if (chat) {
            allChats.set(chat.id, {
              id: chat.id,
              type: chat.type,
              title: chat.title || undefined,
              username: chat.username || undefined,
              firstName: chat.first_name || undefined,
              lastName: chat.last_name || undefined,
            });
          }
        });

        // Update offset for next iteration
        offset = data.result[data.result.length - 1].update_id + 1;
      }

      return {
        total: allChats.size,
        chats: Array.from(allChats.values()),
      };
    } catch (error) {
      console.error("Error getting all chats:", error);
      throw error;
    }
  }
}
