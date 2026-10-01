"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zaloBot = exports.ZaloBot = void 0;
exports.startZaloBot = startZaloBot;
const ruaxbonzZalo_1 = require("./ruaxbonzZalo");
const CHECKVIDEO_1 = require("../../CHECKVIDEO");
const AI_ask_1 = require("../../AI_ask");
const autodown_1 = require("../../autodown");
const data_1 = require("../../data");
class ZaloBot {
    client = new ruaxbonzZalo_1.RuaxbonzZalo();
    async start() {
        try {
            const api = await this.client.init();
            console.log(`[${this.client.brand}] Ket noi Zalo thanh cong! Dang listen tin nhan...`);
            api.listener.on("message", async (msg) => {
                if (msg.isSelf || typeof msg.data?.content !== "string")
                    return;
                const text = msg.data.content.trim();
                const uid = String(msg.data.uidFrom || msg.threadId);
                data_1.userDataManager.saveUser(uid, "zalo");
                try {
                    if (!/^https?:\/\/[^\s]+$/i.test(text)) {
                        const ans = await (0, AI_ask_1.answerQuestionWithAI)(text);
                        data_1.userDataManager.logActivity(uid, "question", text, ans);
                        return await api.sendMessage({ msg: ans, quote: msg.data }, msg.threadId, msg.type);
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
                    data_1.userDataManager.logActivity(uid, "video", text, verdict);
                    await api.sendMessage({ msg: verdict, quote: msg.data }, msg.threadId, msg.type);
                }
                catch (err) {
                    await api.sendMessage({ msg: `Loi: ${err.message}` }, msg.threadId, msg.type);
                }
            });
            api.listener.start();
        }
        catch (err) {
            console.error(`[${this.client.brand}] Khoi dong that bai:`, err.message);
        }
    }
}
exports.ZaloBot = ZaloBot;
exports.zaloBot = new ZaloBot();
function startZaloBot() {
    exports.zaloBot.start();
}
