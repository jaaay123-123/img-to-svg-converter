"""
픽셀-run 기반 SVG 변환기 (컬러 출력용)
- PNG 픽셀을 SVG <path> 사각형으로 재구성
- 순수 path only (no <image>, no href, no font)
- RGB 색상 양자화 + 배경 제거로 파일 크기 최적화
"""

import io
import numpy as np
from PIL import Image
from collections import defaultdict


MAX_D_LEN = 20000  # path d 속성 최대 길이
COLOR_STEP = 12    # 채널당 양자화 단계 (낮을수록 고품질, 파일 커짐)
BG_DIST    = 28    # 배경색과의 유클리드 거리 임계값


def _detect_bg(img_rgb: np.ndarray):
    h, w = img_rgb.shape[:2]
    corners = [
        img_rgb[0, 0], img_rgb[0, w-1],
        img_rgb[h-1, 0], img_rgb[h-1, w-1],
    ]
    return tuple(int(np.mean([c[i] for c in corners])) for i in range(3))


def _quantize(r, g, b, bg, step=COLOR_STEP, dist_thresh=BG_DIST):
    dr = r - bg[0]; dg = g - bg[1]; db = b - bg[2]
    if (dr*dr + dg*dg + db*db) ** 0.5 < dist_thresh:
        return None
    qr = min((r // step) * step, 255)
    qg = min((g // step) * step, 255)
    qb = min((b // step) * step, 255)
    return (qr, qg, qb)


def _pixel_run_svg(img_rgb: np.ndarray) -> str:
    h, w = img_rgb.shape[:2]
    bg = _detect_bg(img_rgb)
    bg_hex = f"#{bg[0]:02x}{bg[1]:02x}{bg[2]:02x}"

    runs_by_color = defaultdict(list)

    for y in range(h):
        row = img_rgb[y]
        x = 0
        while x < w:
            r, g, b = int(row[x, 0]), int(row[x, 1]), int(row[x, 2])
            color = _quantize(r, g, b, bg)
            x0 = x
            x += 1
            while x < w:
                nr, ng, nb = int(row[x, 0]), int(row[x, 1]), int(row[x, 2])
                if _quantize(nr, ng, nb, bg) != color:
                    break
                x += 1
            if color is not None:
                runs_by_color[color].append((x0, y, x - x0))

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}" version="1.1">',
        f'<rect x="0" y="0" width="{w}" height="{h}" fill="{bg_hex}"/>',
        '<g stroke="none" shape-rendering="crispEdges">',
    ]

    total_runs = 0
    for color in sorted(runs_by_color.keys()):
        fill = f"#{color[0]:02x}{color[1]:02x}{color[2]:02x}"
        dparts = []
        dlen = 0
        for x, y, length in runs_by_color[color]:
            cmd = f"M{x} {y}h{length}v1H{x}z"
            if dparts and dlen + len(cmd) > MAX_D_LEN:
                lines.append(f'<path fill="{fill}" d="{"".join(dparts)}"/>')
                dparts = []
                dlen = 0
            dparts.append(cmd)
            dlen += len(cmd)
        if dparts:
            lines.append(f'<path fill="{fill}" d="{"".join(dparts)}"/>')
        total_runs += len(runs_by_color[color])

    lines += ["</g>", "</svg>"]

    print(f"[pixel-run] 색상 수: {len(runs_by_color)}개, run 수: {total_runs:,}")
    return "\n".join(lines)


def convert_image_to_svg(
    image_bytes: bytes,
    remove_background: bool = False,
) -> tuple:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

    if remove_background:
        try:
            from rembg import remove as rembg_remove
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            img = Image.open(io.BytesIO(rembg_remove(buf.getvalue()))).convert("RGBA")
        except ImportError:
            pass

    # 투명 배경은 흰색으로 합성
    bg_canvas = Image.new("RGB", img.size, (255, 255, 255))
    bg_canvas.paste(img, mask=img.split()[3])
    img_rgb = np.array(bg_canvas, dtype=np.uint8)

    svg = _pixel_run_svg(img_rgb)
    return svg, 100.0
