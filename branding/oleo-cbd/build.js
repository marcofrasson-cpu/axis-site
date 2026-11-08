// Gera rótulos (SVG planificado em mm), página de apresentação e exports PNG.
// Dois produtos: Óleo de CBD (frasco conta-gotas 30 mL, Ø 32 mm, rótulo 95 × 45 mm)
// e flor em pote (vidro preto Ø 50 mm, rótulo de corpo 150 × 50 mm + rótulo de tampa Ø 42 mm).
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
const GREEN = '#5fc89b', AMBER = '#e8a13c', SILVER = '#c6d2df';

const OIL = {
  id: 'oleo', name: 'Óleo de CBD', ratio: '20 : 1', cbd: 50, thc: 2.5, accent: GREEN, lot: '2605-O',
  fab: '05/2026', val: '05/2027'
};

const FLOWERS = [
  {
    id: 'harlequin', n: '01', name: 'Harlequin', type: 'Sativa-dominante', lean: 0.32,
    thc: 7, cbd: 12, terpTotal: 1.8, accent: GREEN, lot: '2610-H',
    terps: [['Mirceno', 0.62], ['α-Pineno', 0.41], ['β-Cariofileno', 0.30]],
    harvest: '09/2026', packed: '10/2026', val: '04/2027',
    desc: 'Rica em CBD, com THC presente. Sativa-dominante: o ponto fica no terço da esquerda do eixo.'
  },
  {
    id: 'blue-dream', n: '02', name: 'Blue Dream', type: 'Híbrida, sativa-dominante', lean: 0.42,
    thc: 19, cbd: 0.4, terpTotal: 2.1, accent: AMBER, lot: '2610-B',
    terps: [['Mirceno', 0.74], ['α-Pineno', 0.48], ['β-Cariofileno', 0.33]],
    harvest: '09/2026', packed: '10/2026', val: '04/2027',
    desc: 'Híbrida clássica, THC alto. O ponto pouco antes do centro do eixo.'
  },
  {
    id: 'northern-lights', n: '03', name: 'Northern Lights', type: 'Indica', lean: 0.9,
    thc: 18, cbd: 0.3, terpTotal: 1.9, accent: SILVER, lot: '2610-N',
    terps: [['Mirceno', 0.81], ['β-Cariofileno', 0.38], ['Humuleno', 0.19]],
    harvest: '09/2026', packed: '10/2026', val: '04/2027',
    desc: 'Indica para a noite. O ponto na ponta direita do eixo.'
  }
];

// ---------- Helpers ----------
const mg = (v) => String(v).replace('.', ',');
const pct = (v) => mg(v.toFixed(v < 1 ? 2 : 1)) + ' %';
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

function mark(x, y, h) {
  const s = h / 88;
  return `<g transform="translate(${x},${y}) scale(${s}) translate(-20.2,-46)" fill="none" stroke-linejoin="miter" stroke-width="5.5">
    <polygon points="60,46 99.8,68 99.8,112 60,134 20.2,112 20.2,68" stroke="#3a4a52"/>
    <polygon points="99.8,68 139.6,46 179.4,68 179.4,112 139.6,134 99.8,112" stroke="#5fc89b"/>
    <path d="M 126.6 116 L 139.6 58 L 152.6 116 M 131.1 95 L 148.1 95" stroke="#5fc89b"/>
    <circle cx="99.8" cy="68" r="6.5" fill="#5fc89b" stroke="none"/>
    <circle cx="99.8" cy="112" r="6.5" fill="#5fc89b" stroke="none"/>
  </g>`;
}

function text(x, y, str, { size = 1.5, fill = MUTED, font = 'body', weight = 400, anchor = 'start', ls = 0 } = {}) {
  const fam = font === 'display' ? 'var(--f-display)' : font === 'mono' ? 'var(--f-mono)' : 'var(--f-body)';
  return `<text x="${x}" y="${y}" font-family="${fam}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${ls ? ` letter-spacing="${ls}"` : ''}>${esc(str)}</text>`;
}
function para(x, y, lines, { size = 1.45, lh = 1.95, fill = MUTED } = {}) {
  return lines.map((l, i) => text(x, y + i * lh, l, { size, fill })).join('\n');
}
function qrSvg(x, y, size, data, fill) {
  const q = QRCode.create(data, { errorCorrectionLevel: 'M' });
  const n = q.modules.size, m = size / n;
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (q.modules.get(r, c)) d += `M${(x + c * m).toFixed(3)} ${(y + r * m).toFixed(3)}h${m.toFixed(3)}v${m.toFixed(3)}h-${m.toFixed(3)}z`;
  }
  return `<path d="${d}" fill="${fill}"/>`;
}
function axis(x, w, y, frac, accent, left, right) {
  return `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="${HAIR}" stroke-width="0.14"/>
<circle cx="${(x + 1.6 + (w - 3.2) * frac).toFixed(2)}" cy="${y}" r="1.6" fill="${accent}"/>
${text(x, y + 2.9, left, { size: 1.3, fill: MUTED })}
${text(x + w, y + 2.9, right, { size: 1.3, fill: MUTED, anchor: 'end' })}`;
}
const frame = (w, h, i = 1.5) => `<rect x="${i}" y="${i}" width="${w - 2 * i}" height="${h - 2 * i}" rx="0.8" fill="none" stroke="${HAIR}" stroke-width="0.12"/>`;
function dataRow(cols, y, labels, vals, size = 2.0) {
  return cols.map((cx, i) => text(cx, y, labels[i], { size: 1.45, fill: MUTED }) + text(cx, y + 3.0, vals[i], { size, fill: CREAM, font: 'mono' })).join('\n');
}
function laudo(x, y, lot, qrSize = 10.5) {
  return text(x, y, 'Laudo deste lote', { size: 1.7, fill: CREAM, weight: 500 }) +
    qrSvg(x, y + 1.8, qrSize, `https://axisfitomed.com.br/laudo/${lot}`, CREAM) +
    para(x + qrSize + 1.8, y + 3.8, ['Escaneie', 'para ver o', 'CoA deste', 'lote.'], { size: 1.4, lh: 1.9 });
}
function kv(x, y, rows, keyW = 6.5, lh = 2.3) {
  return rows.map(([k, v], i) => text(x, y + i * lh, k, { size: 1.5, fill: MUTED, font: 'mono' }) + text(x + keyW, y + i * lh, v, { size: 1.5, fill: CREAM, font: 'mono' })).join('\n');
}

// ---------- Óleo de CBD: rótulo 95 × 45 ----------
function oilBody(o) {
  const L = 4.6, F = 31.5, FW = 32, R = 68, HZ = 15.0;
  const p = [];
  p.push(`<rect width="95" height="45" rx="1.5" fill="${NAVY}"/>`);
  p.push(frame(95, 45));
  // frente
  p.push(mark(F, 3.1, 3.2));
  p.push(text(F + 6.5, 5.7, 'Axis FitoMed', { size: 2.05, fill: CREAM, weight: 500 }));
  p.push(text(F + FW, 5.7, '30 mL', { size: 1.8, fill: MUTED, font: 'mono', anchor: 'end' }));
  p.push(axis(F, FW, HZ, o.thc / (o.cbd + o.thc), o.accent, 'CBD', 'THC'));
  p.push(text(F - 0.2, 27.4, o.name, { size: 6.4, fill: CREAM, font: 'display', weight: 300, ls: -0.1 }));
  p.push(text(F, 31.0, 'Full-spectrum · em óleo de coco (MCT)', { size: 1.75, fill: MUTED }));
  p.push(dataRow([F, F + 12.2, F + 24.4], 35.2, ['CBD', 'THC', 'Proporção'], [`${mg(o.cbd)} mg/mL`, `${mg(o.thc)} mg/mL`, o.ratio]));
  p.push(text(F, 41.6, 'Uso sublingual, conforme prescrição médica', { size: 1.35, fill: MUTED }));
  // verso esquerdo
  let y = 6.0;
  const H = (t) => { const r = text(L, y, t, { size: 1.7, fill: CREAM, weight: 500 }); y += 2.5; return r; };
  const P = (lines) => { const r = para(L, y, lines); y += lines.length * 1.95 + 1.5; return r; };
  p.push(H('Composição'));
  p.push(P(['Extrato full-spectrum de', 'Cannabis sativa L. em óleo', 'de coco (MCT).', `CBD ${mg(o.cbd)} mg/mL · THC ${mg(o.thc)} mg/mL.`, 'Sem corante, aroma ou', 'conservante.']));
  p.push(H('Modo de uso'));
  p.push(P(['Via sublingual, conforme', 'prescrição médica. Agitar', 'antes de usar. Manter sob a', 'língua por 60 segundos.']));
  p.push(H('Conservação'));
  p.push(P(['Local fresco e seco, ao abrigo', 'da luz. Após aberto, usar em', '90 dias.']));
  // verso direito
  p.push(laudo(R, 6.0, o.lot));
  p.push(kv(R, 22.0, [['Lote', o.lot], ['Fab.', o.fab], ['Val.', o.val]]));
  p.push(para(R, 30.0, [`Baixo teor de THC (${o.ratio}).`, 'Mantenha fora do alcance', 'de crianças. Gestantes e', 'lactantes: só com orientação.'], { size: 1.4, lh: 1.85 }));
  p.push(para(R, 39.9, ['Uso exclusivo de associados.', 'Axis FitoMed · Florianópolis, SC'], { size: 1.4, lh: 1.85, fill: CREAM }));
  return p.join('\n');
}

// ---------- Flor: rótulo de corpo 150 × 50 ----------
function flowerBody(f) {
  const L = 4.8, F = 53, FW = 44, R = 102, HZ = 16;
  const p = [];
  p.push(`<rect width="150" height="50" rx="1.5" fill="${NAVY}"/>`);
  p.push(frame(150, 50));
  // frente
  p.push(mark(F, 3.3, 3.4));
  p.push(text(F + 6.9, 6.1, 'Axis FitoMed', { size: 2.2, fill: CREAM, weight: 500 }));
  p.push(text(F + FW, 6.1, '3,5 g', { size: 1.9, fill: MUTED, font: 'mono', anchor: 'end' }));
  p.push(axis(F, FW, HZ, f.lean, f.accent, 'Sativa', 'Indica'));
  p.push(text(F - 0.3, 30.4, f.name, { size: Math.min(9.0, 44 / (f.name.length * 0.52)), fill: f.accent, font: 'display', weight: 300, ls: -0.12 }));
  p.push(text(F, 34.4, `Flor curada · ${f.type.toLowerCase()}`, { size: 2.0, fill: MUTED }));
  p.push(dataRow([F, F + 18], 39.2, ['THC', 'CBD'], [pct(f.thc), pct(f.cbd)], 2.6));
  p.push(text(F, 46.0, 'Uso por vaporização, conforme prescrição médica', { size: 1.4, fill: MUTED }));
  // verso esquerdo: terpenos, cultivo, conservação
  let y = 6.1;
  const H = (t) => { const r = text(L, y, t, { size: 1.8, fill: CREAM, weight: 500 }); y += 2.7; return r; };
  const P = (lines) => { const r = para(L, y, lines, { size: 1.5, lh: 2.0 }); y += lines.length * 2.0 + 1.6; return r; };
  p.push(H(`Terpenos · ${pct(f.terpTotal)}`));
  const tk = f.terps.map(([k, v]) => [k, pct(v)]);
  p.push(kv(L, y, tk, 20, 2.2)); y += tk.length * 2.2 + 1.6;
  p.push(H('Cultivo'));
  p.push(P(['Cultivo indoor, sem agrotóxico. Secagem', 'lenta e cura de 30 dias. Umidade', 'controlada entre 58 e 62 %.']));
  p.push(H('Conservação'));
  p.push(P(['Manter fechado, ao abrigo da luz e do', 'calor. Consumir em 6 meses após', 'embalado.']));
  // verso direito: laudo, lote, avisos
  p.push(laudo(R, 6.1, f.lot, 11));
  p.push(kv(R, 23.2, [['Lote', f.lot], ['Colheita', f.harvest], ['Embalado', f.packed], ['Val.', f.val]], 10, 2.3));
  p.push(para(R, 34.4, ['Contém THC. Pode causar sonolência; não dirija.', 'Mantenha fora do alcance de crianças. Gestantes', 'e lactantes: só com orientação médica.'], { size: 1.4, lh: 1.9 }));
  p.push(para(R, 42.4, ['Uso exclusivo de associados.', 'Axis FitoMed · Florianópolis, SC'], { size: 1.4, lh: 1.9, fill: CREAM }));
  return p.join('\n');
}

// ---------- Flor: rótulo de tampa Ø 42 ----------
function lidBody(f) {
  const c = 21;
  return `<circle cx="${c}" cy="${c}" r="21" fill="${NAVY}"/>
<circle cx="${c}" cy="${c}" r="19.2" fill="none" stroke="${HAIR}" stroke-width="0.14"/>
${mark(c - 7.1, 7.6, 7.8)}
${text(c, 22.6, 'Axis FitoMed', { size: 2.4, fill: CREAM, weight: 500, anchor: 'middle' })}
${text(c, 29.0, f.name, { size: f.name.length > 10 ? 3.4 : 4.2, fill: f.accent, font: 'display', weight: 300, anchor: 'middle' })}
${text(c, 33.2, `THC ${pct(f.thc)} · CBD ${pct(f.cbd)} · 3,5 g`, { size: 1.5, fill: MUTED, font: 'mono', anchor: 'middle' })}`;
}

const FONT_CSS = `--f-display:'Spectral',Georgia,serif;--f-body:'Hanken Grotesk',-apple-system,system-ui,sans-serif;--f-mono:'IBM Plex Mono',ui-monospace,Menlo,monospace;`;
const GFONTS = 'https://fonts.googleapis.com/css2?family=Spectral:wght@300;400&family=Hanken+Grotesk:wght@400;500&family=IBM+Plex+Mono:wght@400&display=swap';

function svgFile(w, h, title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm">
<title>${esc(title)}</title>
<style>@import url('${GFONTS}'); :root{${FONT_CSS}} text{font-variant-numeric:tabular-nums}</style>
${body}
</svg>`;
}

// ---------- Planificado com cotas ----------
function dieline(body, W, H, guides, captions, aria) {
  const ox = 6, oy = 5;
  const line = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${MUTED}" stroke-width="0.12"/>`;
  return `<svg class="dieline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W + 12} ${H + 10}" role="img" aria-label="${esc(aria)}">
<g transform="translate(${ox},${oy})">${body}
<rect width="${W}" height="${H}" rx="1.5" fill="none" stroke="rgba(244,242,236,0.22)" stroke-width="0.12"/>
<g stroke="rgba(244,242,236,0.10)" stroke-width="0.1" stroke-dasharray="0.6 0.6">${guides.map(g => `<line x1="${g}" y1="0" x2="${g}" y2="${H}"/>`).join('')}</g>
</g>
${line(ox, 2.6, ox + W, 2.6)}${line(ox, 1.8, ox, 3.4)}${line(ox + W, 1.8, ox + W, 3.4)}
${text(ox + W / 2, 2.1, `${W} mm`, { size: 1.5, fill: MUTED, font: 'mono', anchor: 'middle' })}
${line(ox + W + 2.6, oy, ox + W + 2.6, oy + H)}${line(ox + W + 1.8, oy, ox + W + 3.4, oy)}${line(ox + W + 1.8, oy + H, ox + W + 3.4, oy + H)}
<g transform="translate(${ox + W + 4.4},${oy + H / 2}) rotate(90)">${text(0, 0, `${H} mm`, { size: 1.5, fill: MUTED, font: 'mono', anchor: 'middle' })}</g>
${captions.map(([x, t]) => text(ox + x, oy + H + 3.3, t, { size: 1.3, fill: MUTED, anchor: 'middle' })).join('\n')}
</svg>`;
}
function lidDieline(f) {
  return `<svg class="dieline lid" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 52" role="img" aria-label="Rótulo de tampa ${esc(f.name)}, 42 milímetros de diâmetro">
<g transform="translate(6,5)">${lidBody(f)}<circle cx="21" cy="21" r="21" fill="none" stroke="rgba(244,242,236,0.22)" stroke-width="0.12"/></g>
<line x1="6" y1="2.6" x2="48" y2="2.6" stroke="${MUTED}" stroke-width="0.12"/><line x1="6" y1="1.8" x2="6" y2="3.4" stroke="${MUTED}" stroke-width="0.12"/><line x1="48" y1="1.8" x2="48" y2="3.4" stroke="${MUTED}" stroke-width="0.12"/>
${text(27, 2.1, 'Ø 42 mm', { size: 1.5, fill: MUTED, font: 'mono', anchor: 'middle' })}
${text(27, 50.3, 'tampa', { size: 1.3, fill: MUTED, anchor: 'middle' })}
</svg>`;
}

// ---------- Projeção cilíndrica (rótulo enrolado) ----------
function wrap(id, R, CX, LY, LH, frontC, N = 72) {
  const half = Math.PI * R, W = (2 * half) / N;
  let strips = '', clips = '';
  for (let i = 0; i < N; i++) {
    const u = frontC - half + (i + 0.5) * W;
    const th = (u - frontC) / R;
    const sx = CX + R * Math.sin(th), sc = Math.max(Math.cos(th), 0.02);
    strips += `<g transform="translate(${sx.toFixed(3)},${LY}) scale(${sc.toFixed(4)},1) translate(${(-u).toFixed(3)},0)" clip-path="url(#c-${id}-${i})"><use href="#${id}"/></g>`;
    clips += `<clipPath id="c-${id}-${i}"><rect x="${(u - W * 0.62).toFixed(3)}" y="0" width="${(W * 1.24).toFixed(3)}" height="${LH}"/></clipPath>`;
  }
  return { strips, clips };
}
const shade = (g) => `<linearGradient id="${g}-shade" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#000" stop-opacity="0.62"/><stop offset="0.14" stop-color="#000" stop-opacity="0.22"/>
    <stop offset="0.30" stop-color="#fff" stop-opacity="0.07"/><stop offset="0.42" stop-color="#000" stop-opacity="0"/>
    <stop offset="0.80" stop-color="#000" stop-opacity="0.28"/><stop offset="1" stop-color="#000" stop-opacity="0.66"/>
  </linearGradient>`;

// Frasco conta-gotas: viewBox 0 0 70 128, corpo Ø 32 (x 19..51), rótulo y 60..105
function bottle(o, sfx) {
  const id = `lbl-${o.id}${sfx}`, g = `g-${o.id}${sfx}`;
  const { strips, clips } = wrap(id, 16, 35, 60, 45, 47.5);
  const body = 'M19 52 Q19 44 27 41 L29 40 L29 34 L41 34 L41 40 L43 41 Q51 44 51 52 L51 115 Q51 119 47 119 L23 119 Q19 119 19 115 Z';
  return `<svg class="bottle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 150" role="img" aria-label="Frasco conta-gotas 30 mL de Óleo de CBD">
<defs><g id="${id}">${oilBody(o)}</g>${clips}
  <linearGradient id="${g}-glass" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#1a0c03"/><stop offset="0.18" stop-color="#4a2409"/><stop offset="0.34" stop-color="#8a4a14"/><stop offset="0.48" stop-color="#6a370e"/><stop offset="0.78" stop-color="#3a1b06"/><stop offset="1" stop-color="#120802"/></linearGradient>
  ${shade(g)}
  <linearGradient id="${g}-cap" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#05080b"/><stop offset="0.3" stop-color="#1b2229"/><stop offset="0.45" stop-color="#2a333b"/><stop offset="1" stop-color="#05080b"/></linearGradient>
  <radialGradient id="${g}-floor" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <clipPath id="${g}-body"><path d="${body}"/></clipPath>
  <linearGradient id="${g}-metal" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#2a2f35"/><stop offset="0.3" stop-color="#8b949c"/><stop offset="0.45" stop-color="#d7dce0"/><stop offset="0.7" stop-color="#5a626a"/><stop offset="1" stop-color="#1b1f24"/></linearGradient>
  <linearGradient id="${g}-base" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></linearGradient>
  <linearGradient id="${g}-refl" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <mask id="${g}-rmask"><rect x="0" y="119" width="70" height="40" fill="url(#${g}-refl)"/></mask>
  <g id="${g}-obj">
    <path d="M28 17 Q28 5 35 5 Q42 5 42 17 Z" fill="url(#${g}-cap)"/>
    <path d="M30 8 Q31.5 6.2 34 6" fill="none" stroke="#fff" stroke-opacity="0.18" stroke-width="0.5" stroke-linecap="round"/>
    <rect x="25" y="16" width="20" height="17.5" rx="1.6" fill="url(#${g}-cap)"/>
    <g stroke="#000" stroke-opacity="0.45" stroke-width="0.35">${Array.from({ length: 9 }, (_, i) => `<line x1="${27 + i * 2}" y1="17.5" x2="${27 + i * 2}" y2="32"/>`).join('')}</g>
    <rect x="26.6" y="33" width="16.8" height="2.6" fill="url(#${g}-metal)"/>
    <g clip-path="url(#${g}-body)"><rect x="19" y="34" width="32" height="85" fill="url(#${g}-glass)"/><rect x="19" y="108" width="32" height="11" fill="url(#${g}-base)"/><rect x="24.4" y="34" width="1.4" height="85" fill="#fff" fill-opacity="0.16"/><rect x="47.2" y="34" width="0.8" height="85" fill="#fff" fill-opacity="0.07"/></g>
    <g clip-path="url(#${g}-body)">${strips}<rect x="19" y="60" width="32" height="45" fill="url(#${g}-shade)"/><rect x="24.4" y="60" width="1.4" height="45" fill="#fff" fill-opacity="0.07"/></g>
    <g clip-path="url(#${g}-body)"><rect x="50.2" y="36" width="0.8" height="83" fill="#fff" fill-opacity="0.22"/><rect x="19" y="36" width="0.6" height="83" fill="#fff" fill-opacity="0.10"/></g>
    <path d="${body}" fill="none" stroke="#fff" stroke-opacity="0.10" stroke-width="0.25"/>
  </g>
</defs>
<ellipse cx="35" cy="120.5" rx="24" ry="3.2" fill="url(#${g}-floor)"/>
<g mask="url(#${g}-rmask)" transform="translate(0,238) scale(1,-1)"><use href="#${g}-obj"/></g>
<use href="#${g}-obj"/>
</svg>`;
}

// Pote de flor: viewBox 0 0 90 112. Tampa Ø 54 (x 18..72, y 10..25), corpo Ø 50 (x 20..70, y 25..103), rótulo y 44..94
function jar(f, sfx) {
  const id = `lbl-${f.id}${sfx}`, g = `g-${f.id}${sfx}`;
  const { strips, clips } = wrap(id, 25, 45, 44, 50, 75, 96);
  const body = 'M20 29 Q20 25 24 25 L66 25 Q70 25 70 29 L70 98 Q70 103 65 103 L25 103 Q20 103 20 98 Z';
  return `<svg class="jar" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 134" role="img" aria-label="Pote de flor 3,5 g, strain ${esc(f.name)}">
<defs><g id="${id}">${flowerBody(f)}</g>${clips}
  <linearGradient id="${g}-glass" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#05080b"/><stop offset="0.2" stop-color="#161c22"/><stop offset="0.34" stop-color="#2b333b"/><stop offset="0.5" stop-color="#1c2329"/><stop offset="0.8" stop-color="#0f1419"/><stop offset="1" stop-color="#030507"/></linearGradient>
  ${shade(g)}
  <linearGradient id="${g}-cap" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#05080b"/><stop offset="0.3" stop-color="#1b2229"/><stop offset="0.45" stop-color="#2a333b"/><stop offset="1" stop-color="#05080b"/></linearGradient>
  <radialGradient id="${g}-floor" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <clipPath id="${g}-body"><path d="${body}"/></clipPath>
  <linearGradient id="${g}-base" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/></linearGradient>
  <linearGradient id="${g}-lip" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#0a0e12"/><stop offset="0.3" stop-color="#3a444d"/><stop offset="0.5" stop-color="#5a656e"/><stop offset="1" stop-color="#0a0e12"/></linearGradient>
  <linearGradient id="${g}-refl" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.2"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <mask id="${g}-rmask"><rect x="0" y="103" width="90" height="40" fill="url(#${g}-refl)"/></mask>
  <g id="${g}-obj">
    <rect x="18" y="10" width="54" height="15.5" rx="2" fill="url(#${g}-cap)"/>
    <g stroke="#000" stroke-opacity="0.45" stroke-width="0.4">${Array.from({ length: 25 }, (_, i) => `<line x1="${20 + i * 2.08}" y1="11.5" x2="${20 + i * 2.08}" y2="23"/>`).join('')}</g>
    <rect x="18" y="10" width="54" height="15.5" rx="2" fill="none" stroke="#fff" stroke-opacity="0.10" stroke-width="0.25"/>
    <rect x="18.5" y="24.2" width="53" height="1.6" fill="url(#${g}-lip)"/>
    <g clip-path="url(#${g}-body)"><rect x="20" y="25" width="50" height="78" fill="url(#${g}-glass)"/><rect x="20" y="92" width="50" height="11" fill="url(#${g}-base)"/><rect x="28" y="25" width="1.8" height="78" fill="#fff" fill-opacity="0.12"/><rect x="63" y="25" width="1" height="78" fill="#fff" fill-opacity="0.06"/></g>
    <g clip-path="url(#${g}-body)">${strips}<rect x="20" y="44" width="50" height="50" fill="url(#${g}-shade)"/><rect x="28" y="44" width="1.8" height="50" fill="#fff" fill-opacity="0.07"/></g>
    <g clip-path="url(#${g}-body)"><rect x="69.2" y="27" width="0.8" height="76" fill="#fff" fill-opacity="0.22"/><rect x="20" y="27" width="0.6" height="76" fill="#fff" fill-opacity="0.10"/></g>
    <path d="${body}" fill="none" stroke="#fff" stroke-opacity="0.10" stroke-width="0.25"/>
  </g>
</defs>
<ellipse cx="45" cy="104.5" rx="32" ry="3.4" fill="url(#${g}-floor)"/>
<g mask="url(#${g}-rmask)" transform="translate(0,206) scale(1,-1)"><use href="#${g}-obj"/></g>
<use href="#${g}-obj"/>
</svg>`;
}

// ---------- Página ----------
const row = (k, v) => `<div class="k">${k}</div><div class="v">${v}</div>`;
const sw = (c) => `<span class="sw" style="background:${c}"></span>${c}`;
function oilSpec(o) {
  return [row('Produto', 'Óleo de CBD full-spectrum, 30 mL'), row('Frasco', 'Conta-gotas, vidro âmbar, Ø 32 mm'), row('CBD', `${mg(o.cbd)} mg/mL`), row('THC', `${mg(o.thc)} mg/mL`),
    row('Proporção CBD : THC', o.ratio), row('Rótulo', '95 × 45 mm, frente de 32 mm'), row('Acento', sw(o.accent))].join('');
}
function flowerSpec(f) {
  return [row('Produto', 'Flor curada, 3,5 g'), row('Strain', `${f.name} (lote simulado)`), row('Tipo', f.type), row('THC', pct(f.thc)), row('CBD', pct(f.cbd)),
    row('Terpenos', `${pct(f.terpTotal)} · ${f.terps.map(t => t[0].toLowerCase()).join(' · ')}`), row('Pote', 'Vidro preto UV, Ø 50 mm, tampa preta fosca'),
    row('Rótulos', 'Corpo 150 × 50 mm · tampa Ø 42 mm'), row('Acento', sw(f.accent)), row('Ponto no eixo', `${Math.round(f.lean * 100)} % de sativa para indica`)].join('');
}

const REFS = [
  ['Custom Cannabis Jar Labels: Design, Specs & Compliance Guide', 'https://www.beastcoastpackaging.com/learning-center/custom-cannabis-jar-labels/', 'Medidas usuais de rótulo para pote de 3,5 g; strain e potência onde o olho acha primeiro.'],
  ['Custom Branded Cannabis Jar Guide', 'https://ypcglass.com/custom-branded-cannabis-jar-guide/', 'Divisão de papéis: tampa carrega a marca, corpo carrega strain e informação obrigatória.'],
  ['Mastering Cannabis Packaging Design', 'https://www.whitlam.com/blog/packaging/mastering-cannabis-packaging-design/', 'Minimalismo, fosco e vidro lêem como premium e como precisão clínica.'],
  ['Why Custom Labels and Glass Jars Are the Gold Standard', 'https://biohazardinc.com/blogs/news/why-custom-labels-and-glass-jars-are-the-gold-standard-for-premium-cannabis-brands/', 'Vidro preto UV preserva tricomas; preto fosco com letra clara.'],
  ['Kentucky: How to label raw plant material', 'https://kymedcan.ky.gov/businesses/Documents/2025-02-20%20How%20To-Label-Raw%20Plant%20Material.pdf', 'Conteúdo mínimo de flor medicinal: strain, THC e CBD totais, três terpenos mais presentes, peso, lote, datas.'],
  ['Luxury cannabis jar label (brief de concurso)', 'https://99designs.com/product-packaging-design/contests/luxury-cannabis-jar-label-design-high-end-thai-1297100', 'Rótulo escuro sobre pote preto, um acento só, nada supérfluo.']
];

function page() {
  const o = OIL;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Embalagens Axis</title>
<meta name="description" content="Protótipo de embalagem da Axis FitoMed: Óleo de CBD 30 mL e flor em pote com três strains.">
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
section{padding:48px 0;border-top:1px solid var(--hair)}
.sec-head{display:flex;align-items:baseline;gap:18px;margin-bottom:24px;flex-wrap:wrap}
.sec-head .num{font-family:var(--f-mono);font-size:13px;color:var(--muted)}
h2{font-family:var(--f-display);font-weight:300;font-size:clamp(26px,3vw,40px);line-height:1.1;letter-spacing:-.01em}
h3{font-family:var(--f-display);font-weight:300;font-size:clamp(22px,2.4vw,30px);line-height:1.1}
.sec-head .kind{color:var(--muted);font-size:15px}
.desc{color:var(--muted);max-width:62ch;margin:-8px 0 24px}
.family{--k:min(3.1px,calc((100vw - 48px) / 352));display:flex;justify-content:center;align-items:flex-end;gap:calc(var(--k) * 4);padding:40px 0 16px}
.family figure{display:flex;flex-direction:column;align-items:center;gap:6px}
.family .fam-bottle svg{width:calc(var(--k) * 70);height:calc(var(--k) * 150)}
.family .fam-jar svg{width:calc(var(--k) * 90);height:calc(var(--k) * 134)}
.family figcaption{font-size:14px;text-align:center;line-height:1.3}
.family figcaption span{display:block;color:var(--muted);font-size:12px;font-variant-numeric:tabular-nums}
.hero{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:8px 0 32px;align-items:end}
.hero figure{display:flex;flex-direction:column;align-items:center;gap:14px}
.hero svg{width:100%;max-width:300px;height:auto;display:block}
.hero figcaption{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;font-size:14px;color:var(--muted);max-width:300px;margin:0 auto;width:100%}
.hero figcaption b{font-family:var(--f-display);font-weight:300;font-size:26px;color:var(--text);grid-column:1/-1;line-height:1.1}
.hero figcaption .m{font-family:var(--f-mono);color:var(--text);font-variant-numeric:tabular-nums;font-size:13px;text-align:right}
.plate{background:var(--lift);border:1px solid var(--hair);border-radius:8px;padding:18px;overflow-x:auto}
.plate svg.dieline{display:block;min-width:720px;width:100%;height:auto}
.plate.lidplate{display:flex;justify-content:center}
.plate.lidplate svg.dieline{min-width:0;width:260px}
.two{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;margin-top:24px;align-items:start}
.twoflower{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;margin-top:24px;align-items:start}
.spec{display:grid;grid-template-columns:auto 1fr;gap:0 20px;font-size:14px;border-top:1px solid var(--hair)}
.spec .k,.spec .v{padding:10px 0;border-bottom:1px solid var(--hair)}
.spec .k{color:var(--muted)}
.spec .v{font-variant-numeric:tabular-nums}
.sw{display:inline-block;width:12px;height:12px;border-radius:2px;vertical-align:-1px;margin-right:8px}
.side{background:var(--panel);border:1px solid var(--hair);border-radius:8px;padding:18px;display:flex;flex-direction:column;align-items:center;gap:18px}
.side svg{width:100%;max-width:220px;height:auto}
.strain{padding-top:40px}
.strain+.strain{border-top:1px solid var(--hair);margin-top:40px}
.sys{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 48px}
.sys dl{display:grid;grid-template-columns:auto 1fr;gap:0 20px;font-size:14px;border-top:1px solid var(--hair)}
.sys dt,.sys dd{padding:10px 0;border-bottom:1px solid var(--hair)}
.sys dt{color:var(--muted)}
.refs{list-style:none;display:grid;gap:12px;font-size:14px;max-width:70ch}
.refs a{color:var(--text);text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--muted)}
.refs span{display:block;color:var(--muted)}
footer{padding:32px 0 64px;color:var(--muted);font-size:13px;border-top:1px solid var(--hair)}
svg text{font-variant-numeric:tabular-nums}
a:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
@media (max-width:900px){.two,.twoflower{grid-template-columns:1fr}.side{order:-1}.sys{grid-template-columns:1fr}}
@media (max-width:640px){.hero{grid-template-columns:1fr;gap:40px}.hero svg{max-width:240px}header.top{padding:40px 0 28px}.family figcaption{font-size:11px}.family figcaption span{display:none}}
</style>
</head>
<body>
<div class="wrap">
<header class="top">
  <div class="eyebrow">Axis FitoMed · Embalagens · Protótipo v3 · 08/11/2026</div>
  <h1>Óleo de CBD e flor em pote. Uma marca, dois produtos.</h1>
  <p class="lead">Mesma grade, mesma tipografia, mesmo navy. O óleo é um produto só: um rótulo. A flor vem em pote de vidro preto, e aí a strain é a protagonista: três rótulos de corpo e três de tampa.</p>
</header>

<div class="family" aria-label="Família de produtos em escala real">
  <figure class="fam-bottle">${bottle(o, '-f')}<figcaption>Óleo de CBD<span>30 mL · 20 : 1</span></figcaption></figure>
${FLOWERS.map(f => `  <figure class="fam-jar">${jar(f, '-f')}<figcaption>${f.name}<span>${f.type} · THC ${pct(f.thc)}</span></figcaption></figure>`).join('\n')}
</div>

<section id="oleo">
  <div class="sec-head"><span class="num">01</span><h2>Óleo de CBD</h2><span class="kind">frasco conta-gotas 30 mL</span></div>
  <p class="desc">Rótulo navy de 95 × 45 mm em vidro âmbar, tampa preta fosca. A linha fina é o eixo CBD–THC; o ponto marca a proporção 20 : 1, na ponta do CBD.</p>
  <div class="two">
    <div class="plate">${dieline(oilBody(o), 95, 45, [29.25, 65.75], [[14.6, 'verso · esquerda'], [47.5, 'frente'], [80.4, 'verso · direita']], 'Rótulo planificado do Óleo de CBD, 95 por 45 milímetros')}</div>
    <div class="side">${bottle(o, '-s')}</div>
  </div>
  <div class="two"><div class="spec">${oilSpec(o)}</div><div></div></div>
</section>

<section id="flor">
  <div class="sec-head"><span class="num">02</span><h2>Flor em pote</h2><span class="kind">vidro preto UV · 3,5 g · três strains</span></div>
  <p class="desc">Pote preto com tampa fosca. A tampa leva a marca; o corpo leva a strain em destaque, com THC e CBD lidos de frente. Terpenos, cultivo e laudo ficam no verso. O eixo aqui vai de sativa a indica.</p>

${FLOWERS.map(f => `  <div class="strain" id="${f.id}">
    <div class="sec-head"><span class="num">02.${f.n.slice(1)}</span><h3>${f.name}</h3><span class="kind">${f.type} · THC ${pct(f.thc)} · CBD ${pct(f.cbd)}</span></div>
    <p class="desc">${f.desc}</p>
    <div class="plate">${dieline(flowerBody(f), 150, 50, [50.5, 99.5], [[26, 'verso · esquerda'], [75, 'frente'], [124, 'verso · direita']], `Rótulo de corpo ${f.name}, 150 por 50 milímetros`)}</div>
    <div class="twoflower">
      <div class="spec">${flowerSpec(f)}</div>
      <div class="side">${jar(f, '-s')}${lidDieline(f)}</div>
    </div>
  </div>`).join('\n')}
</section>

<section id="sistema">
  <div class="sec-head"><span class="num">03</span><h2>Sistema</h2></div>
  <div class="sys">
    <dl>
      <dt>Fundo</dt><dd>Navy da marca, ${NAVY}, nos dois produtos, com moldura hairline a 1,5 mm da borda. Papel fosco texturizado ou vinil fosco; sem verniz brilhante.</dd>
      <dt>Texto</dt><dd>Creme ${CREAM} para o essencial, cinza-azulado ${MUTED} para o apoio. Caixa normal, sem caps lock.</dd>
      <dt>Tipografia</dt><dd>Spectral Light só no título: “Óleo de CBD” no frasco, nome da strain no pote. Hanken Grotesk no texto. IBM Plex Mono para dado.</dd>
      <dt>Eixo</dt><dd>Hairline com um ponto. No óleo, de CBD a THC. Na flor, de sativa a indica. Lê-se de longe, sem ler número.</dd>
    </dl>
    <dl>
      <dt>Óleo</dt><dd>Rótulo 95 × 45 mm, frente de 32 mm (115° do cilindro). Acento verde fixo, um produto só.</dd>
      <dt>Flor</dt><dd>Corpo 150 × 50 mm, frente de 44 mm só com nome, eixo e THC/CBD; emenda de 7 mm no verso. Tampa Ø 42 mm com marca, strain e potência. Uma cor de acento por strain.</dd>
      <dt>Verso</dt><dd>QR leva ao CoA do lote. Lote e datas em mono. Flor traz perfil de terpenos, cultivo e cura; óleo traz composição e modo de uso.</dd>
      <dt>Pote</dt><dd>Vidro preto UV Ø 50 mm, tampa preta fosca com fecho de segurança. Referências abaixo.</dd>
    </dl>
  </div>
</section>

<section id="referencias">
  <div class="sec-head"><span class="num">04</span><h2>Referências</h2></div>
  <ul class="refs">
${REFS.map(([t, u, n]) => `    <li><a href="${u}" target="_blank" rel="noopener">${t}</a><span>${n}</span></li>`).join('\n')}
  </ul>
</section>

<footer>Teores, terpenos, datas e lotes são simulados para o protótipo; as strains são cultivares conhecidas. Textos legais e de advertência a validar antes da impressão.</footer>
</div>
</body>
</html>`;
}

// ---------- Escrita ----------
fs.writeFileSync(path.join(OUT, 'rotulo-oleo-cbd.svg'), svgFile(95, 45, 'Axis FitoMed · Óleo de CBD 30 mL · rótulo 95 × 45 mm', oilBody(OIL)));
for (const f of FLOWERS) {
  fs.writeFileSync(path.join(OUT, `flor-${f.id}-corpo.svg`), svgFile(150, 50, `Axis FitoMed · Flor ${f.name} · rótulo de corpo 150 × 50 mm`, flowerBody(f)));
  fs.writeFileSync(path.join(OUT, `flor-${f.id}-tampa.svg`), svgFile(42, 42, `Axis FitoMed · Flor ${f.name} · rótulo de tampa Ø 42 mm`, lidBody(f)));
}
fs.writeFileSync(path.join(OUT, 'index.html'), page());
console.log('ok', OUT);
