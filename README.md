# MusicGen Node.js Server

Node.js 서버에서 Hugging Face의 MusicGen 모델을 사용하여 음악을 생성합니다.

## 설치

```bash
npm install
```

## 환경 설정

1. Hugging Face 토큰을 환경변수로 설정:
```bash
export HF_TOKEN=your_huggingface_token
```

2. 또는 `.env` 파일 생성:
```bash
cp .env.example .env
# .env 파일에 토큰 입력
```

## 실행

```bash
npm start
# 또는 개발모드
npm run dev
```

## API 사용법

### 음악 생성
```bash
curl -X POST http://localhost:3000/generate-music \
  -H "Content-Type: application/json" \
  -d '{"prompt": "lo-fi music with a soothing melody", "duration": 8}' \
  --output generated_music.wav
```

### 상태 확인
```bash
curl http://localhost:3000/health
```

## 파라미터

- `prompt`: 생성할 음악에 대한 텍스트 설명 (필수)
- `duration`: 음악 길이 (초, 최대 8초, 기본값: 8)