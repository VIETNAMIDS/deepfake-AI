"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.react = react;
exports.sendVideoMsg = sendVideoMsg;
exports.sendImagesMsg = sendImagesMsg;
async function react(api, event, type) {
    try {
        await api.addReaction(type, {
            data: { msgId: event.data?.msgId, cliMsgId: event.data?.cliMsgId },
            threadId: event.threadId,
            type: event.type
        });
    }
    catch { }
}
async function sendVideoMsg(api, event, videoUrl, msgBody, meta = {}) {
    const { threadId, type } = event;
    try {
        const duration = meta?.duration ? Math.floor(Number(meta.duration) * 1000) : 10000;
        const payload = {
            msg: msgBody,
            videoUrl,
            thumbnailUrl: meta?.thumbnail || videoUrl,
            duration,
            width: Number(meta?.width) || 720,
            height: Number(meta?.height) || 1280,
            fileSize: Number(meta?.fileSize) || 1048576,
            ttl: 3600000
        };
        await api.sendVideo(payload, threadId, type);
        await react(api, event, "HEART");
    }
    catch (err) {
        await react(api, event, "CRY");
        throw err;
    }
}
async function sendImagesMsg(api, event, images, msgBody) {
    const { threadId, type } = event;
    if (!images || images.length === 0)
        return;
    const chunkSize = 10;
    for (let i = 0; i < images.length; i += chunkSize) {
        const chunk = images.slice(i, i + chunkSize);
        await api.sendMessage({
            msg: i === 0 ? msgBody : "",
            attachments: chunk,
            ttl: 3600000
        }, threadId, type);
    }
    await react(api, event, "HEART");
}
