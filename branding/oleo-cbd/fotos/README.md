# Fotos de produto

- `pote-base.png` e `oleo.png`: fotos geradas no Higgsfield (GPT Image 2.6) a partir dos mockups.
- `jar-blank.png`: a foto do pote com o texto do rótulo apagado (`python3 blank.py pote-base.png jar-blank.png`), mantendo a luz real.
- `composite.js`: aplica o rótulo vetorial de cada strain sobre `jar-blank.png` e grava em `out/`. Strain nova entra em `build.js` e sai daqui sem custo.

As versões usadas no portal ficam em `portal/img/*.webp`.
