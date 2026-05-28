# Image → SVG Converter 개발 기획서

## 프로젝트 개요

이미지 파일(PNG, JPG, WEBP 등)을 고품질 SVG 벡터 파일로 변환해주는 웹 서비스.
외부 공개 서비스로 배포하며, 다수 파일 배치 변환 및 배경 자동 제거 기능을 포함한다.

---

## 기술 스택

### 프론트엔드
- **Framework**: React + Vite
- **Styling**: Tailwind CSS
- **파일 업로드**: react-dropzone
- **HTTP 클라이언트**: axios
- **배포**: Vercel (`appname.vercel.app`)

### 백엔드
- **Framework**: FastAPI (Python)
- **SVG 변환 엔진**: `vtracer`
- **배경 제거**: `rembg`
- **이미지 전처리**: `Pillow`
- **배포**: Railway

### 환경 변수
```
# 프론트엔드 (.env)
VITE_API_URL=https://[railway-backend-url]

# 백엔드 (.env)
ALLOWED_ORIGINS=https://[vercel-frontend-url]
```

---

## 디렉토리 구조

```
project-root/
├── frontend/               # React 앱 (Vercel 배포)
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadZone.jsx       # 드래그앤드롭 업로드
│   │   │   ├── FileQueue.jsx        # 배치 변환 파일 목록
│   │   │   ├── ConvertOptions.jsx   # 변환 설정 패널
│   │   │   ├── PreviewPanel.jsx     # 원본 / SVG 비교 미리보기
│   │   │   └── ResultCard.jsx       # 변환 결과 카드 (다운로드, 코드 복사)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   └── package.json
│
└── backend/                # FastAPI 앱 (Railway 배포)
    ├── main.py
    ├── converter.py        # vtracer + rembg 처리 로직
    ├── requirements.txt
    ├── Dockerfile
    └── .env
```

---

## 기능 명세

### 1. 파일 업로드
- 지원 포맷: PNG, JPG, JPEG, WEBP, BMP, GIF
- 업로드 방식: 드래그앤드롭 + 파일 선택 버튼
- 다중 파일 선택 가능 (배치 변환)
- 파일당 최대 크기: 10MB
- 업로드 후 파일 큐(Queue)에 목록 표시

### 2. 변환 설정 옵션

| 옵션 | 타입 | 기본값 | 범위/선택지 | 설명 |
|---|---|---|---|---|
| `color_count` | 슬라이더 | 8 | 2 ~ 30 | SVG에 사용할 색상 수 |
| `mode` | 셀렉트 | spline | spline / polygon / none | 패스 곡선 방식 |
| `filter_speckle` | 슬라이더 | 4 | 1 ~ 16 | 노이즈 제거 강도 |
| `layer_difference` | 슬라이더 | 16 | 4 ~ 64 | 색상 레이어 감도 |
| `remove_background` | 토글 | OFF | ON / OFF | rembg 배경 자동 제거 |

> 설정은 전체 배치에 일괄 적용됨

### 3. 변환 실행
- "변환 시작" 버튼 클릭 시 전체 큐 순차 처리
- 각 파일별 진행 상태 표시: 대기중 / 변환중 / 완료 / 실패
- 변환 중 개별 파일 취소 가능

### 4. 결과 확인
- 파일별 결과 카드 표시
- 원본 이미지 vs 변환된 SVG 좌우 비교 미리보기
- SVG 코드 보기 / 클립보드 복사 버튼
- SVG 파일 개별 다운로드 버튼
- 전체 결과 ZIP 일괄 다운로드 버튼

---

## API 명세

### `POST /convert`
단일 이미지를 SVG로 변환

**Request** (`multipart/form-data`)
```
file              : 이미지 파일 (required)
color_count       : int (default: 8)
mode              : string (default: "spline")
filter_speckle    : int (default: 4)
layer_difference  : int (default: 16)
remove_background : bool (default: false)
```

**Response** (`application/json`)
```json
{
  "success": true,
  "svg_content": "<svg>...</svg>",
  "filename": "result.svg"
}
```

**Error Response**
```json
{
  "success": false,
  "error": "변환 실패 사유"
}
```

---

### `GET /health`
서버 상태 확인

**Response**
```json
{ "status": "ok" }
```

---

## 백엔드 핵심 로직 (`converter.py`)

```python
# 처리 순서
# 1. 업로드된 이미지를 임시 파일로 저장
# 2. remove_background=True 이면 rembg로 배경 제거
# 3. vtracer.convert_pixels_to_svg() 로 SVG 변환
# 4. SVG 문자열 반환 후 임시 파일 삭제

import vtracer
from rembg import remove
from PIL import Image
import io

def convert_image_to_svg(
    image_bytes: bytes,
    color_count: int = 8,
    mode: str = "spline",
    filter_speckle: int = 4,
    layer_difference: int = 16,
    remove_background: bool = False
) -> str:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

    if remove_background:
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        removed = remove(img_bytes.getvalue())
        img = Image.open(io.BytesIO(removed)).convert("RGBA")

    pixels = list(img.getdata())
    width, height = img.size

    svg = vtracer.convert_pixels_to_svg(
        pixels,
        size=(width, height),
        colormode="color",
        color_precision=color_count,
        mode=mode,
        filter_speckle=filter_speckle,
        layer_difference=layer_difference,
    )
    return svg
```

---

## 백엔드 `requirements.txt`

```
fastapi
uvicorn[standard]
python-multipart
vtracer
rembg
Pillow
python-dotenv
```

---

## 백엔드 `Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 프론트엔드 UX 흐름

```
1. 랜딩 화면
   └─ 드래그앤드롭 업로드 존 (중앙 배치)

2. 파일 업로드 후
   └─ 파일 큐 목록 표시 (파일명, 용량, 상태)
   └─ 변환 설정 패널 (우측 또는 하단)
   └─ "변환 시작" 버튼

3. 변환 중
   └─ 파일별 진행 상태 인디케이터 (대기 / 변환중 / 완료)

4. 완료 후
   └─ 결과 카드 목록
      ├─ 원본 vs SVG 비교 미리보기
      ├─ SVG 코드 복사 버튼
      └─ 개별 다운로드 / ZIP 전체 다운로드
```

---

## 디자인 방향

- **테마**: 심플 / 미니멀 — 흰 배경, 명확한 계층, 불필요한 장식 없음
- **컬러**: 흑백 베이스 + 단색 포인트 1가지 (예: 인디고 또는 에메랄드)
- **폰트**: 가독성 중심, 시스템 폰트 또는 Geist
- **레이아웃**: 넉넉한 여백, 좌우 분리된 2컬럼 (업로드 + 결과)

---

## 배포 체크리스트

### 백엔드 (Railway)
- [ ] GitHub 연결 후 Railway 프로젝트 생성
- [ ] Dockerfile 기반 자동 빌드 설정
- [ ] 환경 변수 설정: `ALLOWED_ORIGINS`
- [ ] 배포 후 `/health` 엔드포인트 확인

### 프론트엔드 (Vercel)
- [ ] GitHub 연결 후 Vercel 프로젝트 생성
- [ ] 환경 변수 설정: `VITE_API_URL` = Railway 백엔드 URL
- [ ] 빌드 명령어: `npm run build`
- [ ] 배포 후 실제 변환 테스트

---

## 개발 순서 (권장)

```
1단계: 백엔드 로컬 테스트
  → vtracer + rembg 설치 확인
  → /convert API 단독 테스트 (curl 또는 Postman)

2단계: 프론트엔드 MVP
  → 단일 파일 업로드 + 변환 + 미리보기

3단계: 배치 변환 기능 추가
  → 파일 큐, 상태 관리, ZIP 다운로드

4단계: 변환 설정 옵션 UI
  → 슬라이더, 토글 패널

5단계: 배포
  → Railway → Vercel 순서로 배포
  → CORS 설정 확인
```
