import json

AI_KEYWORDS = [
    "openai", "sora", "dall-e", "midjourney", "firefly", "adobe",
    "google", "veo", "imagen", "synthesia", "heygen", "runway",
    "kling", "hailuo", "pika", "generative", "ai generated", "synthetic"
]

def check_c2pa(file_path: str) -> dict:
    try:
        import c2pa
        reader = c2pa.Reader(file_path)
        manifest_str = reader.json()
        manifest = json.loads(manifest_str) if isinstance(manifest_str, str) else manifest_str
        active = manifest.get("active_manifest", {})
        claim_gen = str(active.get("claim_generator", "")).lower()
        title = active.get("title", "")
        assertions = active.get("assertions", [])

        is_ai = any(k in claim_gen for k in AI_KEYWORDS)
        for ass in assertions:
            lbl = str(ass.get("label", "")).lower()
            val = str(ass.get("data", "")).lower()
            if any(k in lbl or k in val for k in AI_KEYWORDS):
                is_ai = True
                break

        return {
            "has_c2pa": True,
            "is_ai_generated": is_ai,
            "claim_generator": active.get("claim_generator", ""),
            "title": title,
            "summary": f"Co chu ky C2PA: {active.get('claim_generator', 'Xac thuc')} (Xuat xu AI: {is_ai})"
        }
    except Exception:
        return {
            "has_c2pa": False,
            "is_ai_generated": False,
            "claim_generator": "",
            "title": "",
            "summary": "Khong phat hien chu ky ma hoa C2PA"
        }
