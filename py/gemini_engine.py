import os, sys, json, time, base64, requests
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")
libs_target = ROOT_DIR / "python_libs"
if libs_target.exists() and str(libs_target) not in sys.path:
    sys.path.insert(0, str(libs_target))

FORENSIC_PROMPT = """Chuyen gia giam dinh hinh su ky thuat so DeepCheck AI. Phan tich vi mo video/anh va cac anh phong to 4 goc:
1. WATERMARK & 4 GOC: Soi ky cac anh goc. Neu co logo Veo, Sora, Kling, Luma, Runway, Hailuo, Pika hoac nhan AI-generated -> Day la video 100% do AI tao sinh (Text-to-Video), deepfake_suspicion_score >= 95.
2. TAY & HINH THE: Bien dang ngon tay, thua/dinh ngon, co cao su, vien toc, da sap cua video tao sinh Text-to-Video.
3. KHAU HINH & MAT: Khep moi /b, m, p/, vien rang, luoi, cam, ranh gioi hoan doi mat (face-swap), phan xa 3D dong tu.
4. AM HOC & LUA DAO: Boc bang loi thoai. Phat hien TTS, long tieng lech khau hinh, mao danh VTV/bac si/KOL, lua dao.
Tra ve JSON:
{"has_face": true, "deepfake_suspicion_score": 98, "suspicion_level": "Rat cao / Cao / Trung binh / Thap / Rat thap", "technical_anomalies": ["Phat hien watermark Veo goc phai", "Bien dang ngon tay"], "synthid_or_ai_watermark": "Phat hien [ten] / Khong co", "audio_visual_sync": "Khop tu nhien / Long tieng nguoi that / Giong AI TTS / Lech khau hinh AI", "spoken_transcript": "Boc bang tom tat day du loi thoai trong video", "spoken_claims": ["Thong diep, noi dung su viec hoac yeu cau trong video"], "scam_risk_score": 5, "scam_indicators": ["Dau hieu lua dao neu co"], "expert_opinion": "Phan tich ban chat ky thuat, nguon goc mo hinh tao sinh va ket luan video"}"""

def extract_corner_crops(file_path: str):
    crops = []
    try:
        import cv2
        frame = cv2.imread(file_path)
        if frame is not None:
            h, w, _ = frame.shape
            for c in [frame[int(h*0.85):h, int(w*0.7):w], frame[int(h*0.85):h, 0:int(w*0.35)]]:
                _, buf = cv2.imencode(".jpg", c)
                crops.append(base64.b64encode(buf).decode("utf-8"))
            return crops
        cap = cv2.VideoCapture(file_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        for sec in [1.5, 4.0]:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(sec * fps))
            ret, frame = cap.read()
            if not ret or frame is None: continue
            h, w, _ = frame.shape
            for c in [frame[int(h*0.85):h, int(w*0.7):w], frame[int(h*0.85):h, 0:int(w*0.35)]]:
                _, buf = cv2.imencode(".jpg", c)
                crops.append(base64.b64encode(buf).decode("utf-8"))
        cap.release()
    except Exception: pass
    return crops

def extract_json_from_text(text: str) -> dict:
    if not text: raise ValueError("Phan hoi trong tu mo hinh.")
    cleaned = text.strip()
    if cleaned.startswith("```json"): cleaned = cleaned[7:]
    elif cleaned.startswith("```"): cleaned = cleaned[3:]
    if cleaned.endswith("```"): cleaned = cleaned[:-3]
    return json.loads(cleaned.strip())

def analyze_video_with_9router(file_path: str, base_url: str = None, api_key: str = None, model: str = None) -> dict:
    base_url = base_url or os.getenv("ROUTER9_BASE_URL", "http://127.0.0.1:20128/v1")
    api_key = api_key or os.getenv("ROUTER9_API_KEY", "sk-863b3c9f2084d6fa-0rj8p6-f15ccd8b")
    model = model or os.getenv("ROUTER9_MODEL", "ag/gemini-3.8-flash")
    with open(file_path, "rb") as f: video_b64 = base64.b64encode(f.read()).decode("utf-8")
    is_img = any(file_path.lower().endswith(x) for x in [".jpg", ".jpeg", ".png", ".webp"])
    mime = "image/jpeg" if is_img else "video/mp4"
    user_content = [{"type": "text", "text": FORENSIC_PROMPT}, {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{video_b64}"}}]
    for c_b64 in extract_corner_crops(file_path):
        user_content.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{c_b64}"}})
    payload = {"model": model, "messages": [{"role": "user", "content": user_content}], "temperature": 0.1, "response_format": {"type": "json_object"}, "stream": False}
    res = requests.post(f"{base_url.rstrip('/')}/chat/completions", json=payload, headers={"Authorization": f"Bearer {api_key}"}, timeout=45)
    if res.status_code != 200: raise RuntimeError(f"9Router loi {res.status_code}: {res.text[:150]}")
    raw = res.text.strip()
    if raw.startswith("data:"):
        content = "".join([json.loads(l[5:].strip()).get("choices", [{}])[0].get("delta", {}).get("content", "") for l in raw.splitlines() if l.startswith("data:") and not l.endswith("[DONE]")])
    else: content = res.json().get("choices", [{}])[0].get("message", {}).get("content", "")
    return extract_json_from_text(content)

def analyze_video_stream(file_path: str, api_key: str) -> dict:
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=api_key)
    vf = client.files.upload(file=file_path)
    try:
        while str(vf.state).endswith("PROCESSING"):
            time.sleep(0.5)
            vf = client.files.get(name=vf.name)
        if str(vf.state).endswith("FAILED"): raise RuntimeError("Gemini video processing failed.")
        contents = [vf, FORENSIC_PROMPT]
        for c_b64 in extract_corner_crops(file_path):
            contents.append(types.Part.from_bytes(data=base64.b64decode(c_b64), mime_type="image/jpeg"))
        for m in ["gemini-3.5-flash-lite", "gemini-flash-latest"]:
            try:
                res = client.models.generate_content(model=m, contents=contents, config=types.GenerateContentConfig(response_mime_type="application/json"))
                return extract_json_from_text(res.text)
            except Exception: time.sleep(0.5)
        raise RuntimeError("Gemini models failed.")
    finally:
        try: client.files.delete(name=vf.name)
        except Exception: pass

def analyze_video(file_path: str) -> dict:
    try: return analyze_video_with_9router(file_path)
    except Exception as e: print(f"[9Router Error] {e} -> Chuyen sang dung Gemini API...", flush=True)
    api_key = os.getenv("GEMINI_API_KEY", "")
    if api_key: return analyze_video_stream(file_path, api_key)
    raise RuntimeError("Khong the phan tich video qua 9Router hoac Gemini API.")
