import { TextStyle } from "zca-js";
import { DeepCheckZalo } from "./ruaxbonzZalo";
import { checkVideoUrl } from "../../CHECKVIDEO";
import { answerQuestionWithAI } from "../../AI_ask";
import { universalDownloader } from "../../autodown";
import { userDataManager } from "../../data";

async function safeSend(api: any, content: string, msg: any, withQuote = false) {
  const type = msg.type ?? 0, threadId = String(msg.threadId);
  for (let i = 0; i < content.length; i += 1200) {
    const chunk = content.slice(i, i + 1200), nl = chunk.indexOf("\n");
    const styles = (nl > 0 && chunk.startsWith("🔎"))
      ? [{ start: 0, len: nl, st: TextStyle?.Green || "c_15a85f" }, { start: nl + 1, len: chunk.length - (nl + 1), st: TextStyle?.Small || "f_13" }]
      : [{ start: 0, len: chunk.length, st: TextStyle?.Small || "f_13" }];
    const payload: any = { msg: chunk, styles };
    let sent = false;
    if (i === 0 && withQuote && msg.data && typeof msg.data.content === "string" && msg.data.content.trim() && msg.data.msgId) {
      try {
        await api.sendMessage({ ...payload, quote: msg.data }, threadId, type);
        sent = true;
      } catch {}
    }
    if (!sent) {
      try { await api.sendMessage(payload, threadId, type); }
      catch {
        try { await api.sendMessage({ msg: chunk }, threadId, type); }
        catch { await api.sendMessage({ msg: chunk }, threadId, 0).catch(() => null); }
      }
    }
  }
}

export class ZaloBot {
  private client = new DeepCheckZalo();

  async start() {
    try {
      const api = await this.client.init();
      console.log(`[${this.client.brand}] Ket noi Zalo thanh cong! Dang listen tin nhan...`);

      api.listener.on("message", async (msg: any) => {
        if (msg.isSelf) return;
        const uid = String(msg.data?.uidFrom || msg.threadId);
        userDataManager.saveUser(uid, "zalo");

        let rawUrl = "", text = "";
        if (typeof msg.data?.content === "string") {
          text = msg.data.content.trim();
          const match = text.match(/https?:\/\/[^\s]+/i);
          if (match) rawUrl = match[0];
          try {
            const parsed = JSON.parse(text);
            if (parsed.href || parsed.url) rawUrl = parsed.href || parsed.url;
          } catch {}
        } else if (msg.data?.content && typeof msg.data.content === "object") {
          rawUrl = msg.data.content.href || msg.data.content.url || msg.data.content.normalUrl || "";
        }
        if (!rawUrl && msg.data?.url) rawUrl = msg.data.url;

        try {
          if (rawUrl) {
            const isImg = (/\.(jpg|jpeg|png|webp)($|\?)/i.test(rawUrl) || rawUrl.includes("photo-stal") || rawUrl.includes("/jpg/") || rawUrl.includes("/png/"));
            await safeSend(api, isImg ? "đã phát hiện hình ảnh , vuiii lòng chờ tớ phân tích nhó" : "đã phát hiện video , vuiii lòng chờ tớ phân tích nhó", msg, true);
            let targetUrl = rawUrl;
            try {
              const scraped = await universalDownloader.download(rawUrl);
              const v = scraped.medias?.find((m: any) => (m.type === "video" || m.type === "image") && m.url);
              if (v?.url) targetUrl = v.url;
            } catch {}
            const verdict = await checkVideoUrl(targetUrl, rawUrl);
            userDataManager.logActivity(uid, "video", rawUrl, verdict);
            return await safeSend(api, verdict, msg, false);
          }

          if (text) {
            const ans = await answerQuestionWithAI(text);
            userDataManager.logActivity(uid, "question", text, ans);
            return await safeSend(api, ans, msg, true);
          }
        } catch (err: any) {
          console.error("[ZaloBot Error]", err);
          const errDetail = err.response?.data?.detail || "Không thể phân tích tệp này, bạn gửi file trực tiếp hoặc kiểm tra lại đường dẫn nhé!";
          await safeSend(api, errDetail, msg, false);
        }
      });

      api.listener.start();
    } catch (err: any) {
      console.error(`[${this.client.brand}] Khoi dong that bai:`, err.message);
    }
  }
}

export const zaloBot = new ZaloBot();
export function startZaloBot() { zaloBot.start(); }
