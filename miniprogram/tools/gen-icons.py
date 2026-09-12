#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
并网计划 · tabBar 图标生成
按「华电保定·校园通」网页版视觉绘制 81x81 图标，每页两态
（未选中中灰 / 选中华电绿）。
运行：python tools/gen-icons.py
"""
import math
import os
from PIL import Image, ImageDraw

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'icons')
S = 81
NORM = (0x68, 0x78, 0x8E, 0xFF)   # 未选中 · 中灰（--gray #68788e）
ACT = (0x1E, 0x7A, 0x4F, 0xFF)    # 选中 · 华电绿（--green #1e7a4f）
LW = 7                            # 线宽


def canvas():
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def hex_pts(cx, cy, r):
    return [
        (cx + r * math.cos(math.radians(60 * i - 90)),
         cy + r * math.sin(math.radians(60 * i - 90)))
        for i in range(6)
    ]


def star_pts(cx, cy, r_out, r_in, n=5):
    pts = []
    for i in range(n * 2):
        r = r_out if i % 2 == 0 else r_in
        a = math.radians(i * 180.0 / n - 90)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def bolt_pts(cx, cy, scale):
    """品牌闪电（与首页 CSS clip-path 同形）"""
    shape = [(0.60, 0.03), (0.18, 0.55), (0.44, 0.55),
             (0.35, 0.97), (0.82, 0.43), (0.53, 0.43)]
    return [(cx + (x - 0.5) * scale, cy + (y - 0.5) * scale) for x, y in shape]


def draw_home(d, color):
    """首页：品牌六边形 + 闪电"""
    d.polygon(hex_pts(S / 2, S / 2, 34), outline=color, width=LW)
    d.polygon(bolt_pts(S / 2, S / 2, 38), fill=color)


def draw_contest(d, color):
    """竞赛：五角星"""
    d.polygon(star_pts(S / 2, S / 2 + 2, 33, 13.5), fill=color)


def draw_search(d, color):
    """检索：放大镜"""
    r = 22
    cx, cy = S / 2 - 4, S / 2 - 4
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=LW)
    d.line([(cx + r * 0.72, cy + r * 0.72), (S / 2 + 27, S / 2 + 27)],
           fill=color, width=LW + 1)


def draw_about(d, color):
    """关于：圆环 + i"""
    r = 32
    d.ellipse([S / 2 - r, S / 2 - r, S / 2 + r, S / 2 + r], outline=color, width=LW)
    d.ellipse([S / 2 - 3.5, S / 2 - 17, S / 2 + 3.5, S / 2 - 10], fill=color)
    d.rectangle([S / 2 - 3.5, S / 2 - 3, S / 2 + 3.5, S / 2 + 16], fill=color)


DRAWERS = {
    'home': draw_home,
    'contest': draw_contest,
    'search': draw_search,
    'about': draw_about,
}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for name, fn in DRAWERS.items():
        for suffix, color in (('', NORM), ('-on', ACT)):
            img, d = canvas()
            fn(d, color)
            path = os.path.join(OUT_DIR, name + suffix + '.png')
            img.save(path, 'PNG', optimize=True)
            print('  ✓ %s  (%d B)' % (os.path.basename(path), os.path.getsize(path)))


if __name__ == '__main__':
    print('◆ 生成 tabBar 图标 → assets/icons/')
    main()
    print('完成')
