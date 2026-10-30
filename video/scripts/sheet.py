import sys, glob, os
from PIL import Image
# usage: sheet.py out.jpg frame frame ... (2 columns, 960x540 each)
out, frames = sys.argv[1], sys.argv[2:]
imgs = [Image.open(f"out/stills/RuleProofHackathon-{int(f):04d}.jpg").resize((960, 540)) for f in frames]
cols = 2
rows = (len(imgs) + 1) // 2
sheet = Image.new("RGB", (960 * cols, 540 * rows))
for i, im in enumerate(imgs):
    sheet.paste(im, ((i % cols) * 960, (i // cols) * 540))
sheet.save(out, quality=85)
