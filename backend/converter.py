"""
픽셀-run 기반 SVG 변환기 (출력용)
====================================
- PNG 픽셀을 SVG <path> 사각형으로 재구성
- <image>, href, 폰트 없음 — 순수 path only
- 글자 outline / 이미지 expand 조건 충족
- 그레이스케일 양자화 + 배경 임계값으로 파일 최적화
"""

import io
import numpy as np
from PIL import Image
from collections import defaultdict
from rembg import remove


MAX_D_LEN = 18000   # path d 속성 최대 길이
BG_THRESHOLD = 235  # 이 밝기 이상은 배경으로 처리 (노이즈 제거)
GRAY_LEVELS  = 32   # 그레이 양자화 단계 (파일 크기 vs 품질 균형)


def _quantize_gray(r: int, g: int, b: int):
    """
    RGB → 양자화된 그레이값 반환.
    배경(밝은 픽셀)은 None 반환.
    """
    gray = int(0.299 * r + 0.587 * g + 0.114 * b)
    if gray >= BG_THRESHOLD:
        return None
    # GRAY_LEVELS 단계로 양자화
    step = 256 // GRAY_LEVELS
    quantized = (gray // step) * step
    return quantized


def _pixel_run_svg(img_rgb: np.ndarray) -> str:
    h, w = img_rgb.shape[:2]

    # 배경색 감지 (모서리 평균)
    corners = [img_rgb[0,0], img_rgb[0,w-1], img_rgb[h-1,0], img_rgb[h-1,w-1]]
    bg = tuple(int(np.mean([c[i] for c in corners])) for i in range(3))
    bg_gray = int(0.299*bg[0] + 0.587*bg[1] + 0.114*bg[2])
    bg_hex = f"#{bg_gray:02x}{bg_gray:02x}{bg_gray:02x}"

    runs_by_gray = defaultdict(list)

    for y in range(h):
        row = img_rgb[y]
        x = 0
        while x < w:
            r, g, b = int(row[x,0]), int(row[x,1]), int(row[x,2])
            gray = _quantize_gray(r, g, b)
            x0 = x
            x += 1
            # 같은 양자화 값이 연속되는 구간 탐색
            while x < w:
                nr, ng, nb = int(row[x,0]), int(row[x,1]), int(row[x,2])
                if _quantize_gray(nr, ng, nb) != gray:
                    break
                x += 1
            if gray is not None:  # 배경 아닌 픽셀만
                runs_by_gray[gray].append((x0, y, x - x0))

    # 어두운 색부터 (0=검정 → 먼저)
    sorted_grays = sorted(runs_by_gray.keys())

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}" version="1.1">',
        f'<rect x="0" y="0" width="{w}" height="{h}" fill="{bg_hex}"/>',
        '<g stroke="none" fill-rule="nonzero" shape-rendering="crispEdges">',
    ]

    total_runs = 0
    for gray in sorted_grays:
        fill = f"#{gray:02x}{gray:02x}{gray:02x}"
        dparts = []
        dlen = 0
        for x, y, length in runs_by_gray[gray]:
            cmd = f"M{x} {y}h{length}v1H{x}z"
            if dparts and dlen + len(cmd) > MAX_D_LEN:
                lines.append(f'<path fill="{fill}" d="{"".join(dparts)}"/>')
                dparts = []
                dlen = 0
            dparts.append(cmd)
            dlen += len(cmd)
        if dparts:
            lines.append(f'<path fill="{fill}" d="{"".join(dparts)}"/>')
        total_runs += len(runs_by_gray[gray])

    lines += ["</g>", "</svg>"]

    print(f"[pixel-run] 양자화 색상: {len(sorted_grays)}개, run 수: {total_runs:,}")
    return "\n".join(lines)


def convert_image_to_svg(
    image_bytes: bytes,
    remove_background: bool = False,
) -> tuple[str, float]:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

    if remove_background:
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        img = Image.open(io.BytesIO(remove(buf.getvalue()))).convert("RGBA")

    img_rgb = np.array(img.convert("RGB"), dtype=np.uint8)
    svg = _pixel_run_svg(img_rgb)

    return svg, 100.0
