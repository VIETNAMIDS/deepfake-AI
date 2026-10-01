import axios from "axios";
import { CONFIG } from "../config";

export class GeminiModel {
  name = "gemini";

  async generate(prompt: string, systemPrompt = ""): Promise<string> {
    if (!CONFIG.GEMINI_API_KEY) throw new Error("Thieu GEMINI_API_KEY");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
    const payload: any = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
    };
    if (systemPrompt) {
      payload.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const res = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 25000
    });

    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || !text.trim()) throw new Error("Gemini khong tra ve ket qua.");
    return text.trim();
  }
}

export const geminiModel = new GeminiModel();
