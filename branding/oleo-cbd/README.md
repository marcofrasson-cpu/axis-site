# Embalagens Axis — protótipo v3

Dois produtos, uma grade: Óleo de CBD (frasco conta-gotas 30 mL, rótulo 95 × 45 mm) e flor em pote de vidro preto (3,5 g; rótulo de corpo 150 × 50 mm + rótulo de tampa Ø 42 mm) com três strains: Harlequin, Blue Dream, Northern Lights.

- `index.html` — página de apresentação: mockups, rótulos planificados com cotas, spec, referências.
- `rotulo-oleo-cbd.svg` — rótulo do óleo, em mm.
- `flor-<strain>-corpo.svg` / `flor-<strain>-tampa.svg` — rótulos de flor, em mm.
- `exports/` — PNG a 300 dpi de cada rótulo e cenas dos mockups.
- `build.js` — gera tudo (`node build.js <pasta>`; depende de `qrcode`).

Teores, terpenos, datas e lotes são simulados. Textos legais a validar antes de imprimir.
