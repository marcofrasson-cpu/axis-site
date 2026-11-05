// Gera rótulos (SVG planificado), página de apresentação e exports PNG.
// Unidades do rótulo: mm. Frasco conta-gotas 30 mL, Ø 32 mm. Rótulo 95 × 45 mm.
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const OUT = process.argv[2] || path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

// ---------- Paleta Axis (tokens do site) ----------
const NAVY = '#0d1b2a';
const CREAM = '#f4f2ec';
const MUTED = '#a2b0c2';
const HAIR = 'rgba(244,242,236,0.32)';

const STRAINS = [
  {
    id: 'alva', n: '01', name: 'Alva', kind: 'CBD-dominante', kindLower: 'CBD-dominante', ratio: '20 : 1',
    cbd: '50', thc: '2,5', accent: '#5fc89b', marker: { dy: -2.4, kind: 'disc' },
    terps: 'β-cariofileno · α-pineno', moment: 'Dia', lot: '2605-A',
    note: 'Baixo teor de THC.',
    desc: 'Cultivar de alto CBD para uso diurno. Sol nascendo: o ponto repousa logo acima do horizonte.'
  },
  {
    id: 'meridia', n: '02', name: 'Meridia', kind: 'Balanceado', kindLower: 'balanceado', ratio: '1 : 1',
    cbd: '25', thc: '25', accent: '#e8a13c', marker: { dy: -6.6, kind: 'disc' },
    terps: 'limoneno · linalol', moment: 'Dia e noite', lot: '2605-B',
    note: 'Contém THC. Pode causar sonolência; não dirija.',
    desc: 'Proporção 1 : 1, uso em qualquer período. Sol a pino: o ponto no alto, no âmbar do próprio óleo.'
  },
  {
    id: 'noctis', n: '03', name: 'Noctis', kind: 'THC-dominante', kindLower: 'THC-dominante', ratio: '1 : 4',
    cbd: '10', thc: '40', accent: '#c6d2df', marker: { dy: 3.2, kind: 'ring' },
    terps: 'mirceno · linalol', moment: 'Noite', lot: '2605-C',
    note: 'Contém THC. Pode causar sonolência; não dirija.',
    desc: 'Cultivar rica em THC para a noite. Lua: um anel abaixo do horizonte, em prata fria.'
  }
];

// ---------- Marca Axis (do logo-mark.svg), escalada para h mm ----------
function mark(x, y, h) {
  const s = h / 88; // altura original 88 (y 46..134)
  return `<g transform="translate(${x},${y}) scale(${s}) translate(-20.2,-46)" fill="none" stroke-linejoin="miter" stroke-width="5.5">
    <polygon points="60,46 99.8,68 99.8,112 60,134 20.2,112 20.2,68" stroke="#3a4a52"/>
    <polygon points="99.8,68 139.6,46 179.4,68 179.4,112 139.6,134 99.8,112" stroke="#5fc89b"/>
    <path d="M 126.6 116 L 139.6 58 L 152.6 116 M 131.1 95 L 148.1 95" stroke="#5fc89b"/>
    <circle cx="99.8" cy="68" r="6.5" fill="#5fc89b" stroke="none"/>
    <circle cx="99.8" cy="112" r="6.5" fill="#5fc89b" stroke="none"/>
  </g>`;
}

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

function text(x, y, str, { size = 1.5, fill = MUTED, font = 'body', weight = 400, anchor = 'start', ls = 0 } = {}) {
  const fam = font === 'display' ? 'var(--f-display)' : font === 'mono' ? 'var(--f-mono)' : 'var(--f-body)';
  return `<text x="${x}" y="${y}" font-family="${fam}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${ls ? ` letter-spacing="${ls}"` : ''}>${esc(str)}</text>`;
}

function para(x, y, lines, { size = 1.45, lh = 1.95, fill = MUTED } = {}) {
  return lines.map((l, i) => text(x, y + i * lh, l, { size, fill })).join('\n');
}

function qrSvg(x, y, size, data, fill) {
  const q = QRCode.create(data, { errorCorrectionLevel: 'M' });
  const n = q.modules.size;
  const m = size / n;
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (q.modules.get(r, c)) d += `M${(x + c * m).toFixed(3)} ${(y + r * m).toFixed(3)}h${m.toFixed(3)}v${m.toFixed(3)}h-${m.toFixed(3)}z`;
  }
  return `<path d="${d}" fill="${fill}"/>`;
}

// ---------- Rótulo planificado: conteúdo em coordenadas 0..95 × 0..45 ----------
function labelBody(s) {
  const L = 4, LW = 23;       // painel esquerdo
  const F = 31.5, FW = 32;    // painel frontal (115° do cilindro: legível de frente)
  const R = 68, RW = 23;      // painel direito
  const HZ = 15.5;            // linha do horizonte
  const parts = [];

  parts.push(`<rect width="95" height="45" rx="1.5" fill="${NAVY}"/>`);

  // --- Frontal ---
  parts.push(mark(F, 3.1, 3.2));
  parts.push(text(F + 6.5, 5.7, 'Axis FitoMed', { size: 2.05, fill: CREAM, weight: 500 }));
  parts.push(text(F + FW, 5.7, '30 mL', { size: 1.8, fill: MUTED, font: 'mono', anchor: 'end' }));

  parts.push(`<line x1="${F}" y1="${HZ}" x2="${F + FW}" y2="${HZ}" stroke="${HAIR}" stroke-width="0.14"/>`);
  const mx = F + FW / 2, my = HZ + s.marker.dy;
  if (s.marker.kind === 'disc') parts.push(`<circle cx="${mx}" cy="${my}" r="1.7" fill="${s.accent}"/>`);
  else parts.push(`<circle cx="${mx}" cy="${my}" r="1.55" fill="none" stroke="${s.accent}" stroke-width="0.3"/>`);

  parts.push(text(F - 0.3, 27.0, s.name, { size: 7.6, fill: s.accent, font: 'display', weight: 300, ls: -0.08 }));
  parts.push(text(F, 30.6, `Cultivar ${s.kindLower} · full-spectrum`, { size: 1.75, fill: MUTED }));

  const cols = [F, F + 12.2, F + 24.4];
  const labels = ['CBD', 'THC', 'Proporção'];
  const vals = [`${s.cbd} mg/mL`, `${s.thc} mg/mL`, s.ratio];
  cols.forEach((cx, i) => {
    parts.push(text(cx, 35.0, labels[i], { size: 1.45, fill: MUTED }));
    parts.push(text(cx, 38.0, vals[i], { size: 2.0, fill: CREAM, font: 'mono' }));
  });
  parts.push(text(F, 41.9, 'Óleo de cannabis em MCT · uso sublingual', { size: 1.35, fill: MUTED }));

  // --- Esquerdo: composição, uso, conservação ---
  let y = 5.6;
  const H = (t) => { const r = text(L, y, t, { size: 1.7, fill: CREAM, weight: 500 }); y += 2.5; return r; };
  const P = (lines) => { const r = para(L, y, lines); y += lines.length * 1.95 + 1.5; return r; };
  parts.push(H('Composição'));
  parts.push(P([
    'Extrato full-spectrum de',
    'Cannabis sativa L., cultivar',
    `${s.name}, em óleo de coco (MCT).`,
    `CBD ${s.cbd} mg/mL · THC ${s.thc} mg/mL.`,
    'Sem corante, aroma ou',
    'conservante.'
  ]));
  parts.push(H('Modo de uso'));
  parts.push(P([
    'Via sublingual, conforme',
    'prescrição médica. Agitar',
    'antes de usar. Manter sob a',
    'língua por 60 segundos.'
  ]));
  parts.push(H('Conservação'));
  parts.push(P([
    'Local fresco e seco, ao abrigo',
    'da luz. Após aberto, usar em',
    '90 dias.'
  ]));

  // --- Direito: laudo (QR), lote, avisos ---
  parts.push(text(R, 5.6, 'Laudo deste lote', { size: 1.7, fill: CREAM, weight: 500 }));
  parts.push(qrSvg(R, 7.4, 10.5, `https://axisfitomed.com.br/laudo/${s.lot}`, CREAM));
  parts.push(para(R + 12.3, 9.4, ['Escaneie', 'para ver o', 'CoA deste', 'lote.'], { size: 1.4, lh: 1.9 }));
  const rows = [['Lote', s.lot], ['Fab.', '05/2026'], ['Val.', '05/2027']];
  rows.forEach(([k, v], i) => {
    parts.push(text(R, 21.6 + i * 2.3, k, { size: 1.5, fill: MUTED, font: 'mono' }));
    parts.push(text(R + 6.5, 21.6 + i * 2.3, v, { size: 1.5, fill: CREAM, font: 'mono' }));
  });
  const noteLines = s.note === 'Baixo teor de THC.'
    ? ['Baixo teor de THC (20 : 1).']
    : ['Contém THC. Pode causar', 'sonolência; não dirija.'];
  parts.push(para(R, 29.6, [
    ...noteLines,
    'Mantenha fora do alcance',
    'de crianças. Gestantes e',
    'lactantes: só com orientação.'
  ], { size: 1.4, lh: 1.85 }));
  parts.push(para(R, 40.3, ['Uso exclusivo de associados.', 'Axis FitoMed · Florianópolis, SC'], { size: 1.4, lh: 1.85, fill: CREAM }));

  return parts.join('\n');
}

const FONT_CSS = `--f-display:'Spectral',Georgia,serif;--f-body:'Hanken Grotesk',-apple-system,system-ui,sans-serif;--f-mono:'IBM Plex Mono',ui-monospace,Menlo,monospace;`;
const GFONTS = 'https://fonts.googleapis.com/css2?family=Spectral:wght@300;400&family=Hanken+Grotesk:wght@400;500&family=IBM+Plex+Mono:wght@400&display=swap';

// Rótulo isolado (arquivo .svg)
function labelFile(s) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 95 45" width="95mm" height="45mm">
<title>Axis FitoMed · Óleo 30 mL · ${s.name} (${s.kind}, ${s.ratio})</title>
<style>@import url('${GFONTS}'); :root{${FONT_CSS}} text{font-variant-numeric:tabular-nums}</style>
${labelBody(s)}
</svg>`;
}

// Planificado com cotas (para a página): viewBox 0 0 107 55, rótulo em (6,5)
function dieline(s) {
  const ox = 6, oy = 5;
  const dim = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${MUTED}" stroke-width="0.12"/>`;
  const tick = (x, y, v) => v ? `<line x1="${x}" y1="${y - 0.8}" x2="${x}" y2="${y + 0.8}" stroke="${MUTED}" stroke-width="0.12"/>` : `<line x1="${x - 0.8}" y1="${y}" x2="${x + 0.8}" y2="${y}" stroke="${MUTED}" stroke-width="0.12"/>`;
  return `<svg class="dieline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 107 55" role="img" aria-label="Rótulo planificado ${s.name}, 95 por 45 milímetros">
<g transform="translate(${ox},${oy})">${labelBody(s)}
<rect width="95" height="45" rx="1.5" fill="none" stroke="rgba(244,242,236,0.22)" stroke-width="0.12"/>
<g stroke="rgba(244,242,236,0.10)" stroke-width="0.1" stroke-dasharray="0.6 0.6"><line x1="29.25" y1="0" x2="29.25" y2="45"/><line x1="65.75" y1="0" x2="65.75" y2="45"/></g>
</g>
${dim(ox, 2.6, ox + 95, 2.6)}${tick(ox, 2.6, true)}${tick(ox + 95, 2.6, true)}
${text(ox + 47.5, 2.1, '95 mm', { size: 1.5, fill: MUTED, font: 'mono', anchor: 'middle' })}
${dim(ox + 97.6, oy, ox + 97.6, oy + 45)}${tick(ox + 97.6, oy, false)}${tick(ox + 97.6, oy + 45, false)}
<g transform="translate(${ox + 99.4},${oy + 22.5}) rotate(90)">${text(0, 0, '45 mm', { size: 1.5, fill: MUTED, font: 'mono', anchor: 'middle' })}</g>
${text(ox + 14.6, oy + 48.3, 'verso · esquerda', { size: 1.3, fill: MUTED, anchor: 'middle' })}
${text(ox + 47.5, oy + 48.3, 'frente', { size: 1.3, fill: MUTED, anchor: 'middle' })}
${text(ox + 80.4, oy + 48.3, 'verso · direita', { size: 1.3, fill: MUTED, anchor: 'middle' })}
</svg>`;
}

// ---------- Frasco (mockup) ----------
// viewBox 0 0 70 128. Corpo Ø 32 (x 19..51), rótulo y 60..105.
function bottle(s, idSuffix = '') {
  const id = `lbl-${s.id}${idSuffix}`;
  const R = 16, CX = 35, LY = 60, LH = 45;
  const FRONT_C = 47.5; // centro do painel frontal no rótulo
  const N = 72, W = 50.265 / N; // meia circunferência visível = π·R
  let strips = '';
  for (let i = 0; i < N; i++) {
    const u = FRONT_C - 50.265 / 2 + (i + 0.5) * W;
    const th = (u - FRONT_C) / R;
    const sx = CX + R * Math.sin(th);
    const sc = Math.max(Math.cos(th), 0.02);
    strips += `<g transform="translate(${sx.toFixed(3)},${LY}) scale(${sc.toFixed(4)},1) translate(${(-u).toFixed(3)},0)" clip-path="url(#c-${id}-${i})"><use href="#${id}"/></g>`;
  }
  let clips = '';
  for (let i = 0; i < N; i++) {
    const u = FRONT_C - 50.265 / 2 + (i + 0.5) * W;
    clips += `<clipPath id="c-${id}-${i}"><rect x="${(u - W * 0.62).toFixed(3)}" y="0" width="${(W * 1.24).toFixed(3)}" height="${LH}"/></clipPath>`;
  }
  const g = `g-${s.id}${idSuffix}`;
  return `<svg class="bottle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 128" role="img" aria-label="Frasco conta-gotas 30 mL com rótulo ${s.name}">
<defs>
  <g id="${id}">${labelBody(s)}</g>
  ${clips}
  <linearGradient id="${g}-glass" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#1a0c03"/><stop offset="0.18" stop-color="#4a2409"/><stop offset="0.34" stop-color="#8a4a14"/>
    <stop offset="0.48" stop-color="#6a370e"/><stop offset="0.78" stop-color="#3a1b06"/><stop offset="1" stop-color="#120802"/>
  </linearGradient>
  <linearGradient id="${g}-shade" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#000" stop-opacity="0.62"/><stop offset="0.14" stop-color="#000" stop-opacity="0.22"/>
    <stop offset="0.30" stop-color="#fff" stop-opacity="0.07"/><stop offset="0.42" stop-color="#000" stop-opacity="0"/>
    <stop offset="0.80" stop-color="#000" stop-opacity="0.28"/><stop offset="1" stop-color="#000" stop-opacity="0.66"/>
  </linearGradient>
  <linearGradient id="${g}-cap" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#05080b"/><stop offset="0.3" stop-color="#1b2229"/><stop offset="0.45" stop-color="#2a333b"/><stop offset="1" stop-color="#05080b"/>
  </linearGradient>
  <linearGradient id="${g}-bulb" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#0a0d10"/><stop offset="0.35" stop-color="#2b3137"/><stop offset="1" stop-color="#0a0d10"/>
  </linearGradient>
  <radialGradient id="${g}-floor" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <clipPath id="${g}-body"><path d="M19 52 Q19 44 27 41 L29 40 L29 34 L41 34 L41 40 L43 41 Q51 44 51 52 L51 115 Q51 119 47 119 L23 119 Q19 119 19 115 Z"/></clipPath>
</defs>
<ellipse cx="35" cy="120.5" rx="24" ry="3.2" fill="url(#${g}-floor)"/>
<!-- bulbo de borracha -->
<path d="M28 17 Q28 5 35 5 Q42 5 42 17 Z" fill="url(#${g}-bulb)"/>
<!-- tampa conta-gotas -->
<rect x="25" y="16" width="20" height="18.5" rx="1.6" fill="url(#${g}-cap)"/>
<g stroke="#000" stroke-opacity="0.45" stroke-width="0.35">${Array.from({ length: 9 }, (_, i) => `<line x1="${27 + i * 2}" y1="17.5" x2="${27 + i * 2}" y2="33"/>`).join('')}</g>
<rect x="25" y="16" width="20" height="18.5" rx="1.6" fill="none" stroke="#fff" stroke-opacity="0.08" stroke-width="0.25"/>
<!-- vidro âmbar -->
<g clip-path="url(#${g}-body)">
  <rect x="19" y="34" width="32" height="85" fill="url(#${g}-glass)"/>
  <rect x="24.4" y="34" width="1.4" height="85" fill="#fff" fill-opacity="0.16"/>
  <rect x="47.2" y="34" width="0.8" height="85" fill="#fff" fill-opacity="0.07"/>
</g>
<!-- rótulo projetado no cilindro -->
<g clip-path="url(#${g}-body)">${strips}
  <rect x="19" y="${LY}" width="32" height="${LH}" fill="url(#${g}-shade)"/>
  <rect x="24.4" y="${LY}" width="1.4" height="${LH}" fill="#fff" fill-opacity="0.07"/>
</g>
<path d="M19 52 Q19 44 27 41 L29 40 L29 34 L41 34 L41 40 L43 41 Q51 44 51 52 L51 115 Q51 119 47 119 L23 119 Q19 119 19 115 Z" fill="none" stroke="#fff" stroke-opacity="0.10" stroke-width="0.25"/>
</svg>`;
}

// ---------- Página ----------
function specRows(s) {
  const rows = [
    ['Cultivar', `${s.name} (simulada)`], ['Perfil', s.kind], ['CBD', `${s.cbd} mg/mL`], ['THC', `${s.thc} mg/mL`],
    ['Proporção CBD : THC', s.ratio], ['Terpenos dominantes', s.terps], ['Momento de uso', s.moment],
    ['Acento', `<span class="sw" style="background:${s.accent}"></span>${s.accent}`],
    ['Marcador', s.marker.kind === 'disc' ? `Disco cheio, ${Math.abs(s.marker.dy).toFixed(1).replace('.', ',')} mm acima do horizonte` : `Anel, ${s.marker.dy.toFixed(1).replace('.', ',')} mm abaixo do horizonte`]
  ];
  return rows.map(([k, v]) => `<div class="k">${k}</div><div class="v">${v}</div>`).join('');
}

function page() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rótulos Óleo Axis</title>
<meta name="description" content="Protótipo de embalagem do óleo de cannabis 30 mL da Axis FitoMed: três cultivares, um rótulo.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${GFONTS}">
<style>
:root{
  /* Mundo único, escuro: chão do site Axis. Página de apresentação de produto. */
  --bg:#0a1522; --panel:#0f1c2b; --lift:#15273a; --hair:rgba(255,255,255,0.08);
  --text:#f1f5f9; --muted:#a2b0c2; --accent:#5fc89b;
  ${FONT_CSS}
  color-scheme:dark;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--bg)}
body{font-family:var(--f-body);color:var(--text);font-size:16px;line-height:1.5;-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px}
header.top{padding:56px 0 40px;border-bottom:1px solid var(--hair)}
.eyebrow{font-family:var(--f-mono);font-size:12px;color:var(--muted);letter-spacing:.02em;font-variant-numeric:tabular-nums}
h1{font-family:var(--f-display);font-weight:300;font-size:clamp(34px,4.6vw,60px);line-height:1.05;margin-top:14px;text-wrap:balance;letter-spacing:-.01em}
.lead{color:var(--muted);max-width:62ch;margin-top:16px;font-size:17px}
.hero{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:48px 0 32px;align-items:end}
.hero figure{display:flex;flex-direction:column;align-items:center;gap:14px}
.hero .bottle{width:100%;max-width:300px;height:auto;display:block}
.hero figcaption{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;font-size:14px;color:var(--muted);align-self:stretch;max-width:300px;margin:0 auto;width:100%}
.hero figcaption b{font-family:var(--f-display);font-weight:300;font-size:26px;color:var(--text);grid-column:1/-1;line-height:1.1}
.hero figcaption .m{font-family:var(--f-mono);color:var(--text);font-variant-numeric:tabular-nums;font-size:13px;text-align:right}
section{padding:48px 0;border-top:1px solid var(--hair)}
.sec-head{display:flex;align-items:baseline;gap:18px;margin-bottom:24px}
.sec-head .num{font-family:var(--f-mono);font-size:13px;color:var(--muted)}
h2{font-family:var(--f-display);font-weight:300;font-size:clamp(26px,3vw,40px);line-height:1.1;letter-spacing:-.01em}
.sec-head .kind{color:var(--muted);font-size:15px}
.desc{color:var(--muted);max-width:62ch;margin:-8px 0 24px}
.plate{background:var(--lift);border:1px solid var(--hair);border-radius:8px;padding:18px;overflow-x:auto}
.plate svg.dieline{display:block;min-width:720px;width:100%;height:auto}
.two{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;margin-top:24px;align-items:start}
.spec{display:grid;grid-template-columns:auto 1fr;gap:0 20px;font-size:14px;border-top:1px solid var(--hair)}
.spec .k,.spec .v{padding:10px 0;border-bottom:1px solid var(--hair)}
.spec .k{color:var(--muted)}
.spec .v{font-variant-numeric:tabular-nums}
.sw{display:inline-block;width:12px;height:12px;border-radius:2px;vertical-align:-1px;margin-right:8px}
.side{background:var(--panel);border:1px solid var(--hair);border-radius:8px;padding:18px;display:flex;justify-content:center}
.side .bottle{width:100%;max-width:220px;height:auto}
.sys{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 48px}
.sys dl{display:grid;grid-template-columns:auto 1fr;gap:0 20px;font-size:14px;border-top:1px solid var(--hair)}
.sys dt,.sys dd{padding:10px 0;border-bottom:1px solid var(--hair)}
.sys dt{color:var(--muted)}
footer{padding:32px 0 64px;color:var(--muted);font-size:13px;border-top:1px solid var(--hair)}
svg text{font-variant-numeric:tabular-nums}
@media (max-width:900px){.two{grid-template-columns:1fr}.side{order:-1}.sys{grid-template-columns:1fr}}
@media (max-width:640px){.hero{grid-template-columns:1fr;gap:40px}.hero .bottle{max-width:240px}header.top{padding:40px 0 28px}}
</style>
</head>
<body>
<div class="wrap">
<header class="top">
  <div class="eyebrow">Axis FitoMed · Embalagem · Protótipo v1 · 05/11/2026</div>
  <h1>Óleo de cannabis, 30 mL. Três cultivares, um rótulo.</h1>
  <p class="lead">Frasco conta-gotas em vidro âmbar, tampa preta fosca, rótulo navy 95 × 45 mm. O que muda entre as cultivares é só o acento de cor e a posição do ponto sobre a linha do horizonte: o eixo da Axis.</p>
</header>

<div class="hero">
${STRAINS.map(s => `  <figure>${bottle(s, '-h')}<figcaption><b>${s.name}</b><span>${s.kind}</span><span class="m">${s.ratio}</span><span>CBD · THC</span><span class="m">${s.cbd} · ${s.thc} mg/mL</span></figcaption></figure>`).join('\n')}
</div>

${STRAINS.map(s => `<section id="${s.id}">
  <div class="sec-head"><span class="num">${s.n}</span><h2>${s.name}</h2><span class="kind">${s.kind} · ${s.ratio}</span></div>
  <p class="desc">${s.desc}</p>
  <div class="plate">${dieline(s)}</div>
  <div class="two">
    <div class="spec">${specRows(s)}</div>
    <div class="side">${bottle(s, '-s')}</div>
  </div>
</section>`).join('\n')}

<section id="sistema">
  <div class="sec-head"><span class="num">04</span><h2>Sistema</h2></div>
  <div class="sys">
    <dl>
      <dt>Frasco</dt><dd>Conta-gotas 30 mL, vidro âmbar, Ø 32 mm, tampa e bulbo pretos foscos.</dd>
      <dt>Rótulo</dt><dd>95 × 45 mm, cantos r 1,5 mm, emenda de 5 mm no verso. Frente de 32 mm centrada (115° do cilindro); dois painéis de verso com 23 mm.</dd>
      <dt>Fundo</dt><dd>Navy da marca, ${NAVY}. Papel fosco texturizado ou vinil fosco; sem verniz brilhante.</dd>
      <dt>Texto</dt><dd>Creme ${CREAM} para o essencial, cinza-azulado ${MUTED} para o apoio. Caixa normal, sem caps lock.</dd>
    </dl>
    <dl>
      <dt>Tipografia</dt><dd>Spectral Light só no nome da cultivar. Hanken Grotesk no texto. IBM Plex Mono para dado: teor, proporção, lote, volume.</dd>
      <dt>Acento</dt><dd>Uma cor por cultivar, em dois lugares: nome e marcador. Verde da marca, âmbar do óleo, prata fria.</dd>
      <dt>Marcador</dt><dd>Linha hairline é o horizonte. Disco acima: sol (dia). Anel abaixo: lua (noite). Altura cresce com a posição do dia.</dd>
      <dt>Verso</dt><dd>QR leva ao CoA do lote. Lote, fabricação e validade em mono. Avisos de THC só onde há THC relevante.</dd>
    </dl>
  </div>
</section>

<footer>Nomes de cultivar, teores, terpenos e lotes são simulados para o protótipo. Textos legais e de advertência a validar antes da impressão.</footer>
</div>
</body>
</html>`;
}

// ---------- Escrita ----------
for (const s of STRAINS) fs.writeFileSync(path.join(OUT, `rotulo-${s.id}.svg`), labelFile(s));
fs.writeFileSync(path.join(OUT, 'index.html'), page());
console.log('ok', OUT);
