"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twitterDownloader = exports.TwitterDownloader = void 0;
const axios_1 = __importDefault(require("axios"));
class TwitterDownloader {
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    };
    isTwitterUrl(url) {
        return /twitter\.com|x\.com|t\.co/i.test(String(url || ""));
    }
    async resolveRedirect(url) {
        if (!/t\.co/i.test(url))
            return url;
        try {
            const res = await axios_1.default.get(url, { maxRedirects: 5, timeout: 5000, headers: this.headers });
            return res.request?.res?.responseUrl || url;
        }
        catch {
            return url;
        }
    }
    extractTweetInfo(url) {
        const str = String(url || "");
        const idMatch = str.match(/status\/(\d+)/i);
        const userMatch = str.match(/(?:twitter\.com|x\.com)\/([^/?#]+)\/status/i);
        return {
            id: idMatch ? idMatch[1] : null,
            username: userMatch && userMatch[1] !== "i" ? userMatch[1] : null
        };
    }
    async download(url) {
        const resolved = await this.resolveRedirect(url);
        const { id, username } = this.extractTweetInfo(resolved);
        if (!id)
            throw new Error("Không trích xuất được Tweet ID");
        const endpoints = [
            `https://api.fxtwitter.com/status/${id}`,
            `https://api.fxtwitter.com/i/status/${id}`,
            ...(username ? [`https://api.fxtwitter.com/${username}/status/${id}`] : [])
        ];
        for (const ep of endpoints) {
            try {
                const { data } = await axios_1.default.get(ep, { headers: this.headers, timeout: 8000 });
                const tweet = data?.tweet;
                if (!tweet)
                    continue;
                const medias = [];
                if (Array.isArray(tweet.media?.videos)) {
                    for (const v of tweet.media.videos) {
                        let bestUrl = v.url;
                        if (Array.isArray(v.variants) && v.variants.length > 0) {
                            const mp4s = v.variants.filter((vr) => vr.content_type === "video/mp4" && vr.url).sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
                            if (mp4s.length > 0)
                                bestUrl = mp4s[0].url;
                        }
                        if (bestUrl)
                            medias.push({ type: "video", url: bestUrl, thumbnail: v.thumbnail_url || "", duration: Number(v.duration) || 0, width: Number(v.width) || 720, height: Number(v.height) || 1280 });
                    }
                }
                if (Array.isArray(tweet.media?.photos)) {
                    for (const p of tweet.media.photos) {
                        if (p.url)
                            medias.push({ type: "image", url: p.url, thumbnail: p.url });
                    }
                }
                return {
                    id,
                    title: tweet.text || "X (Twitter) Post",
                    author: tweet.author?.name ? `${tweet.author.name} (@${tweet.author.screen_name})` : "Twitter User",
                    platform: "Twitter (X)",
                    medias
                };
            }
            catch { }
        }
        throw new Error("Không tìm thấy media từ bài đăng X (Twitter)");
    }
}
exports.TwitterDownloader = TwitterDownloader;
exports.twitterDownloader = new TwitterDownloader();
