# Image → SVG Converter

이미지(PNG, JPG, WEBP 등)를 고품질 SVG 벡터 파일로 변환하는 웹 서비스.

## 기술 스택

- **Frontend**: React + Vite + Tailwind CSS (Vercel 배포)
- **Backend**: FastAPI + vtracer + rembg (Railway 배포)

## 로컬 실행

### 백엔드

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # ALLOWED_ORIGINS 설정
uvicorn main:app --reload
```

### 프론트엔드

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL 설정
npm run dev
```

## 배포

- **Backend** → Railway: `Dockerfile` 기반 자동 빌드, `ALLOWED_ORIGINS` 환경변수 설정
- **Frontend** → Vercel: `npm run build`, `VITE_API_URL` 환경변수 설정
