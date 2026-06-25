from PIL import Image, ImageDraw
import math

# 在 4x 解析度畫，最後縮小，邊緣比較平滑
SCALE = 4
SIZE = 512 * SCALE

def s(v):  # scale helper
    return v * SCALE

img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

INK = (107, 93, 82, 255)
PAPER = (250, 243, 230, 255)
CARD = (255, 251, 242, 255)
BLUE = (168, 211, 224, 255)
YELLOW = (245, 221, 155, 255)
PEACH = (242, 182, 160, 255)

# 背景圓角方形
def rounded_rect(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

rounded_rect(draw, [0, 0, SIZE, SIZE], radius=s(96), fill=PAPER)
rounded_rect(draw, [s(14), s(14), SIZE - s(14), SIZE - s(14)], radius=s(86), outline=INK, width=s(10))

cx, cy = SIZE // 2, SIZE // 2

# 甜甜圈圖：藍色滿圈
r_mid = s(128)
stroke_w = s(56)
bbox_outer = [cx - r_mid - stroke_w//2, cy - r_mid - stroke_w//2, cx + r_mid + stroke_w//2, cy + r_mid + stroke_w//2]
draw.ellipse(bbox_outer, fill=BLUE)

# 挖空中間（甜甜圈的洞）—先畫滿圓，再挖掉中間
inner_r = r_mid - stroke_w//2
bbox_inner_hole = [cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r]

# 黃色支出弧形（從12點鐘方向，約佔 35% 圓周）
def pie_ring_segment(draw, cx, cy, r_outer, r_inner, start_deg, end_deg, fill):
    # 用多邊形近似環形扇區
    pts = []
    steps = 60
    for i in range(steps + 1):
        deg = start_deg + (end_deg - start_deg) * i / steps
        rad = math.radians(deg - 90)
        pts.append((cx + r_outer * math.cos(rad), cy + r_outer * math.sin(rad)))
    for i in range(steps, -1, -1):
        deg = start_deg + (end_deg - start_deg) * i / steps
        rad = math.radians(deg - 90)
        pts.append((cx + r_inner * math.cos(rad), cy + r_inner * math.sin(rad)))
    draw.polygon(pts, fill=fill)

r_outer = r_mid + stroke_w // 2
r_inner = r_mid - stroke_w // 2
pie_ring_segment(draw, cx, cy, r_outer, r_inner, 0, 126, YELLOW)  # 35% of 360 = 126deg

# 內外圈描邊
draw.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], outline=INK, width=s(9))
draw.ellipse([cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner], outline=INK, width=s(9))

# 中央白色圓底
center_r = s(62)
draw.ellipse([cx - center_r, cy - center_r, cx + center_r, cy + center_r], fill=CARD, outline=INK, width=s(8))

# 中央蠟筆筆觸（簡化造型：斜放的圓角矩形 + 尖端三角）
def rotated_crayon(draw, cx, cy, length, width, angle_deg, fill):
    rad = math.radians(angle_deg)
    dx, dy = math.cos(rad), math.sin(rad)
    nx, ny = -dy, dx  # 垂直方向
    half_w = width / 2
    # 蠟筆主體四個角
    p1 = (cx - dx*length/2 + nx*half_w, cy - dy*length/2 + ny*half_w)
    p2 = (cx + dx*length/2 + nx*half_w, cy + dy*length/2 + ny*half_w)
    p3 = (cx + dx*length/2 - nx*half_w, cy + dy*length/2 - ny*half_w)
    p4 = (cx - dx*length/2 - nx*half_w, cy - dy*length/2 - ny*half_w)
    draw.polygon([p1, p2, p3, p4], fill=fill, outline=INK, width=s(5))
    # 筆尖（三角形，加在 length 正向那端）
    tip_len = width * 0.9
    tipx = cx + dx*(length/2 + tip_len)
    tipy = cy + dy*(length/2 + tip_len)
    draw.polygon([p2, p3, (tipx, tipy)], fill=fill, outline=INK, width=s(5))

rotated_crayon(draw, cx - s(6), cy + s(6), length=s(58), width=s(26), angle_deg=-50, fill=PEACH)

img = img.resize((512, 512), Image.LANCZOS)
img.save('/home/claude/project/icons/icon-512.png')
print('saved icon-512.png')

# 額外產生 maskable icon：背景滿版（無圓角），主要內容縮小留出安全邊距
SIZE2 = 512 * SCALE
img2 = Image.new('RGBA', (SIZE2, SIZE2), PAPER)
draw2 = ImageDraw.Draw(img2)
cx2, cy2 = SIZE2 // 2, SIZE2 // 2

# 安全區域大約是中間 80% 直徑的圓，所以把整體圖案縮小放在這個範圍內
scale_factor = 0.72
r_mid2 = int(r_mid * scale_factor)
stroke_w2 = int(stroke_w * scale_factor)
r_outer2 = r_mid2 + stroke_w2 // 2
r_inner2 = r_mid2 - stroke_w2 // 2

draw2.ellipse([cx2 - r_outer2, cy2 - r_outer2, cx2 + r_outer2, cy2 + r_outer2], fill=BLUE)
pie_ring_segment(draw2, cx2, cy2, r_outer2, r_inner2, 0, 126, YELLOW)
draw2.ellipse([cx2 - r_outer2, cy2 - r_outer2, cx2 + r_outer2, cy2 + r_outer2], outline=INK, width=int(s(9)*scale_factor))
draw2.ellipse([cx2 - r_inner2, cy2 - r_inner2, cx2 + r_inner2, cy2 + r_inner2], outline=INK, width=int(s(9)*scale_factor))

center_r2 = int(s(62) * scale_factor)
draw2.ellipse([cx2 - center_r2, cy2 - center_r2, cx2 + center_r2, cy2 + center_r2], fill=CARD, outline=INK, width=int(s(8)*scale_factor))

rotated_crayon(draw2, cx2 - int(s(6)*scale_factor), cy2 + int(s(6)*scale_factor),
               length=int(s(58)*scale_factor), width=int(s(26)*scale_factor),
               angle_deg=-50, fill=PEACH)

img2 = img2.resize((512, 512), Image.LANCZOS)
img2.save('/home/claude/project/icons/icon-maskable-512.png')
print('saved icon-maskable-512.png')
