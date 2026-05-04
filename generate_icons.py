#!/usr/bin/env python3
"""Generate simple PWA icons for the IPTV player."""
from PIL import Image, ImageDraw
import os

def create_icon(size: int, path: str):
    img = Image.new('RGB', (size, size), color='#030712')
    draw = ImageDraw.Draw(img)
    # Draw a simple TV shape
    margin = size // 6
    tv_w = size - 2 * margin
    tv_h = int(tv_w * 0.75)
    tv_x = margin
    tv_y = (size - tv_h) // 2 - size // 12
    # Screen
    draw.rounded_rectangle([tv_x, tv_y, tv_x + tv_w, tv_y + tv_h], radius=size//16, fill='#1e40af', outline='#3b82f6', width=max(2, size//40))
    # Stand
    stand_w = tv_w // 3
    stand_x = tv_x + (tv_w - stand_w) // 2
    stand_y = tv_y + tv_h
    stand_h = size // 10
    draw.rectangle([stand_x, stand_y, stand_x + stand_w, stand_y + stand_h], fill='#374151')
    # Base
    base_w = tv_w // 2
    base_x = tv_x + (tv_w - base_w) // 2
    base_y = stand_y + stand_h
    draw.rectangle([base_x, base_y, base_x + base_w, base_y + max(4, size//30)], fill='#374151')
    # Play button on screen
    cx = tv_x + tv_w // 2
    cy = tv_y + tv_h // 2
    r = tv_w // 8
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill='#60a5fa')
    # Triangle
    tri_size = r // 2
    draw.polygon([
        (cx - tri_size // 2, cy - tri_size),
        (cx - tri_size // 2, cy + tri_size),
        (cx + tri_size, cy),
    ], fill='#1e3a8a')
    img.save(path)
    print(f'Created {path} ({size}x{size})')

os.makedirs('public', exist_ok=True)
create_icon(192, 'public/icon-192.png')
create_icon(512, 'public/icon-512.png')
create_icon(180, 'public/apple-touch-icon.png')
print('Icons generated successfully.')
