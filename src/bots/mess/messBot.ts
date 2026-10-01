import http from "http";
import url from "url";
import axios from "axios";
import { CONFIG } from "../../config";
import { checkVideoUrl } from "../../CHECKVIDEO";
import { answerQuestionWithAI } from "../../AI_ask";
import { universalDownloader } from "../../autodown";
import { userDataManager } from "../../data";

export class MessengerBot {
  private async sendMessage(psid: string, text: string) {
    if (!CONFIG.PAGE_ACCESS_TOKEN) return;
    for (let i = 0; i < text.length; i += 2000) {
      await axios.post(
        "https://graph.facebook.com/v21.0/me/messages",
        { recipient: { id: psid }, message: { text: text.slice(i, i + 2000) } },
        { params: { access_token: CONFIG.PAGE_ACCESS_TOKEN } }
      ).catch(() => null);
    }
  }

  private async processEvent(event: any) {
    const psid = event.sender?.id;
    const text = event.message?.text?.trim();
    if (!psid || !text) return;

    userDataManager.saveUser(psid, "mess");
    if (!/^https?:\/\/[^\s]+$/i.test(text)) {
      const answer = await answerQuestionWithAI(text);
      userDataManager.logActivity(psid, "question", text, answer);
      return this.sendMessage(psid, answer);
    }

    let targetUrl = text;
    try {
      const scraped = await universalDownloader.download(text);
      const v = scraped.medias?.find((m: any) => m.type === "video" && m.url);
      if (v?.url) targetUrl = v.url;
    } catch {}

    const verdict = await checkVideoUrl(targetUrl, text);
    userDataManager.logActivity(psid, "video", text, verdict);
    return this.sendMessage(psid, verdict);
  }

  start() {
    const server = http.createServer(async (req, res) => {
      const parsed = url.parse(req.url || "", true);
      if (req.method === "GET" && parsed.pathname === "/webhook") {
        const mode = parsed.query["hub.mode"];
        const token = parsed.query["hub.verify_token"];
        const challenge = parsed.query["hub.challenge"];
        if (mode === "subscribe" && token === CONFIG.VERIFY_TOKEN) {
          res.writeHead(200, { "Content-Type": "text/plain" });
          return res.end(challenge);
        }
        res.writeHead(403);
        return res.end();
      }

      if (req.method === "POST" && parsed.pathname === "/webhook") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", async () => {
          try {
            const data = JSON.parse(body);
            if (data.object === "page") {
              for (const entry of data.entry || []) {
                for (const ev of entry.messaging || []) await this.processEvent(ev);
              }
            }
          } catch {}
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "EVENT_RECEIVED" }));
        });
        return;
      }
      res.writeHead(404);
      res.end();
    });

    server.listen(CONFIG.MESSENGER_PORT, () => {
      console.log(`[MessengerBot] Webhook dang chay tai port ${CONFIG.MESSENGER_PORT}`);
    });
  }
}

export const messengerBot = new MessengerBot();
export function startMessBot() {
  messengerBot.start();
}
