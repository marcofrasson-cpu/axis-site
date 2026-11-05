# Óleo de cannabis 30 mL — protótipo de rótulo (v1)

Três cultivares simuladas (Alva, Meridia, Noctis), um rótulo 95 × 45 mm para frasco conta-gotas Ø 32 mm.

- `index.html` — página de apresentação: frascos em mockup, rótulo planificado com cotas, spec.
- `rotulo-*.svg` — rótulo planificado em mm (vetor; fontes via Google Fonts).
- `exports/` — PNG a 300 dpi de cada rótulo e o trio de frascos.
- `build.js` — gera tudo (`node build.js <pasta>`; depende de `qrcode`).

Nomes, teores, terpenos e lotes são simulados. Textos legais a validar antes de imprimir.
