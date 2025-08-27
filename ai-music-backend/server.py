import os
import uuid
import time
import threading
import requests  # Papago API 호출을 위해 추가
import urllib.parse  # Papago API 호출을 위해 추가
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, Optional, List

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import replicate

# ───── 환경 변수 로드 ──────────────────────────────────────────────────
load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=True)

app = Flask(__name__, static_url_path="/static")
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Replicate 클라이언트 설정
REPLICATE_TOKEN = os.getenv("REPLICATE_API_TOKEN")
MODEL_SLUG = os.getenv("REPLICATE_MODEL", "meta/musicgen")
client = replicate.Client(api_token=REPLICATE_TOKEN) if REPLICATE_TOKEN else None

# Papago 클라이언트 설정
PAPAGO_CLIENT_ID = os.getenv("PAPAGO_CLIENT_ID")
PAPAGO_CLIENT_SECRET = os.getenv("PAPAGO_CLIENT_SECRET")

# ───── 인메모리 작업 저장소 ───────────────────────────────────────────
TASKS: Dict[str, Dict[str, Any]] = {}

def _set_task_status(task_id: str, status: str, **kwargs):
    """작업 상태를 업데이트하는 헬퍼 함수"""
    TASKS[task_id] = {"status": status, **kwargs}

def mk_result(audio_url: str, title="AI_Track",
              genres: Optional[List[str]] = None,
              moods: Optional[List[str]] = None,
              duration: int = 10, kind: str = "generated"):
    """결과 객체를 생성하는 헬퍼 함수"""
    return {
        "id": str(uuid.uuid4()),
        "title": title,
        "genres": genres or [],
        "moods": moods or [],
        "duration": duration,
        "audioUrl": audio_url,
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "type": kind,
    }

def _extract_audio_url(output: Any) -> Optional[str]:
    """Replicate API 응답에서 오디오 URL을 추출하는 함수"""
    def as_url(v: Any) -> Optional[str]:
        if isinstance(v, str) and v.startswith("http"): return v
        try:
            u = getattr(v, "url", None)
            if isinstance(u, str) and u.startswith("http"): return u
        except Exception: pass
        return None

    u = as_url(output)
    if u: return u
    if isinstance(output, (list, tuple)):
        for item in output:
            u = as_url(item)
            if u: return u
    if isinstance(output, dict):
        for key in ("audioUrl", "audio_url", "url", "audio", "output"):
            if key in output:
                u = as_url(output[key])
                if u: return u
        for parent in ("result", "data", "prediction"):
            if parent in output:
                u = _extract_audio_url(output[parent])
                if u: return u
    return None

def _run_replicate(input_dict: Dict[str, Any]) -> str:
    """Replicate API를 실행하고 결과 URL을 반환하는 함수"""
    if not client:
        raise RuntimeError("Replicate API 토큰이 .env 파일에 설정되지 않았습니다.")
    out = client.run(MODEL_SLUG, input=input_dict)
    url = _extract_audio_url(out)
    if not url:
        raise RuntimeError(f"Replicate API가 오디오 URL을 반환하지 않았습니다. raw={out}")
    return url

def translate_to_english(text: str) -> str:
    """Papago API를 사용하여 한국어 텍스트를 영어로 번역하는 함수"""
    # --- [디버깅 로그] ---
    print("\n--- Papago 번역 시작 ---")
    print(f"[Papago] 원본 텍스트: '{text}'")
    
    if not all([PAPAGO_CLIENT_ID, PAPAGO_CLIENT_SECRET]):
        print("[Papago] Papago API 키가 설정되지 않아 번역을 건너뜁니다.")
        print("--- Papago 번역 종료 ---\n")
        return text
    if not text or not text.strip():
        print("[Papago] 입력 텍스트가 비어있어 번역을 건너뜁니다.")
        print("--- Papago 번역 종료 ---\n")
        return text

    try:
        url = "https://papago.apigw.ntruss.com/nmt/v1/translation"
        headers = {
            "X-NCP-APIGW-API-KEY-ID": PAPAGO_CLIENT_ID,
            "X-NCP-APIGW-API-KEY": PAPAGO_CLIENT_SECRET,
        }
        data = {"source": "ko", "target": "en", "text": text}
        
        # --- [디버깅 로그] ---
        print("[Papago] API 서버로 번역을 요청합니다...")
        response = requests.post(url, headers=headers, data=data, timeout=5)
        
        if response.status_code != 200:
            # --- [디버깅 로그] ---
            print(f"[Papago Error] API가 오류를 반환했습니다. 상태 코드: {response.status_code}")
            print(f"[Papago Error] 응답 내용: {response.text}")
            print("--- Papago 번역 종료 ---\n")
            return text # 오류 시 원본 텍스트 반환

        result = response.json()
        translated_text = result.get("message", {}).get("result", {}).get("translatedText")
        
        if translated_text:
            # --- [디버깅 로그] ---
            print(f"[Papago] ✨ 번역 성공! ✨ -> '{translated_text}'")
            print("--- Papago 번역 종료 ---\n")
            return translated_text
        
        # --- [디버깅 로그] ---
        print("[Papago] 번역된 텍스트를 찾을 수 없어 원본을 반환합니다.")
        print("--- Papago 번역 종료 ---\n")
        return text

    except requests.exceptions.RequestException as e:
        print(f"[Papago Error] API 요청 실패: {e}")
        print("--- Papago 번역 종료 ---\n")
        return text
    except Exception as e:
        print(f"[Papago Error] 알 수 없는 오류: {e}")
        print("--- Papago 번역 종료 ---\n")
        return text

# ───── 백그라운드 작업자 ───────────────────────────────────────────────
def worker_generate(task_id: str, description: str, genres: list, moods: list, duration: int,
                    tmp_path: Optional[str]):
    """음악 생성을 위한 백그라운드 스레드 작업 (번역 로직 수정)"""
    try:
        _set_task_status(task_id, "running")

        # --- 1단계: 순수 설명(description) 부분만 번역 ---
        print(f"\n[Worker] 번역 대상 원본 설명: '{description}'")
        translated_description = translate_to_english(description)
        print(f"[Worker] 번역 완료된 설명: '{translated_description}'")

        # --- 2단계: 번역된 설명과 영어 키워드(장르, 분위기)를 조합하여 최종 프롬프트 생성 ---
        final_prompt_parts = [translated_description]
        if genres:
            # 장르와 분위기는 이미 영어이므로 번역하지 않고 그대로 추가합니다.
            final_prompt_parts.extend(genres)
        if moods:
            final_prompt_parts.extend(moods)

        # 비어있지 않은 모든 요소를 쉼표와 공백으로 연결합니다.
        final_prompt = ", ".join(filter(None, final_prompt_parts)) or "instrumental background music"

        print(f"[Worker] 🚀 Replicate API에 최종 전달될 프롬프트: '{final_prompt}'")

        inputs: Dict[str, Any] = {
            "prompt": final_prompt,
            "duration": duration,
            "output_format": "mp3",
            "normalization_strategy": "peak",
        }

        if tmp_path:
            with open(tmp_path, "rb") as f:
                data = f.read()
            bio = BytesIO(data)
            setattr(bio, "name", os.path.basename(tmp_path))
            bio.seek(0)
            inputs["input_audio"] = bio
            inputs["continuation"] = False

        audio_url = _run_replicate(inputs)
        res = mk_result(audio_url, "AI_Generated_Track", genres, moods, duration, "generated")
        _set_task_status(task_id, "succeeded", result=res, audioUrl=res["audioUrl"])
        
        print(f"[Worker] 작업 성공! Task ID: {task_id}")

    except Exception as e:
        print(f"[worker_generate] ERROR: {repr(e)}")
        _set_task_status(task_id, "failed", error=str(e))
    finally:
        if tmp_path:
            try:
                os.remove(tmp_path)
            except Exception:
                pass

# ───── API 엔드포인트 ──────────────────────────────────────────────────
@app.route("/api/music/generate", methods=["POST"])
def generate_music_endpoint():
    """음악 생성 요청을 받는 API 엔드포인트 (프롬프트 조합 로직 제거)"""
    ct = (request.content_type or "")
    is_multipart = ct.startswith("multipart/form-data")

    if is_multipart:
        data = request.form
        up = request.files.get("file")
    else:
        data = request.get_json(force=True, silent=True) or {}
        up = None

    import json
    def as_list(v):
        if v is None: return []
        if isinstance(v, list): return v
        if isinstance(v, str):
            try: return json.loads(v)
            except Exception: return [v] if v else []
        return []

    # 각 구성요소를 분리된 상태로 가져옵니다. 여기서 합치지 않습니다.
    description = data.get("description", "")
    genres_list = as_list(data.get("genres"))
    moods_list = as_list(data.get("moods"))
    
    try:
        duration = int(data.get("duration") or 10)
    except Exception:
        duration = 10

    tmp_path = None
    if up:
        os.makedirs("tmp", exist_ok=True)
        safe = secure_filename(up.filename or f"audio_{uuid.uuid4().hex}.wav")
        tmp_path = os.path.join("tmp", f"{uuid.uuid4().hex}_{safe}")
        up.save(tmp_path)

    task_id = uuid.uuid4().hex
    _set_task_status(task_id, "queued")
    
    # worker_generate 함수에 description, genres, moods를 개별적으로 전달합니다.
    threading.Thread(
        target=worker_generate,
        args=(task_id, description, genres_list, moods_list, duration, tmp_path),
        daemon=True
    ).start()
    return jsonify({"taskId": task_id})

@app.route("/api/music/task/status", methods=["GET"])
def task_status():
    """작업 상태를 확인하는 API 엔드포인트"""
    task_id = request.args.get("task_id") or request.args.get("taskId")
    task = TASKS.get(task_id)
    if not task:
        return jsonify({"status": "failed", "error": "Unknown task"}), 404
    return jsonify({
        "taskId": task_id,
        "status": task.get("status"),
        "audioUrl": task.get("audioUrl"),
        "result": task.get("result"),
        "error": task.get("error"),
    })

if __name__ == "__main__":
    print("=== AI Music Backend 서버 시작 ===")
    if not REPLICATE_TOKEN:
        print("[경고] REPLICATE_API_TOKEN이 설정되지 않았습니다. 음악 생성이 실패합니다.")
    if not PAPAGO_CLIENT_ID or not PAPAGO_CLIENT_SECRET:
        print("[경고] Papago API 키가 설정되지 않았습니다. 번역 기능이 작동하지 않습니다.")
    
    app.run(host="127.0.0.1", port=5000, debug=True)