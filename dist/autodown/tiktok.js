"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tiktokDownloader = exports.TikTokDownloader = void 0;
const axios_1 = __importDefault(require("axios"));
class TikTokDownloader {
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    };
    async resolveShortUrl(shortUrl) {
        try {
            const res = await axios_1.default.get(shortUrl, { headers: this.headers, maxRedirects: 5, timeout: 5000 });
            return res.request?.res?.responseUrl || shortUrl;
        }
        catch (e) {
            return e.response?.request?.res?.responseUrl || shortUrl;
        }
    }
    async download(rawUrl) {
        let url = rawUrl.trim();
        if (/vm\.tiktok\.com|vt\.tiktok\.com|\/t\//i.test(url)) {
            url = await this.resolveShortUrl(url);
        }
        const cleanUrl = url.split("?")[0];
        try {
            const res = await axios_1.default.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}&hd=1`, { headers: this.headers, timeout: 7000 });
            if (res.data?.code === 0 && res.data?.data) {
                const d = res.data.data;
                const medias = [];
                if (Array.isArray(d.images) && d.images.length > 0) {
                    d.images.forEach((img) => medias.push({ type: "image", url: img }));
                }
                else if (d.play || d.hdplay) {
                    let pUrl = d.hdplay || d.play;
                    if (pUrl && !pUrl.startsWith("http"))
                        pUrl = `https://www.tikwm.com${pUrl}`;
                    medias.push({ type: "video", url: pUrl, thumbnail: d.cover, duration: Number(d.duration) || 0 });
                }
                if (d.music)
                    medias.push({ type: "audio", url: d.music });
                return {
                    id: d.id,
                    title: d.title || "TikTok Video",
                    author: d.author?.nickname || "TikTok Creator",
                    thumbnail: d.cover,
                    duration: Number(d.duration) || 0,
                    platform: "TikTok",
                    medias
                };
            }
        }
        catch { }
        try {
            const loveRes = await axios_1.default.post("https://lovetik.com/api/ajax/search", `query=${encodeURIComponent(cleanUrl)}`, { headers: { ...this.headers, "Content-Type": "application/x-www-form-urlencoded" }, timeout: 7000 });
            if (loveRes.data?.links) {
                const links = loveRes.data.links;
                const hd = links.find((l) => l.a === "nowatermark_hd") || links.find((l) => l.a === "nowatermark");
                return {
                    id: loveRes.data.vid,
                    title: loveRes.data.desc || "TikTok Video",
                    author: loveRes.data.author,
                    platform: "TikTok",
                    medias: [{ type: "video", url: hd?.a_url || links[0]?.a_url }]
                };
            }
        }
        catch { }
        throw new Error("Không thể trích xuất video TikTok từ link này.");
    }
}
exports.TikTokDownloader = TikTokDownloader;
exports.tiktokDownloader = new TikTokDownloader();
