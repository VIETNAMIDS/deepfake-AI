import { youtubeDownloader } from "./youtube";
import { tiktokDownloader } from "./tiktok";
import { twitterDownloader } from "./twitter";
import { searchCapcut } from "./capcut";

export class UniversalDownloader {
  private downloaders: Record<string, any> = {
    youtube: youtubeDownloader,
    tiktok: tiktokDownloader,
    twitter: twitterDownloader
  };

  private patterns = [
    { regex: /youtube\.com|youtu\.be/i, key: "youtube", name: "YouTube" },
    { regex: /tiktok\.com|douyin\.com/i, key: "tiktok", name: "TikTok" },
    { regex: /twitter\.com|x\.com|t\.co/i, key: "twitter", name: "Twitter/X" }
  ];

  detectPlatform(url: string) {
    for (const p of this.patterns) {
      if (p.regex.test(url)) return { downloader: this.downloaders[p.key], name: p.name, key: p.key };
    }
    return null;
  }

  async download(url: string, options: any = {}) {
    const platform = this.detectPlatform(url);
    if (!platform) throw new Error("Nền tảng không được hỗ trợ.");
    const result = await platform.downloader.download(url, options);
    if (!result || !result.medias?.length) throw new Error("Không tìm thấy media hợp lệ từ đường link.");
    return result;
  }
}

export const universalDownloader = new UniversalDownloader();
export { youtubeDownloader, tiktokDownloader, twitterDownloader, searchCapcut };
