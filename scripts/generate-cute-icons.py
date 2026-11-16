"""
Generates cute, friendly retro-styled cartoon fridge app icons for "یخچال من" (My Fridge).
Design:
- Adorable kawaii fridge character with cheerful cute eyes, rosy blush, friendly smile
- Freezer door on top, fridge door on bottom with chrome/retro handles
- Cute magnets and sticky notes on the door (little heart, star, chef hat note)
- Distinctive retro aesthetic matching the app palette (#D9A78F background, #FFFDF8 fridge body with soft mint/cream gradient/accents, bold retro outlines #2D2727)
- Perfect scaling for:
  - icon.png (1024x1024, RGB)
  - splash-icon.png (1024x1024, RGBA)
  - android-icon-foreground.png (512x512, RGBA)
  - android-icon-background.png (512x512, RGBA)
  - android-icon-monochrome.png (432x432, RGBA)
  - favicon.png (48x48, RGBA)
"""
import math
from PIL import Image, ImageDraw

BG_COLOR = (217, 167, 143)          # #D9A78F
OUTLINE_COLOR = (45, 39, 39)        # #2D2727
FRIDGE_BODY = (248, 252, 254)       # Fresh crisp pastel white/blue tint
FREEZER_TOP = (235, 245, 250)
SHADOW_BODY = (210, 228, 238)
CHEEK_PINK = (255, 150, 160)
EYE_COLOR = (35, 30, 30)
HANDLE_COLOR = (255, 215, 0)        # Gold/yellow handle
HANDLE_SHADOW = (220, 175, 0)
STICKER_PINK = (255, 120, 150)
STICKER_MINT = (100, 215, 180)
STICKER_YELLOW = (255, 220, 90)

def draw_cute_fridge(size=1024, include_bg=True, is_monochrome=False):
    # Create canvas
    bg = BG_COLOR if include_bg else (0, 0, 0, 0)
    mode = "RGB" if (include_bg and not is_monochrome) else "RGBA"
    
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0) if not include_bg else (*BG_COLOR, 255))
    draw = ImageDraw.Draw(img)

    scale = size / 1024.0

    def s(val):
        return int(round(val * scale))

    line_w = max(2, s(16))
    detail_w = max(1, s(10))

    if is_monochrome:
        outline = (255, 255, 255, 255)
        fill_main = (0, 0, 0, 0)
        eye_col = (255, 255, 255, 255)
        blush_col = (255, 255, 255, 120)
        handle_col = (255, 255, 255, 255)
    else:
        outline = OUTLINE_COLOR
        fill_main = FRIDGE_BODY
        eye_col = EYE_COLOR
        blush_col = CHEEK_PINK
        handle_col = HANDLE_COLOR

    # Dimensions of fridge
    # Fridge center around (512, 530)
    fw = s(520)
    fh = s(700)
    fx = s(512) - fw // 2
    fy = s(190)

    # 1. Soft retro drop-shadow for the fridge
    if not is_monochrome:
        shadow_offset_x = s(16)
        shadow_offset_y = s(20)
        draw.rounded_rectangle(
            [fx + shadow_offset_x, fy + shadow_offset_y, fx + fw + shadow_offset_x, fy + fh + shadow_offset_y],
            radius=s(90),
            fill=(170, 120, 100, 140) if include_bg else (0, 0, 0, 40)
        )

    # 2. Main Fridge Outer Body
    draw.rounded_rectangle(
        [fx, fy, fx + fw, fy + fh],
        radius=s(90),
        fill=fill_main if not is_monochrome else None,
        outline=outline,
        width=line_w
    )

    # 3. Freezer Door (Upper section)
    freezer_h = s(220)
    split_gap = s(14)
    # Freezer inner divider line
    freezer_bot_y = fy + freezer_h
    draw.line(
        [(fx + s(10), freezer_bot_y), (fx + fw - s(10), freezer_bot_y)],
        fill=outline,
        width=line_w
    )

    # Freezer Top Crown / Cute Chef Hat or Little Topper Magnet!
    # Let's put a cute mini chef hat on top of the fridge (very fitting for cooking app!)
    hat_cx = fx + fw // 2
    hat_cy = fy + s(8)
    if not is_monochrome:
        # Chef hat puff circles
        hat_w = s(120)
        hat_h = s(70)
        # Puff 1, 2, 3
        draw.ellipse([hat_cx - s(60), fy - s(45), hat_cx - s(10), fy + s(5)], fill=(255, 255, 255), outline=outline, width=detail_w)
        draw.ellipse([hat_cx + s(10), fy - s(45), hat_cx + s(60), fy + s(5)], fill=(255, 255, 255), outline=outline, width=detail_w)
        draw.ellipse([hat_cx - s(35), fy - s(65), hat_cx + s(35), fy - s(5)], fill=(255, 255, 255), outline=outline, width=detail_w)
        # Chef hat band
        draw.rounded_rectangle([hat_cx - s(45), fy - s(16), hat_cx + s(45), fy + s(4)], radius=s(6), fill=(255, 220, 90), outline=outline, width=detail_w)

    # 4. Cute Kawaii Face on the Freezer Door!
    face_cy = fy + freezer_h // 2 + s(10)
    eye_offset_x = s(95)
    eye_r = s(16)

    # Left eye & Right eye
    left_eye_x = fx + fw // 2 - eye_offset_x
    right_eye_x = fx + fw // 2 + eye_offset_x
    eye_y = face_cy - s(12)

    # Big cheerful sparkly eyes
    draw.ellipse([left_eye_x - eye_r, eye_y - eye_r, left_eye_x + eye_r, eye_y + eye_r], fill=eye_col)
    draw.ellipse([right_eye_x - eye_r, eye_y - eye_r, right_eye_x + eye_r, eye_y + eye_r], fill=eye_col)

    # Eye sparkles (cute highlight dots)
    if not is_monochrome:
        sp_r1 = max(1, s(6))
        sp_r2 = max(1, s(3))
        # Top-left large sparkle
        draw.ellipse([left_eye_x - s(8) - sp_r1, eye_y - s(8) - sp_r1, left_eye_x - s(8) + sp_r1, eye_y - s(8) + sp_r1], fill=(255, 255, 255))
        draw.ellipse([right_eye_x - s(8) - sp_r1, eye_y - s(8) - sp_r1, right_eye_x - s(8) + sp_r1, eye_y - s(8) + sp_r1], fill=(255, 255, 255))
        # Bottom-right small sparkle
        draw.ellipse([left_eye_x + s(6) - sp_r2, eye_y + s(6) - sp_r2, left_eye_x + s(6) + sp_r2, eye_y + s(6) + sp_r2], fill=(255, 255, 255))
        draw.ellipse([right_eye_x + s(6) - sp_r2, eye_y + s(6) - sp_r2, right_eye_x + s(6) + sp_r2, eye_y + s(6) + sp_r2], fill=(255, 255, 255))

    # Rosy Blushing Cheeks
    blush_rx = s(26)
    blush_ry = s(16)
    draw.ellipse(
        [left_eye_x - blush_rx - s(8), eye_y + s(14) - blush_ry, left_eye_x + blush_rx - s(8), eye_y + s(14) + blush_ry],
        fill=blush_col
    )
    draw.ellipse(
        [right_eye_x - blush_rx + s(8), eye_y + s(14) - blush_ry, right_eye_x + blush_rx + s(8), eye_y + s(14) + blush_ry],
        fill=blush_col
    )

    # Happy Open Smile :D
    mouth_cx = fx + fw // 2
    mouth_cy = face_cy + s(14)
    mouth_w = s(34)
    mouth_h = s(24)
    if not is_monochrome:
        # Mouth fill (happy tongue/inside)
        draw.chord(
            [mouth_cx - mouth_w, mouth_cy - mouth_h // 2, mouth_cx + mouth_w, mouth_cy + mouth_h * 1.5],
            start=0, end=180,
            fill=(230, 80, 80),
            outline=outline,
            width=detail_w
        )
        # Little cute tongue
        draw.chord(
            [mouth_cx - mouth_w * 0.6, mouth_cy + mouth_h * 0.2, mouth_cx + mouth_w * 0.6, mouth_cy + mouth_h * 1.5],
            start=0, end=180,
            fill=(255, 140, 160)
        )
    else:
        draw.arc(
            [mouth_cx - mouth_w, mouth_cy - mouth_h // 2, mouth_cx + mouth_w, mouth_cy + mouth_h * 1.5],
            start=0, end=180,
            fill=outline,
            width=detail_w
        )

    # 5. Handles (Freezer Handle & Lower Fridge Door Handle)
    # Retro curved handle on the right or left (in Iran / RTL, handle typically on left or right)
    # Let's put cute retro vertical handles on the left side
    h_x = fx + s(40)
    # Freezer handle
    fh_y1 = fy + s(60)
    fh_y2 = fy + freezer_h - s(50)
    draw.rounded_rectangle([h_x, fh_y1, h_x + s(26), fh_y2], radius=s(12), fill=handle_col, outline=outline, width=detail_w)

    # Lower door handle
    lh_y1 = freezer_bot_y + s(70)
    lh_y2 = freezer_bot_y + s(240)
    draw.rounded_rectangle([h_x, lh_y1, h_x + s(26), lh_y2], radius=s(12), fill=handle_col, outline=outline, width=detail_w)

    # 6. Lower Door: Cute Magnets and Sticky Notes!
    # Heart Magnet
    if not is_monochrome:
        # A cute red apple / tomato magnet
        apple_x = fx + fw - s(130)
        apple_y = freezer_bot_y + s(75)
        apple_r = s(28)
        draw.ellipse([apple_x - apple_r, apple_y - apple_r, apple_x + apple_r, apple_y + apple_r], fill=(235, 75, 75), outline=outline, width=detail_w)
        # Leaf on apple
        draw.ellipse([apple_x - s(8), apple_y - apple_r - s(12), apple_x + s(12), apple_y - apple_r + s(2)], fill=(90, 195, 100), outline=outline, width=max(1, s(4)))

        # Little sticky note (yellow tilted rectangle with lines)
        note_x = fx + fw // 2 - s(30)
        note_y = freezer_bot_y + s(140)
        note_w = s(100)
        note_h = s(100)
        draw.rounded_rectangle([note_x, note_y, note_x + note_w, note_y + note_h], radius=s(8), fill=STICKER_YELLOW, outline=outline, width=detail_w)
        # Pin at top of note
        draw.circle([note_x + note_w // 2, note_y + s(10)], radius=s(8), fill=(235, 60, 60), outline=outline, width=max(1, s(3)))
        # Note scribble lines
        draw.line([(note_x + s(18), note_y + s(36)), (note_x + note_w - s(18), note_y + s(36))], fill=(180, 150, 40), width=max(1, s(5)))
        draw.line([(note_x + s(18), note_y + s(54)), (note_x + note_w - s(25), note_y + s(54))], fill=(180, 150, 40), width=max(1, s(5)))
        draw.line([(note_x + s(18), note_y + s(72)), (note_x + note_w - s(35), note_y + s(72))], fill=(180, 150, 40), width=max(1, s(5)))

        # A cute little sparkling star magnet
        star_x = fx + fw - s(110)
        star_y = freezer_bot_y + s(280)
        star_r = s(24)
        draw.rounded_rectangle([star_x - star_r, star_y - star_r, star_x + star_r, star_y + star_r], radius=s(10), fill=STICKER_MINT, outline=outline, width=detail_w)
        # Tiny smile on star/magnet
        draw.arc([star_x - s(10), star_y - s(6), star_x + s(10), star_y + s(10)], start=0, end=180, fill=outline, width=max(1, s(4)))

    # 7. Cute Fridge Feet (Little round retro feet at the bottom)
    foot_w = s(55)
    foot_h = s(32)
    left_foot_x = fx + s(60)
    right_foot_x = fx + fw - s(60) - foot_w
    foot_y = fy + fh

    draw.rounded_rectangle([left_foot_x, foot_y - s(5), left_foot_x + foot_w, foot_y + foot_h], radius=s(12), fill=(100, 95, 95), outline=outline, width=line_w)
    draw.rounded_rectangle([right_foot_x, foot_y - s(5), right_foot_x + foot_w, foot_y + foot_h], radius=s(12), fill=(100, 95, 95), outline=outline, width=line_w)

    # Return RGB or RGBA based on mode
    if mode == "RGB":
        return img.convert("RGB")
    return img

def main():
    print("Generating cute fridge assets...")
    
    # 1. Main Icon: icon.png (1024x1024, RGB)
    icon_1024 = draw_cute_fridge(size=1024, include_bg=True)
    icon_1024.save("assets/icon.png", format="PNG")
    print("Saved assets/icon.png")

    # 2. Splash Icon: splash-icon.png (1024x1024, RGBA)
    splash_1024 = draw_cute_fridge(size=1024, include_bg=False)
    splash_1024.save("assets/splash-icon.png", format="PNG")
    print("Saved assets/splash-icon.png")

    # 3. Android Foreground: android-icon-foreground.png (512x512, RGBA)
    fg_512 = draw_cute_fridge(size=512, include_bg=False)
    fg_512.save("assets/android-icon-foreground.png", format="PNG")
    print("Saved assets/android-icon-foreground.png")

    # 4. Android Background: android-icon-background.png (512x512, RGBA with #D9A78F)
    bg_512 = Image.new("RGBA", (512, 512), (*BG_COLOR, 255))
    bg_512.save("assets/android-icon-background.png", format="PNG")
    print("Saved assets/android-icon-background.png")

    # 5. Android Monochrome: android-icon-monochrome.png (432x432, RGBA)
    mono_432 = draw_cute_fridge(size=432, include_bg=False, is_monochrome=True)
    mono_432.save("assets/android-icon-monochrome.png", format="PNG")
    print("Saved assets/android-icon-monochrome.png")

    # 6. Favicon: favicon.png (48x48, RGBA)
    fav_48 = draw_cute_fridge(size=48, include_bg=False)
    fav_48.save("assets/favicon.png", format="PNG")
    print("Saved assets/favicon.png")

    print("All cute fridge icons generated successfully!")

if __name__ == "__main__":
    main()
