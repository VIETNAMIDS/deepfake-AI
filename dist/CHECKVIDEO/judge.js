"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatFallbackVerdict = formatFallbackVerdict;
exports.deliberateWithJudge = deliberateWithJudge;
const model_1 = require("../model");
const CRITICAL_JUDGE_PROMPT = `Bạn là Thẩm định viên Trưởng DeepCheck AI.
QUY TẮC BẮT BUỘC:
- Dưới 60% (<60%) kết luận là REAL (Thật/đời thường).
- Từ 60% trở lên (>=60%) kết luận là AI / DEEPFAKE (Can thiệp AI/tạo sinh).
- 5 PHÉP KIỂM CHỨNG VẬT LÝ (KỂ CẢ KHI BỊ XÓA WATERMARK):
  1. ÂM MÔI: Khi nói từ có /b, m, p/ (ví dụ: cabin, bạn, một), môi người thật phải khép chặt. Môi hở mà có tiếng -> AI Avatar.
  2. QUANG HỌC: Đốm sáng phản chiếu trong 2 đồng tử mắt và tròng kính phải đối xứng 3D cùng nguồn sáng. Bất đối xứng -> AI.
  3. THỜI GIAN: Khớp ngón tay, móng tay hoặc viền tóc bị trôi mờ/dính ngón (micro-morphing) qua các frame -> AI.
  4. ÂM HỌC: Giọng thiếu tiếng thở sinh học, dải âm khô không có độ vang phòng tự nhiên (reverberation) -> TTS.
  5. ĐỘNG HỌC: Người đi lướt trượt không trọng lực (sliding walk) -> AI Image-to-Video.
Nếu vi phạm từ 2 phép thử trên, kết luận ngay >= 90% (Khẳng định AI).
Xuất đúng báo cáo chuẩn:
🔎 DEEPCHECK AI – KẾT QUẢ KIỂM CHỨNG
🎥 1. MỨC ĐỘ NGHI NGỜ DEEPFAKE (Điểm/100, Mức độ: <60% Real, >=60% AI, Dấu hiệu)
2. CHỮ KÝ MÃ HÓA C2PA & THỦY VÂN SỐ SYNTHID (Content Credentials & Digital Watermark)
3. KIỂM CHỨNG NỘI DUNG & ĐỒNG BỘ ÂM THANH (Soi kỹ giọng AI TTS/Synthetic voice)
4. ĐÁNH GIÁ NGUỒN & KÊNH ĐĂNG
5. NGUY CƠ LỪA ĐẢO / DẤU CHÂN SỐ
6. KẾT LUẬN (Chốt rõ: Real hay AI dựa trên mốc 60%)
7. BẠN NÊN LÀM GÌ?
Kèm câu hỏi phản tư: Điều gì khiến bạn tin video này?`;
function formatFallbackVerdict(data) {
    const score = data.deepfake_suspicion_score ?? (data.gemini?.deepfake_suspicion_score ?? 0);
    const isAi = score >= 60 || data.c2pa?.is_ai_generated;
    const c2paInfo = data.c2pa?.summary || "Không phát hiện chữ ký C2PA";
    const synthidInfo = data.synthid_or_ai_watermark || data.gemini?.synthid_or_ai_watermark || "Chưa phát hiện thủy vân số";
    const anomalies = (data.technical_anomalies || data.gemini?.technical_anomalies || ["Không phát hiện"]).map((a) => `• ${a}`).join("\n");
    const claims = (data.spoken_claims || data.gemini?.spoken_claims || ["Không có"]).map((c) => `• ${c}`).join("\n");
    return [
        "🔎 DEEPCHECK AI – KẾT QUẢ KIỂM CHỨNG\n",
        `🎥 1. MỨC ĐỘ NGHI NGỜ: ${score}/100 [${isAi ? "🔴 AI / DEEPFAKE (>=60%)" : "🟢 REAL (<60%)"}]\nDấu hiệu:\n${anomalies}\n`,
        `2. CHỮ KÝ C2PA & THỦY VÂN SỐ SYNTHID:\n• C2PA: ${c2paInfo}\n• Thủy vân SynthID: ${synthidInfo}\n`,
        `3. KIỂM CHỨNG NỘI DUNG:\n${claims}\n`,
        "4. ĐÁNH GIÁ NGUỒN: Cần đối chiếu thêm với nguồn tin chính thống.\n",
        `5. NGUY CƠ LỪA ĐẢO: Điểm ${data.scam_risk_score ?? 0}/100\n`,
        `6. KẾT LUẬN: ${isAi ? "Video có can thiệp hoặc tạo bởi AI." : "Video thật, chưa phát hiện can thiệp AI."}\n`,
        "7. BẠN NÊN LÀM GÌ?\n• Không vội chia sẻ khi chưa kiểm chứng.\n",
        "❓ Câu hỏi suy ngẫm: Điều gì ở video này từng khiến bạn cảm thấy tin tưởng nhất?"
    ].join("\n");
}
async function deliberateWithJudge(data) {
    const userContent = `Dưới đây là kết quả sơ bộ từ Server Python. Hãy áp dụng 5 phép kiểm chứng vật lý và chốt báo cáo 7 phần:\n\n${JSON.stringify(data, null, 2)}`;
    try {
        return await model_1.modelRouter.ask(userContent, CRITICAL_JUDGE_PROMPT, "router9");
    }
    catch {
        return formatFallbackVerdict(data);
    }
}
