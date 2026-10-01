import { checkVideoUrl } from "../../CHECKVIDEO";
import { answerQuestionWithAI } from "../../AI_ask";

export class MessageBot {
  async processMessage(content: string): Promise<string> {
    const text = content.trim();
    if (!text) return "Vui lòng gửi câu hỏi hoặc link video cần kiểm chứng.";
    if (/^https?:\/\/[^\s]+$/i.test(text)) {
      return checkVideoUrl(text);
    }


    return answerQuestionWithAI(text);
  }

  start() {
    console.log("[MessageBot] Ready for SMS/WebChat message integration.");
  }
}

export const messageBot = new MessageBot();
export function startMessageBot() {
  messageBot.start();
}
