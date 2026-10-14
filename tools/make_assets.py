"""Membuat ikon aplikasi, splash, dan aset Play Store untuk Astra (hanya butuh Pillow).

Jalankan dari akar proyek:  python3 tools/make_assets.py
"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "android/app/src/main/res")
STORE = os.path.join(ROOT, "store")
os.makedirs(STORE, exist_ok=True)

EMERALD = (10, 77, 60)
EMERALD_LIGHT = (18, 112, 84)
MINT = (0, 230, 153)
MIST = (248, 250, 252)
SS = 4  # supersampling untuk tepi halus


def star_points(cx, cy, r, steps=40):
    """Bintang empat sudut dengan sisi melengkung ke dalam."""
    tips = [(cx + r * dx, cy + r * dy) for dx, dy in [(0, -1), (1, 0), (0, 1), (-1, 0)]]
    pts = []
    for k in range(4):
        a, b = tips[k], tips[(k + 1) % 4]
        mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
        c = (cx + 0.28 * (mx - cx), cy + 0.28 * (my - cy))
        for i in range(steps):
            t = i / steps
            x = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t**2 * b[0]
            y = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t**2 * b[1]
            pts.append((x, y))
    return pts


def gradient(size):
    w, h = size
    img = Image.new("RGB", size, EMERALD)
    px = img.load()
    for y in range(h):
        for x in range(w):
            t = (x / w * 0.55 + y / h * 0.45)
            px[x, y] = tuple(int(EMERALD_LIGHT[i] * (1 - t) + EMERALD[i] * t) for i in range(3))
    return img


def draw_stars(img, scale=0.30, glow=True):
    """Gambar bintang utama + bintang kecil di tengah kanvas img (RGBA)."""
    w, h = img.size
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx, cy = w * 0.47, h * 0.52
    d.polygon(star_points(cx, cy, w * scale), fill=MINT + (255,))
    d.polygon(star_points(w * 0.70, h * 0.28, w * scale * 0.34), fill=(255, 255, 255, 255))
    if glow:
        g = layer.filter(ImageFilter.GaussianBlur(w * 0.03))
        img.alpha_composite(g)
    img.alpha_composite(layer)
    return img


def render_icon(size, shape="square", full_bleed=False, foreground_only=False):
    s = size * SS
    if foreground_only:
        base = Image.new("RGBA", (s, s), (0, 0, 0, 0))
        draw_stars(base, scale=0.20, glow=False)  # di dalam zona aman adaptive icon
        return base.resize((size, size), Image.LANCZOS)
    base = gradient((s, s)).convert("RGBA")
    draw_stars(base, scale=0.27)
    out = base
    if shape != "square" or not full_bleed:
        mask = Image.new("L", (s, s), 0)
        md = ImageDraw.Draw(mask)
        if shape == "round":
            md.ellipse((0, 0, s - 1, s - 1), fill=255)
        elif shape == "rounded":
            md.rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * 0.22), fill=255)
        else:
            md.rectangle((0, 0, s, s), fill=255)
        out = Image.new("RGBA", (s, s), (0, 0, 0, 0))
        out.paste(base, (0, 0), mask)
    return out.resize((size, size), Image.LANCZOS)


# ---- Ikon Android ----
legacy = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
fg = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}
for d, px in legacy.items():
    p = os.path.join(RES, f"mipmap-{d}")
    os.makedirs(p, exist_ok=True)
    render_icon(px, "rounded").save(os.path.join(p, "ic_launcher.png"))
    render_icon(px, "round").save(os.path.join(p, "ic_launcher_round.png"))
    render_icon(fg[d], foreground_only=True).save(os.path.join(p, "ic_launcher_foreground.png"))

# latar ikon adaptif = hijau zamrud
with open(os.path.join(RES, "values/ic_launcher_background.xml"), "w") as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0A4D3C</color>\n</resources>\n')

# splash: warna polos zamrud di semua kepadatan/orientasi
for root, _, files in os.walk(RES):
    for fn in files:
        if fn == "splash.png":
            Image.new("RGB", (16, 16), EMERALD).save(os.path.join(root, fn))

# ---- Aset Play Store ----
render_icon(512, "square", full_bleed=True).convert("RGBA").save(os.path.join(STORE, "icon-512.png"))

FONT_BOLD = next((p for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"] if os.path.exists(p)), None)
FONT = next((p for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"] if os.path.exists(p)), None)
fg_img = gradient((1024, 500)).convert("RGBA")
layer = Image.new("RGBA", (1024, 500), (0, 0, 0, 0))
ld = ImageDraw.Draw(layer)
ld.polygon(star_points(210, 250, 150), fill=MINT + (255,))
ld.polygon(star_points(350, 130, 48), fill=(255, 255, 255, 255))
fg_img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(14)))
fg_img.alpha_composite(layer)
fd = ImageDraw.Draw(fg_img)
if FONT_BOLD:
    fd.text((420, 150), "Astra", font=ImageFont.truetype(FONT_BOLD, 112), fill=(255, 255, 255))
    fd.text((424, 295), "Dengar. Tirukan. Fasih.", font=ImageFont.truetype(FONT, 38), fill=(190, 255, 230))
    fd.text((424, 350), "Inggris dan Mandarin", font=ImageFont.truetype(FONT, 30), fill=(255, 255, 255, 200))
fg_img.convert("RGB").save(os.path.join(STORE, "feature-graphic-1024x500.png"))

print("aset selesai:", RES, STORE)
