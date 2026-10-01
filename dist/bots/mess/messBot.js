"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messengerBot = exports.MessengerBot = void 0;
exports.startMessBot = startMessBot;
const http_1 = __importDefault(require("http"));
const url_1 = __importDefault(require("url"));
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../../config");
const CHECKVIDEO_1 = require("../../CHECKVIDEO");
const AI_ask_1 = require("../../AI_ask");
const autodown_1 = require("../../autodown");
const data_1 = require("../../data");
class MessengerBot {
    async sendMessage(psid, text) {
        if (!config_1.CONFIG.PAGE_ACCESS_TOKEN)
            return;
        for (let i = 0; i < text.length; i += 2000) {
            await axios_1.default.post("https://graph.facebook.com/v21.0/me/messages", { recipient: { id: psid }, message: { text: text.slice(i, i + 2000) } }, { params: { access_token: config_1.CONFIG.PAGE_ACCESS_TOKEN } }).catch(() => null);
        }
    }
    async processEvent(event) {
        const psid = event.sender?.id;
        const text = event.message?.text?.trim();
        if (!psid || !text)
            return;
        data_1.userDataManager.saveUser(psid, "mess");
        if (!/^https?:\/\/[^\s]+$/i.test(text)) {
            const answer = await (0, AI_ask_1.answerQuestionWithAI)(text);
            data_1.userDataManager.logActivity(psid, "question", text, answer);
            return this.sendMessage(psid, answer);
        }
        let targetUrl = text;
        try {
            const scraped = await autodown_1.universalDownloader.download(text);
            const v = scraped.medias?.find((m) => m.type === "video" && m.url);
            if (v?.url)
                targetUrl = v.url;
        }
        catch { }
        const verdict = await (0, CHECKVIDEO_1.checkVideoUrl)(targetUrl, text);
        data_1.userDataManager.logActivity(psid, "video", text, verdict);
        return this.sendMessage(psid, verdict);
    }
    start() {
        const server = http_1.default.createServer(async (req, res) => {
            const parsed = url_1.default.parse(req.url || "", true);
            if (req.method === "GET" && parsed.pathname === "/webhook") {
                const mode = parsed.query["hub.mode"];
                const token = parsed.query["hub.verify_token"];
                const challenge = parsed.query["hub.challenge"];
                if (mode === "subscribe" && token === config_1.CONFIG.VERIFY_TOKEN) {
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
                                for (const ev of entry.messaging || [])
                                    await this.processEvent(ev);
                            }
                        }
                    }
                    catch { }
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ status: "EVENT_RECEIVED" }));
                });
                return;
            }
            res.writeHead(404);
            res.end();
        });
        server.listen(config_1.CONFIG.MESSENGER_PORT, () => {
            console.log(`[MessengerBot] Webhook dang chay tai port ${config_1.CONFIG.MESSENGER_PORT}`);
        });
    }
}
exports.MessengerBot = MessengerBot;
exports.messengerBot = new MessengerBot();
function startMessBot() {
    exports.messengerBot.start();
}
