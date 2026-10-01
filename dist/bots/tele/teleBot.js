"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTeleBot = startTeleBot;
const grammy_1 = require("grammy");
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../../config");
const autodown_1 = require("../../autodown");
const CHECKVIDEO_1 = require("../../CHECKVIDEO");
const AI_ask_1 = require("../../AI_ask");
const data_1 = require("../../data");
const bot = new grammy_1.Bot(config_1.CONFIG.TELEGRAM_BOT_TOKEN);
const START_MSG = `Xin chào! Mình là DeepCheck AI — trợ lý kiểm chứng thông tin & Deepfake.
Mình có thể giúp bạn:
• Cảnh báo % video thật/giả siêu tốc
• Nhận diện dấu vết Deepfake & Thủy vân số SynthID
• Phân tích tâm lý vì sao chúng ta dễ tin nội dung giả mạo
Gửi link hoặc video để bắt đầu. Đừng tin chỉ vì AI nói, hãy kiểm tra bằng chứng!`;
async function replyInChunks(ctx, text) {
    for (let i = 0; i < text.length; i += 4000)
        await ctx.reply(text.slice(i, i + 4000));
}
function recordUser(ctx) {
    const uid = String(ctx.from?.id || "");
    const name = [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(" ");
    data_1.userDataManager.saveUser(uid, "tele", name);
    return uid;
}
bot.command("start", async (ctx) => {
    recordUser(ctx);
    return ctx.reply(START_MSG);
});
bot.on([":video", ":document"], async (ctx) => {
    const fileObj = ctx.message?.video || ctx.message?.document;
    if (!fileObj)
        return;
    const uid = recordUser(ctx);
    const statusMsg = await ctx.reply("⏳ Đang tải video...");
    try {
        const file = await ctx.api.getFile(fileObj.file_id);
        const fileUrl = `https://api.telegram.org/file/bot${config_1.CONFIG.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
        const videoStream = await axios_1.default.get(fileUrl, { responseType: "stream" });
        await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, "🔍 Đang quét Deepfake vi phẫu siêu tốc...");
        const verdict = await (0, CHECKVIDEO_1.checkVideoFile)(videoStream.data, "input.mp4");
        data_1.userDataManager.logActivity(uid, "video", fileObj.file_id, verdict);
        await replyInChunks(ctx, verdict);
        await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => null);
    }
    catch (err) {
        await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, `⚠️ Lỗi: ${err.response?.data?.detail || err.message}`);
    }
});
bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith("/"))
        return;
    const uid = recordUser(ctx);
    if (!/^https?:\/\/[^\s]+$/i.test(text)) {
        if (/^(chào|hello|hi|alo|xin chào)/i.test(text))
            return ctx.reply(START_MSG);
        const answer = await (0, AI_ask_1.answerQuestionWithAI)(text);
        data_1.userDataManager.logActivity(uid, "question", text, answer);
        return replyInChunks(ctx, answer);
    }
    const statusMsg = await ctx.reply("⏳ Đang tải video từ link...");
    try {
        let targetUrl = text;
        try {
            const scraped = await autodown_1.universalDownloader.download(text);
            const v = scraped.medias?.find((m) => m.type === "video" && m.url);
            if (v?.url)
                targetUrl = v.url;
        }
        catch { }
        await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, "🔍 Đang phân tích Deepfake siêu tốc...");
        const verdict = await (0, CHECKVIDEO_1.checkVideoUrl)(targetUrl, text);
        data_1.userDataManager.logActivity(uid, "video", text, verdict);
        await replyInChunks(ctx, verdict);
        await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => null);
    }
    catch (err) {
        await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, `⚠️ Lỗi link: ${err.response?.data?.detail || err.message}`);
    }
});
function startTeleBot() {
    if (!config_1.CONFIG.TELEGRAM_BOT_TOKEN)
        return console.log("[TeleBot] Bo qua vi thieu TELEGRAM_BOT_TOKEN");
    console.log("[TeleBot] Running...");
    bot.start();
}
