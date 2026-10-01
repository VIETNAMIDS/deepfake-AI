import axios from "axios";
import { CONFIG } from "../config";

export class LingModel {
  name = "ling";

  async generate(prompt: string, systemPrompt = ""): Promise<string> {
    const keys = CONFIG.XKIRO_API_KEYS.length ? CONFIG.XKIRO_API_KEYS : [CONFIG.XKIRO_API_KEY];
    const messages = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    let lastErr: any = null;
    for (const key of keys) {
      if (!key) continue;
      try {
        const res = await axios.post(
          `${CONFIG.BASE_URL}/chat/completions`,
          {
            model: "inclusionai/ling-3.0-flash-sante:free",
            messages,
            temperature: 0.2,
            max_tokens: 1200,
            stream: false
          },
          {
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json"
            },
            timeout: 25000
          }
        );
        const reply = res.data?.choices?.[0]?.message?.content;
        if (reply && reply.trim()) return reply.trim();
      } catch (err: any) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("Ling khong the phan hoi.");
  }
}

export const lingModel = new LingModel();
