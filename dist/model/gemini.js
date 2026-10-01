"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiModel = exports.GeminiModel = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
class GeminiModel {
    name = "gemini";
    async generate(prompt, systemPrompt = "") {
        if (!config_1.CONFIG.GEMINI_API_KEY)
            throw new Error("Thieu GEMINI_API_KEY");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config_1.CONFIG.GEMINI_API_KEY}`;
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
        };
        if (systemPrompt) {
            payload.systemInstruction = { parts: [{ text: systemPrompt }] };
        }
        const res = await axios_1.default.post(url, payload, {
            headers: { "Content-Type": "application/json" },
            timeout: 25000
        });
        const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text || !text.trim())
            throw new Error("Gemini khong tra ve ket qua.");
        return text.trim();
    }
}
exports.GeminiModel = GeminiModel;
exports.geminiModel = new GeminiModel();
