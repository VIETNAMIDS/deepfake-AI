"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageBot = exports.MessageBot = void 0;
exports.startMessageBot = startMessageBot;
const CHECKVIDEO_1 = require("../../CHECKVIDEO");
const AI_ask_1 = require("../../AI_ask");
class MessageBot {
    async processMessage(content) {
        const text = content.trim();
        if (!text)
            return "Vui lòng gửi câu hỏi hoặc link video cần kiểm chứng.";
        if (/^https?:\/\/[^\s]+$/i.test(text)) {
            return (0, CHECKVIDEO_1.checkVideoUrl)(text);
        }
        return (0, AI_ask_1.answerQuestionWithAI)(text);
    }
    start() {
        console.log("[MessageBot] Ready for SMS/WebChat message integration.");
    }
}
exports.MessageBot = MessageBot;
exports.messageBot = new MessageBot();
function startMessageBot() {
    exports.messageBot.start();
}
