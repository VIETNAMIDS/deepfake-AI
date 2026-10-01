import axios from "axios";
import { CONFIG } from "../config";

export class Router9Model {
  name = "router9";

  private fallbackModels = [
    "ag/gemini-3.8-flash",
    "ag/claude-sonnet-4-6",
    "ag/gpt-oss-120b-medium",
    "ag/gemini-3.7-flash-high"
  ];

  async generate(prompt: string, systemPrompt = ""): Promise<string> {
    const baseUrl = CONFIG.ROUTER9_BASE_URL || "http://127.0.0.1:20128/v1";
    const apiKey = CONFIG.ROUTER9_API_KEY || "sk-863b3c9f2084d6fa-0rj8p6-f15ccd8b";

    const messages: any[] = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    const modelsToTry = [CONFIG.ROUTER9_MODEL, ...this.fallbackModels].filter(
      (m, i, a): m is string => Boolean(m) && a.indexOf(m) === i
    );

    let lastErr: any = null;

    for (const model of modelsToTry) {
      try {
        const res = await axios.post(
          `${baseUrl}/chat/completions`,
          {
            model,
            messages,
            temperature: 0.2,
            max_tokens: 1200,
            stream: false
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            timeout: 20000
          }
        );

        const reply = res.data?.choices?.[0]?.message?.content;
        if (reply && reply.trim()) {
          return reply.trim();
        }
      } catch (err: any) {
        lastErr = err;
      }
    }

    throw lastErr || new Error("9Router không phản hồi qua bất kỳ mô hình nào.");
  }
}

export const router9Model = new Router9Model();
