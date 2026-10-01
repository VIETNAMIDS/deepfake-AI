import { modelRouter } from "../model";
import { CONFIG } from "../config";

export interface ForensicResult {
  has_face?: boolean; deepfake_suspicion_score?: number; suspicion_level?: string;
  technical_anomalies?: string[]; synthid_or_ai_watermark?: string; audio_visual_sync?: string;
  spoken_transcript?: string; spoken_claims?: string[]; scam_risk_score?: number;
  scam_indicators?: string[]; expert_opinion?: string; c2pa?: any;
}

const TEMPLATE_PROMPT = `Bạn là Trưởng ban Giám định Kỹ thuật số DeepCheck AI.
QUY TẮC BẮT BUỘC:
1. TUYỆT ĐỐI KHÔNG dùng dấu sao (*, **), không dùng dấu gạch //, không dùng dấu đầu dòng chấm tròn.
2. CỰC KỲ NGẮN GỌN: Mỗi mục chỉ viết đúng 1 câu súc tích, ngắn gọn.
3. Xuất bản báo cáo đúng cấu trúc:
🔎 DEEPCHECK AI - BÁO CÁO KIỂM CHỨNG TOÀN DIỆN

🎥 1. MỨC ĐỘ NGHI NGỜ DEEPFAKE
- Điểm nghi ngờ: [XX]/100
- Mức độ: [Rất thấp / Thấp / Trung bình / Cao / Rất cao]
- Dấu hiệu kỹ thuật:
  - Hình ảnh và khuôn mặt: [1 câu ngắn]
  - Chuyển động và khẩu hình: [1 câu ngắn]
  - Vật lý và môi trường: [1 câu ngắn]
  - Âm thanh: [1 câu ngắn]

📰 2. KIỂM CHỨNG NỘI DUNG
- Trạng thái: [ĐÚNG / SAI / GÂY HIỂU LẦM / CHƯA ĐỦ BẰNG CHỨNG]
- Đối chiếu thực tế: [1 câu ngắn]

🌐 3. ĐÁNH GIÁ NGUỒN
- Nguồn phát hành: [Tên kênh]
- Điểm tin cậy: [XX]/100 ([Thấp / Trung bình / Cao])
- Cơ sở đánh giá: [1 câu ngắn]

⚠️ 4. ĐÁNH GIÁ NGUY CƠ LỪA ĐẢO
- Mức độ: [Thấp / Trung bình / Cao]
- Kết luận cảnh báo:
[Nếu Thấp: Video này hiện chưa thấy có khả năng lừa đảo cao. Tuy nhiên, bạn vẫn nên kiểm chứng thông tin từ nguồn đáng tin cậy trước khi tin tưởng hoặc chia sẻ.]
[Nếu Trung bình: Video này hiện khả năng lừa đảo chưa thể xác định rõ, bạn nên cẩn thận chú ý.]
[Nếu Cao: Video này có khả năng lừa đảo, bạn nên cẩn thận chú ý.]
- Dấu hiệu rủi ro: [1 câu ngắn]

🔒 5. BẢO VỆ DỮ LIỆU
- Mức độ rủi ro: [Thấp / Trung bình / Cao]
- Khuyến nghị: [1 câu ngắn]

📝 6. KẾT LUẬN CHUNG
[1 câu nhận định tổng quan]. (Lưu ý: Đây là kết quả hỗ trợ đánh giá, không phải kết luận pháp chứng tuyệt đối).

💡 7. BẠN NÊN LÀM GÌ?
- Không vội tin và chia sẻ.
- Kiểm tra chéo với nguồn tin chính thống.
- Tuyệt đối không cung cấp OTP, mật khẩu hay chuyển tiền.
- Báo cáo video nếu phát hiện giả mạo.

💭 Góc phản tư: Điều gì trong video khiến bạn băn khoăn hoặc dễ tin nhất trước khi kiểm chứng?`;

function cleanMarkdown(text: string): string {
  return text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/\/\//g, "").replace(/•/g, "-").trim();
}

export const formatFallbackVerdict = formatFallbackReport;
export function formatFallbackReport(d: ForensicResult): string {
  const score = d.deepfake_suspicion_score ?? 20;
  const lvl = score >= 80 ? "Rất cao" : (score >= 60 ? "Cao" : (score >= 40 ? "Trung bình" : (score >= 20 ? "Thấp" : "Rất thấp")));
  const scamLvl = (d.scam_risk_score ?? 0) >= 50 ? "Cao" : ((d.scam_risk_score ?? 0) >= 30 ? "Trung bình" : (score >= 60 ? "Cao" : "Thấp"));
  const scamWarn = scamLvl === "Cao"
    ? "Video này có khả năng lừa đảo, bạn nên cẩn thận chú ý."
    : (scamLvl === "Trung bình"
      ? "Video này hiện khả năng lừa đảo chưa thể xác định rõ, bạn nên cẩn thận chú ý."
      : "Video này hiện chưa thấy có khả năng lừa đảo cao. Tuy nhiên, bạn vẫn nên kiểm chứng thông tin từ nguồn đáng tin cậy trước khi tin tưởng hoặc chia sẻ.");
  const anom = d.technical_anomalies && d.technical_anomalies.length > 0 ? d.technical_anomalies.join("; ") : "Không phát hiện biến dạng lớn.";
  const raw = `🔎 DEEPCHECK AI - BÁO CÁO KIỂM CHỨNG TOÀN DIỆN\n\n🎥 1. MỨC ĐỘ NGHI NGỜ DEEPFAKE\n- Điểm nghi ngờ: ${score}/100\n- Mức độ: ${lvl}\n- Dấu hiệu kỹ thuật:\n  - Hình ảnh và khuôn mặt: ${anom}\n  - Chuyển động và khẩu hình: ${d.audio_visual_sync || "Tương đối tự nhiên"}\n  - Vật lý và môi trường: ${d.synthid_or_ai_watermark || "Bình thường"}\n  - Âm thanh: ${d.spoken_transcript ? "Có lời thoại bóc băng" : "Bình thường"}\n\n📰 2. KIỂM CHỨNG NỘI DUNG\n- Trạng thái: ${score >= 60 ? "GÂY HIỂU LẦM" : "CHƯA ĐỦ BẰNG CHỨNG"}\n- Đối chiếu thực tế: ${d.expert_opinion || "Cần đối chiếu thêm với các nguồn chính thống."}\n\n🌐 3. ĐÁNH GIÁ NGUỒN\n- Nguồn phát hành: Mạng xã hội\n- Điểm tin cậy: ${score >= 60 ? 30 : 70}/100 (${score >= 60 ? "Thấp" : "Khá cao"})\n- Cơ sở đánh giá: Đánh giá dựa trên dấu vết kỹ thuật số.\n\n⚠️ 4. ĐÁNH GIÁ NGUY CƠ LỪA ĐẢO\n- Mức độ: ${scamLvl}\n- Kết luận cảnh báo:\n${scamWarn}\n- Dấu hiệu rủi ro: ${(d.scam_indicators && d.scam_indicators.length > 0) ? d.scam_indicators.join("; ") : "Không có dấu hiệu lừa đảo tài chính."}\n\n🔒 5. BẢO VỆ DỮ LIỆU\n- Mức độ rủi ro: ${score >= 60 ? "Trung bình" : "Thấp"}\n- Khuyến nghị: Hạn chế tương tác bình luận hoặc chia sẻ thông tin khi chưa xác minh.\n\n📝 6. KẾT LUẬN CHUNG\n${d.expert_opinion || "Video phục vụ mục đích giải trí hoặc thử nghiệm công nghệ."} (Lưu ý: Đây là kết quả hỗ trợ đánh giá, không phải kết luận pháp chứng tuyệt đối).\n\n💡 7. BẠN NÊN LÀM GÌ?\n- Không vội tin và chia sẻ.\n- Kiểm tra chéo với nguồn tin chính thống.\n- Tuyệt đối không cung cấp OTP, mật khẩu hay chuyển tiền.\n- Báo cáo video nếu phát hiện giả mạo.\n\n💭 Góc phản tư: Điều gì trong video khiến bạn băn khoăn hoặc dễ tin nhất trước khi kiểm chứng?`;
  return cleanMarkdown(raw);
}

export async function deliberateWithJudge(data: ForensicResult): Promise<string> {
  const raw = (CONFIG.MODEL || "mistral").toLowerCase();
  const reportModel = raw.includes("mistral") ? "mistral" : (raw.includes("minimax") ? "minimax" : (raw.includes("qwen") ? "qwen" : (raw.includes("/") ? raw.split("/")[0] : raw)));
  const summary = `GIÁM ĐỊNH VIDEO: Điểm: ${data.deepfake_suspicion_score ?? 20}/100, Mức độ: ${data.suspicion_level || "Thấp"}, Dị thường: ${(data.technical_anomalies || []).join("; ")}, Watermark: ${data.synthid_or_ai_watermark || "Không"}, Khẩu hình: ${data.audio_visual_sync || "Bình thường"}, Lời thoại: ${data.spoken_transcript || ""}, Ý kiến: ${data.expert_opinion || ""}`;
  try {
    const res = await modelRouter.ask(`${summary}\n\nHãy xuất bản báo cáo cực kỳ ngắn gọn, không dùng dấu sao (*) hay gạch (//).`, TEMPLATE_PROMPT, reportModel);
    if (res && res.includes("DEEPCHECK AI")) return cleanMarkdown(res);
  } catch {}
  return formatFallbackReport(data);
}
