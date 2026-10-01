import axios from "axios";

export interface TikTokMedia {
  type: "video" | "image" | "audio";
  url: string;
  quality?: string;
  thumbnail?: string;
  duration?: number;
}

export class TikTokDownloader {
  private headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  };

  async resolveShortUrl(shortUrl: string): Promise<string> {
    try {
      const res = await axios.get(shortUrl, { headers: this.headers, maxRedirects: 5, timeout: 5000 });
      return res.request?.res?.responseUrl || shortUrl;
    } catch (e: any) {
      return e.response?.request?.res?.responseUrl || shortUrl;
    }
  }

  async download(rawUrl: string): Promise<any> {
    let url = rawUrl.trim();
    if (/vm\.tiktok\.com|vt\.tiktok\.com|\/t\//i.test(url)) {
      url = await this.resolveShortUrl(url);
    }
    const cleanUrl = url.split("?")[0];

    try {
      const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}&hd=1`, { headers: this.headers, timeout: 7000 });
      if (res.data?.code === 0 && res.data?.data) {
        const d = res.data.data;
        const medias: TikTokMedia[] = [];

        if (Array.isArray(d.images) && d.images.length > 0) {
          d.images.forEach((img: string) => medias.push({ type: "image", url: img }));
        } else if (d.play || d.hdplay) {
          let pUrl = d.hdplay || d.play;
          if (pUrl && !pUrl.startsWith("http")) pUrl = `https://www.tikwm.com${pUrl}`;
          medias.push({ type: "video", url: pUrl, thumbnail: d.cover, duration: Number(d.duration) || 0 });
        }
        if (d.music) medias.push({ type: "audio", url: d.music });

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
    } catch {}

    try {
      const loveRes = await axios.post("https://lovetik.com/api/ajax/search", `query=${encodeURIComponent(cleanUrl)}`, { headers: { ...this.headers, "Content-Type": "application/x-www-form-urlencoded" }, timeout: 7000 });
      if (loveRes.data?.links) {
        const links = loveRes.data.links;
        const hd = links.find((l: any) => l.a === "nowatermark_hd") || links.find((l: any) => l.a === "nowatermark");
        return {
          id: loveRes.data.vid,
          title: loveRes.data.desc || "TikTok Video",
          author: loveRes.data.author,
          platform: "TikTok",
          medias: [{ type: "video", url: hd?.a_url || links[0]?.a_url }]
        };
      }
    } catch {}

    throw new Error("Không thể trích xuất video TikTok từ link này.");
  }
}

export const tiktokDownloader = new TikTokDownloader();
