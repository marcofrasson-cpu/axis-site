// Aplica o rótulo vetorial de cada strain sobre a foto real do pote (rótulo em branco).
// Uso: NODE_PATH=<node_modules do qrcode>:/opt/node-tools/node_modules node composite.js
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const B = require('../build.js');
const GEN = __dirname;
const OUT = path.join(GEN, 'out');
fs.mkdirSync(OUT, { recursive: true });

// Geometria medida na foto (896 × 1120): pote x 224..666, rótulo y 397..797.
const PX = { x0: 224, x1: 666, y0: 397, y1: 797 };
const R_MM = 26.2;                                   // raio aparente em mm de rótulo
const SX = ((PX.x1 - PX.x0) / 2) / R_MM;             // px por mm na horizontal
const SY = (PX.y1 - PX.y0) / 50;                     // px por mm na vertical (rótulo de 50 mm)
const CX_MM = ((PX.x0 + PX.x1) / 2) / SX;

function svgFor(f, baseB64) {
  const id = `lbl-${f.id}`;
  // Hairlines horizontais saem do vetor enrolado (as emendas das tiras as deixam tracejadas) e são desenhadas em px.
  const art = B.flowerBody(f)
    .replace(`<rect width="150" height="50" rx="1.5" fill="${B.NAVY}"/>`, '')
    .replace(/<rect x="1\.5" y="1\.5"[^>]*\/>/, '')
    .replace(/<line x1="53" y1="16" x2="97" y2="16"[^>]*\/>/, '');
  const xOf = (u) => (PX.x0 + PX.x1) / 2 + ((PX.x1 - PX.x0) / 2) * Math.sin((u - 75) / R_MM);
  const HAIRPX = 'rgba(244,242,236,0.30)';
  const lines = `<line x1="${PX.x0}" y1="${(PX.y0 + 1.5 * SY).toFixed(1)}" x2="${PX.x1}" y2="${(PX.y0 + 1.5 * SY).toFixed(1)}" stroke="${HAIRPX}" stroke-width="1"/>
  <line x1="${PX.x0}" y1="${(PX.y0 + 48.5 * SY).toFixed(1)}" x2="${PX.x1}" y2="${(PX.y0 + 48.5 * SY).toFixed(1)}" stroke="${HAIRPX}" stroke-width="1"/>
  <line x1="${xOf(53).toFixed(1)}" y1="${(PX.y0 + 16 * SY).toFixed(1)}" x2="${xOf(97).toFixed(1)}" y2="${(PX.y0 + 16 * SY).toFixed(1)}" stroke="${HAIRPX}" stroke-width="1.1"/>`;
  const { strips, clips } = B.wrap(id, R_MM, CX_MM, 0, 50, 75, 140);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 896 1120" width="896" height="1120">
<style>:root{${B.FONT_CSS}} text{font-variant-numeric:tabular-nums}</style>
<defs>
  <g id="${id}">${art}</g>${clips}
  <clipPath id="lblclip"><rect x="${PX.x0}" y="${PX.y0}" width="${PX.x1 - PX.x0}" height="${PX.y1 - PX.y0}"/></clipPath>
  <linearGradient id="edge" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity="0.25"/><stop offset="0.12" stop-color="#fff" stop-opacity="0.85"/>
    <stop offset="0.3" stop-color="#fff" stop-opacity="1"/><stop offset="0.7" stop-color="#fff" stop-opacity="0.95"/>
    <stop offset="0.9" stop-color="#fff" stop-opacity="0.6"/><stop offset="1" stop-color="#fff" stop-opacity="0.15"/>
  </linearGradient>
  <mask id="edgemask" maskUnits="userSpaceOnUse" x="${PX.x0}" y="${PX.y0}" width="${PX.x1 - PX.x0}" height="${PX.y1 - PX.y0}"><rect x="${PX.x0}" y="${PX.y0}" width="${PX.x1 - PX.x0}" height="${PX.y1 - PX.y0}" fill="url(#edge)"/></mask>
  <filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="0.38"/></filter>
</defs>
<image href="data:image/png;base64,${baseB64}" x="0" y="0" width="896" height="1120"/>
<g clip-path="url(#lblclip)"><g mask="url(#edgemask)"><g filter="url(#soft)" opacity="0.93">
  ${lines}
  <g transform="translate(0,${PX.y0}) scale(${SX.toFixed(4)},${SY.toFixed(4)})">${strips}</g>
</g></g></g>
</svg>`;
}

(async () => {
  const baseB64 = fs.readFileSync(path.join(GEN, 'jar-blank.png')).toString('base64');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 896, height: 1120 }, deviceScaleFactor: 1 });
  for (const f of [...B.FLOWERS, ...B.PORTAL_EXTRA]) {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${B.GFONTS}"><style>body{margin:0;background:#000}svg{display:block}</style></head><body>${svgFor(f, baseB64)}</body></html>`;
    const file = path.join(OUT, `${f.id}.html`); fs.writeFileSync(file, html);
    await p.goto('file://' + file); await p.waitForTimeout(1800);
    await p.screenshot({ path: path.join(OUT, `${f.id}.png`) });
    console.log('ok', f.id);
  }
  await b.close();
})();
