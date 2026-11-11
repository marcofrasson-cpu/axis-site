# Apaga o texto do rótulo na foto aprovada, mantendo a luz real do vidro/rótulo.
# Perfil horizontal de luz tirado de linhas sem texto; interpolado na vertical.
import sys
import numpy as np
from PIL import Image, ImageFilter

SRC, OUT = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)
X0, X1 = 224, 666          # bordas do pote
Y0, Y1 = 401, 795          # miolo do rótulo (as bordas reais ficam)
BANDS = [(456, 514), (552, 584), (676, 700), (745, 760), (776, 792)]  # linhas sem texto


def profile(y0, y1):
    seg = im[y0:y1, X0:X1, :]
    return np.median(seg, axis=0)  # (W, 3)


profs = [(0.5 * (a + b), profile(a, b)) for a, b in BANDS]
# lado direito: QR e textos do verso contaminam as faixas de cima; usa a faixa 776-792 (limpa) escalada
clean = profs[-1][1]
W = X1 - X0
RIGHT = 630 - X0
for i, (yc, p) in enumerate(profs[:-1]):
    k = p[RIGHT - 30:RIGHT].mean(axis=0) / np.maximum(clean[RIGHT - 30:RIGHT].mean(axis=0), 1e-3)
    p2 = p.copy(); p2[RIGHT:] = clean[RIGHT:] * k
    profs[i] = (yc, p2)

out = im.copy()
ys = np.array([yc for yc, _ in profs]); ps = np.stack([p for _, p in profs])  # (B, W, 3)
for y in range(Y0, Y1):
    j = np.clip(np.searchsorted(ys, y), 1, len(ys) - 1)
    t = np.clip((y - ys[j - 1]) / (ys[j] - ys[j - 1]), 0, 1) if ys[0] <= y <= ys[-1] else (0.0 if y < ys[0] else 1.0)
    row = ps[j - 1] * (1 - t) + ps[j] * t
    out[y, X0:X1, :] = row

# grão: reaproveita o ruído real de uma faixa limpa
rng = np.random.default_rng(7)
core = im[456:514, X0 + 40:X0 + RIGHT - 20, :]
sd = float((core - np.median(core, axis=0)).std())
H = Y1 - Y0
g = rng.normal(0, sd, size=(H, W, 1)).astype(np.float32)
g = np.asarray(Image.fromarray(np.clip(g[..., 0] * 20 + 128, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32)
out[Y0:Y1, X0:X1, :] += ((g - 128) / 20 * 1.4)[..., None]
print('grain sd', round(sd, 2))

res = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
# suaviza a costura de cima e de baixo
res.save(OUT)
print('ok', OUT)
