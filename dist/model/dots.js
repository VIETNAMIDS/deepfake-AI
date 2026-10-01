"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dotsModel = exports.DotsModel = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
class DotsModel {
    name = "dots";
    async generate(prompt, systemPrompt = "") {
        const keys = config_1.CONFIG.XKIRO_API_KEYS.length ? config_1.CONFIG.XKIRO_API_KEYS : [config_1.CONFIG.XKIRO_API_KEY];
        const messages = [];
        if (systemPrompt)
            messages.push({ role: "system", content: systemPrompt });
        messages.push({ role: "user", content: prompt });
        let lastErr = null;
        for (const key of keys) {
            if (!key)
                continue;
            try {
                const res = await axios_1.default.post(`${config_1.CONFIG.BASE_URL}/chat/completions`, {
                    model: "dots-studio/dots-3-note-preview:free",
                    messages,
                    temperature: 0.2,
                    max_tokens: 800
                }, {
                    headers: {
                        Authorization: `Bearer ${key}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 12000
                });
                const reply = res.data?.choices?.[0]?.message?.content;
                if (reply && reply.trim())
                    return reply.trim();
            }
            catch (err) {
                lastErr = err;
            }
        }
        throw lastErr || new Error("Dots khong the phan hoi.");
    }
}
exports.DotsModel = DotsModel;
exports.dotsModel = new DotsModel();
