"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gptModel = exports.GptModel = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
class GptModel {
    name = "gpt";
    async generate(prompt, systemPrompt = "", modelName = "openai/gpt-4o") {
        const apiKey = process.env.OPENROUTER_API_KEY || config_1.CONFIG.XKIRO_API_KEY;
        if (!apiKey)
            throw new Error("Thieu API key cho GPT");
        const baseUrl = process.env.OPENROUTER_BASE_URL || config_1.CONFIG.BASE_URL;
        const messages = [];
        if (systemPrompt)
            messages.push({ role: "system", content: systemPrompt });
        messages.push({ role: "user", content: prompt });
        const res = await axios_1.default.post(`${baseUrl}/chat/completions`, {
            model: modelName,
            messages,
            temperature: 0.2,
            max_tokens: 800
        }, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            timeout: 30000
        });
        const reply = res.data?.choices?.[0]?.message?.content;
        if (!reply || !reply.trim())
            throw new Error("GPT khong tra ve ket qua.");
        return reply.trim();
    }
}
exports.GptModel = GptModel;
exports.gptModel = new GptModel();
