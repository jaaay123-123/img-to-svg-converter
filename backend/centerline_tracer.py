"""
Centerline SVG Tracer (sknw 기반)
==================================
sknw로 skeleton graph를 정확하게 추출 →
각 엣지를 B-spline으로 스무딩 → stroke 기반 SVG 생성
"""

import cv2
import cv2.ximgproc
import numpy as np
from PIL import Image, ImageFilter
from scipy import interpolate
import sknw
import io


def _binarize(img_rgb: np.ndarray) -> np.ndarray:
    pil = Image.fromarray(img_rgb)
    pil = pil.filter(ImageFilter.UnsharpMask(radius=1, percent=200, threshold=0))
    gray = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2GRAY)
    _, bw = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    return bw


def _smooth_pts(pts: np.ndarray, s_factor: float = 2.0) -> list[tuple]:
    """B-spline 스무딩 후 (x,y) 리스트 반환"""
    if len(pts) < 4:
        return [(float(p[1]), float(p[0])) for p in pts]

    ys, xs = pts[:, 0].astype(float), pts[:, 1].astype(float)
    diffs = np.diff(np.column_stack([xs, ys]), axis=0)
    seg_len = np.sqrt((diffs**2).sum(axis=1)).clip(1e-6)
    t = np.concatenate([[0], np.cumsum(seg_len)])
    t /= t[-1]

    s = len(pts) * s_factor
    try:
        tck, _ = interpolate.splprep([xs, ys], u=t, s=s, k=min(3, len(pts)-1), quiet=True)
        n_out = max(len(pts) // 2, 4)
        u_new = np.linspace(0, 1, n_out)
        xi, yi = interpolate.splev(u_new, tck)
        return list(zip(xi.tolist(), yi.tolist()))
    except Exception:
        return list(zip(xs.tolist(), ys.tolist()))


def _pts_to_svg_d(smooth: list[tuple]) -> str:
    if len(smooth) < 2:
        return None
    x0, y0 = smooth[0]
    d = f"M {x0:.1f},{y0:.1f}"
    i = 1
    while i + 2 < len(smooth):
        p1, p2, p3 = smooth[i], smooth[i+1], smooth[i+2]
        d += f" C {p1[0]:.1f},{p1[1]:.1f} {p2[0]:.1f},{p2[1]:.1f} {p3[0]:.1f},{p3[1]:.1f}"
        i += 3
    while i < len(smooth):
        d += f" L {smooth[i][0]:.1f},{smooth[i][1]:.1f}"
        i += 1
    return d


def trace_to_svg(image_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_rgb = np.array(img)
    width, height = img.size

    # 1. 이진화
    bw = _binarize(img_rgb)

    # 2. Skeleton + distance transform
    skeleton = cv2.ximgproc.thinning(bw, thinningType=cv2.ximgproc.THINNING_ZHANGSUEN)
    dist = cv2.distanceTransform(bw, cv2.DIST_L2, 5)

    # 3. sknw로 skeleton graph 추출
    graph = sknw.build_sknw(skeleton.astype(bool))

    paths = []
    min_edge_len = 3  # 최소 엣지 픽셀 수

    for (s, e) in graph.edges():
        edge_pts = graph[s][e]['pts']  # shape (N, 2), (row, col)
        if len(edge_pts) < min_edge_len:
            continue

        # stroke width: edge 중점에서의 distance transform 중앙값 * 2
        widths = [dist[int(p[0]), int(p[1])] for p in edge_pts]
        stroke_w = float(np.median(widths)) * 2
        stroke_w = round(min(max(stroke_w, 0.6), 12), 1)

        # 너무 짧고 얇은 건 노이즈
        arc_len = len(edge_pts)
        if arc_len < max(3, stroke_w * 1.2):
            continue

        smooth = _smooth_pts(np.array(edge_pts), s_factor=max(1.5, arc_len * 0.3))
        if len(smooth) < 2:
            continue

        d = _pts_to_svg_d(smooth)
        if d:
            paths.append(
                f'<path d="{d}" stroke="black" stroke-width="{stroke_w}" '
                f'fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
            )

    svg = (
        f'<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'width="{width}" height="{height}" viewBox="0 0 {width} {height}">\n'
        f'<rect width="{width}" height="{height}" fill="white"/>\n'
        + '\n'.join(paths)
        + '\n</svg>'
    )

    print(f"[centerline/sknw] 엣지: {graph.number_of_edges()}, 패스: {len(paths)}, SVG: {len(svg)//1024}KB")
    return svg
