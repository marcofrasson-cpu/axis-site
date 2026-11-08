// Portal do associado — protótipo estático. Estado em localStorage/sessionStorage.
(function () {
  const D = window.AXIS_DATA, M = window.AXIS_MOCKUPS || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const g = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' g';
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } }
  };
  const page = document.body.dataset.page;

  // ---- sessão ----
  const logged = () => { try { return sessionStorage.getItem('axisSessao') === '1'; } catch { return false; } };
  if (page === 'login') {
    if (logged()) location.replace('pedido.html');
    $('#login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      try { sessionStorage.setItem('axisSessao', '1'); } catch { }
      location.href = 'pedido.html';
    });
    return;
  }
  if (!logged()) { location.replace('index.html'); return; }
  $$('[data-sair]').forEach(b => b.addEventListener('click', () => { try { sessionStorage.removeItem('axisSessao'); } catch { } location.href = 'index.html'; }));
  $$('[data-member-name]').forEach(e => e.textContent = D.associado.nome);
  $$('[data-member-id]').forEach(e => e.textContent = D.associado.id);

  // ---- toast ----
  let toastT;
  function toast(msg) {
    let t = $('.p-toast'); if (!t) { t = document.createElement('div'); t.className = 'p-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ---- carrinho ----
  const cart = { items: store.get('axisCart', []) };
  const prod = (id) => D.produtos.find(p => p.id === id);
  const size = (p, label) => p.tamanhos.find(t => t.label === label) || p.tamanhos[0];
  function cartTotals() {
    let sub = 0, florG = 0, frascos = 0;
    for (const it of cart.items) { const p = prod(it.id), t = size(p, it.tamanho); sub += t.preco * it.qtd; florG += (t.g || 0) * it.qtd; frascos += (t.frascos || 0) * it.qtd; }
    return { sub, florG, frascos, frete: sub > 0 ? 28 : 0 };
  }
  function saveCart() { store.set('axisCart', cart.items); renderCart(); renderRx(); }
  function addToCart(id, tamanho) {
    const p = prod(id); if (!p || p.estoque === 0) return;
    const key = cart.items.find(i => i.id === id && i.tamanho === tamanho);
    const have = cart.items.filter(i => i.id === id).reduce((a, i) => a + i.qtd, 0);
    if (have + 1 > p.estoque) { toast(`Só há ${p.estoque} em estoque de ${p.nome}.`); return; }
    if (key) key.qtd += 1; else cart.items.push({ id, tamanho, qtd: 1 });
    saveCart(); toast(`${p.nome} · ${tamanho} adicionado`);
  }
  function changeQty(idx, d) {
    const it = cart.items[idx]; if (!it) return;
    const p = prod(it.id);
    const have = cart.items.filter(i => i.id === it.id).reduce((a, i) => a + i.qtd, 0);
    if (d > 0 && have + 1 > p.estoque) { toast(`Só há ${p.estoque} em estoque de ${p.nome}.`); return; }
    it.qtd += d; if (it.qtd <= 0) cart.items.splice(idx, 1); saveCart();
  }

  // ---- receita ----
  function rxRemaining() {
    const t = cartTotals();
    return {
      florLimit: D.receita.limites.flor_g, florUsed: D.receita.usado.flor_g, florCart: t.florG,
      oleoLimit: D.receita.limites.oleo_frascos, oleoUsed: D.receita.usado.oleo_frascos, oleoCart: t.frascos
    };
  }
  function renderRx() {
    const el = $('#rx'); if (!el) return;
    const r = rxRemaining();
    const flRaw = (r.florUsed + r.florCart) / r.florLimit * 100, olRaw = (r.oleoUsed + r.oleoCart) / r.oleoLimit * 100;
    const fl = Math.min(100, flRaw), ol = Math.min(100, olRaw);
    const over = flRaw > 100 || olRaw > 100;
    el.innerHTML = `
      <div>
        <div class="p-rx-k">Receita ativa</div>
        <div class="p-rx-v">${D.receita.medico} <small>· ${D.receita.crm}</small></div>
        <div class="p-rx-k" style="margin-top:6px">Emitida em ${D.receita.emitida} · válida até <b class="num" style="color:var(--text-primary);font-weight:500">${D.receita.validade}</b></div>
        <div class="p-rx-ok"><i></i>Dispensação liberada conforme receita</div>
      </div>
      <div>
        <div class="p-rx-k">Flor neste mês</div>
        <div class="p-rx-v num">${g(r.florUsed)}${r.florCart ? ` <small>+ ${g(r.florCart)} no pedido</small>` : ''}</div>
        <div class="p-meter"><b class="${flRaw > 100 ? 'warn' : ''}" style="width:${fl}%"></b></div>
        <div class="p-meter-l"><span>limite ${g(r.florLimit)}</span><span class="num">${g(Math.max(0, r.florLimit - r.florUsed - r.florCart))} disponíveis</span></div>
      </div>
      <div>
        <div class="p-rx-k">Óleo neste mês</div>
        <div class="p-rx-v num">${r.oleoUsed} frasco${r.oleoUsed === 1 ? '' : 's'}${r.oleoCart ? ` <small>+ ${r.oleoCart} no pedido</small>` : ''}</div>
        <div class="p-meter"><b class="${olRaw > 100 ? 'warn' : ''}" style="width:${ol}%"></b></div>
        <div class="p-meter-l"><span>limite ${r.oleoLimit} frascos</span><span class="num">${Math.max(0, r.oleoLimit - r.oleoUsed - r.oleoCart)} disponível${(r.oleoLimit - r.oleoUsed - r.oleoCart) === 1 ? '' : 'is'}</span></div>
      </div>`;
    el.dataset.over = over ? '1' : '';
  }

  // ---- arte do card: rótulo em full bleed sobre contornos topográficos na cor do produto ----
  const ART_W = 600, ART_H = 400;
  const MARK = '<g transform="translate(%X,%Y) scale(%S) translate(-20.2,-46)" fill="none" stroke-linejoin="miter" stroke-width="5.5"><polygon points="60,46 99.8,68 99.8,112 60,134 20.2,112 20.2,68" stroke="#3a4a52"/><polygon points="99.8,68 139.6,46 179.4,68 179.4,112 139.6,134 99.8,112" stroke="#5fc89b"/><path d="M 126.6 116 L 139.6 58 L 152.6 116 M 131.1 95 L 148.1 95" stroke="#5fc89b"/><circle cx="99.8" cy="68" r="6.5" fill="#5fc89b" stroke="none"/><circle cx="99.8" cy="112" r="6.5" fill="#5fc89b" stroke="none"/></g>';
  const ACCENT = { oleo: '#5fc89b', harlequin: '#5fc89b', acdc: '#5fc89b', 'blue-dream': '#e8a13c', 'wedding-cake': '#e8a13c', 'northern-lights': '#c6d2df' };
  function rng(seed) { let t = 0; for (const c of seed) t = (t * 31 + c.charCodeAt(0)) >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  function contours(p) {
    const R = rng(p.id), accent = ACCENT[p.id] || '#5fc89b';
    const lean = p.eixo[2];
    const cx = ART_W * (0.22 + 0.56 * lean), cy = 150 + R() * 40;
    const waves = Array.from({ length: 4 }, (_, i) => ({ m: 2 + i + Math.floor(R() * 2), a: (0.14 - i * 0.025) * (0.8 + R() * 0.4), ph: R() * Math.PI * 2 }));
    const drift = Array.from({ length: 3 }, () => ({ m: 1 + Math.floor(R() * 3), a: 0.05 + R() * 0.04, ph: R() * Math.PI * 2 }));
    const N = 16, steps = 120;
    let out = '';
    for (let k = 0; k < N; k++) {
      const base = 26 + k * 30;
      let d = '';
      for (let i = 0; i <= steps; i++) {
        const th = (i / steps) * Math.PI * 2;
        let n = 0; for (const w of waves) n += w.a * Math.sin(w.m * th + w.ph);
        let m = 0; for (const w of drift) m += w.a * Math.sin(w.m * th + w.ph + k * 0.35);
        const r = base * (1 + n + m * (k / N));
        const x = cx + r * Math.cos(th) * 1.25, y = cy + r * Math.sin(th);
        d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }
      const op = (0.36 - k * 0.018).toFixed(3);
      out += `<path d="${d}Z" fill="none" stroke="${accent}" stroke-opacity="${op}" stroke-width="1.25" stroke-linejoin="round"/>`;
    }
    return out;
  }
  const svgEsc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function artSVG(p) {
    const accent = ACCENT[p.id] || '#5fc89b';
    const size = p.tamanhos[0].label;
    const nameSize = Math.min(96, Math.floor(520 / (p.nome.length * 0.5)));
    const line = p.dados.slice(0, 2).map(([k, v]) => `<tspan fill="#a2b0c2">${k} </tspan><tspan fill="#f4f2ec">${svgEsc(v)}</tspan>`).join('<tspan fill="#a2b0c2">  ·  </tspan>');
    return `<svg class="p-art" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ART_W} ${ART_H}" role="img" aria-label="${svgEsc(p.nome)}">
      <rect width="${ART_W}" height="${ART_H}" fill="#0d1b2a"/>
      <g clip-path="inset(0)">${contours(p)}</g>
      <rect x="14" y="14" width="${ART_W - 28}" height="${ART_H - 28}" rx="4" fill="none" stroke="#f4f2ec" stroke-opacity="0.22" stroke-width="1"/>
      ${MARK.replace('%X', 34).replace('%Y', 31).replace('%S', (30 / 88).toFixed(4))}
      <text x="96" y="54" font-family="var(--font-body)" font-size="20" font-weight="500" fill="#f4f2ec">Axis FitoMed</text>
      <text x="${ART_W - 34}" y="54" font-family="var(--font-mono)" font-size="18" fill="#a2b0c2" text-anchor="end">${svgEsc(size)}</text>
      <text x="32" y="${ART_H - 104}" font-family="var(--font-display)" font-weight="300" font-size="${nameSize}" letter-spacing="-0.025em" fill="${accent}">${svgEsc(p.nome)}</text>
      <text x="34" y="${ART_H - 50}" font-family="var(--font-mono)" font-size="25" style="font-variant-numeric:tabular-nums">${line}</text>
    </svg>`;
  }

  // ---- catálogo ----
  const state = { filtro: 'todos', busca: '', ordem: 'relevancia', tam: {} };
  function stockBadge(p) {
    if (p.estoque === 0) return `<span class="p-badge out">Esgotado</span>`;
    if (p.estoque <= 5) return `<span class="p-badge low">Últimas ${p.estoque}</span>`;
    return '';
  }
  function cardHTML(p) {
    const t = size(p, state.tam[p.id]);
    const sizes = p.tamanhos.length > 1 ? `<div class="p-sizes" role="group" aria-label="Tamanho">${p.tamanhos.map(x => `<button class="p-size" aria-pressed="${x.label === t.label}" data-size="${x.label}">${x.label}</button>`).join('')}</div>` : '';
    const stock = p.estoque === 0 ? `<div class="p-stock out">Esgotado${p.previsao ? ` · previsão ${p.previsao}` : ''}</div>` : `<div class="p-stock ${p.estoque <= 5 ? 'low' : ''}">${p.estoque} em estoque · lote ${p.lote}</div>`;
    const cta = p.estoque === 0 ? `<button class="btn btn-ghost btn-sm" data-avisar>Avise-me</button>` : `<button class="btn btn-ghost btn-sm" data-add>Adicionar</button>`;
    return `<article class="p-card ${p.estoque === 0 ? 'out' : ''}" data-id="${p.id}">
      <div class="p-media" data-open role="button" tabindex="0" aria-label="Ver detalhes de ${p.nome}">${artSVG(p)}${stockBadge(p)}</div>
      <div class="p-body">
        <div class="p-eyebrow">${p.sub}</div>
        <h3 class="p-name"><button data-open>${p.nome}</button></h3>
        ${sizes}
        ${stock}
        <div class="p-foot"><div class="p-price num">${brl(t.preco)}<small>/ ${t.label}</small></div>${cta}</div>
      </div>
    </article>`;
  }
  function filtered() {
    let list = D.produtos.filter(p => state.filtro === 'todos' || p.tipo === state.filtro);
    if (state.busca) { const q = state.busca.toLowerCase(); list = list.filter(p => (p.nome + ' ' + p.sub + ' ' + p.dados.map(d => d.join(' ')).join(' ')).toLowerCase().includes(q)); }
    if (state.ordem === 'preco') list = [...list].sort((a, b) => a.tamanhos[0].preco - b.tamanhos[0].preco);
    if (state.ordem === 'thc') list = [...list].sort((a, b) => parseFloat(b.dados[0][1].replace(',', '.')) - parseFloat(a.dados[0][1].replace(',', '.')));
    if (state.ordem === 'cbd') list = [...list].sort((a, b) => parseFloat((b.dados[1] || b.dados[0])[1].replace(',', '.')) - parseFloat((a.dados[1] || a.dados[0])[1].replace(',', '.')));
    return list;
  }
  function renderCatalog() {
    const grid = $('#grid'); if (!grid) return;
    const list = filtered();
    grid.innerHTML = list.length ? list.map(cardHTML).join('') : `<p class="p-empty" style="grid-column:1/-1">Nenhum produto com esse filtro.</p>`;
    $$('.p-chip[data-filtro]').forEach(c => c.setAttribute('aria-pressed', c.dataset.filtro === state.filtro));
    $('#n-todos').textContent = D.produtos.length;
    $('#n-flor').textContent = D.produtos.filter(p => p.tipo === 'flor').length;
    $('#n-oleo').textContent = D.produtos.filter(p => p.tipo === 'oleo').length;
  }
  function renderCart() {
    const el = $('#cart'); if (!el) return;
    const t = cartTotals(), r = rxRemaining();
    const overFlor = r.florUsed + r.florCart > r.florLimit, overOleo = r.oleoUsed + r.oleoCart > r.oleoLimit;
    const n = cart.items.reduce((a, i) => a + i.qtd, 0);
    const items = cart.items.map((it, i) => { const p = prod(it.id), s = size(p, it.tamanho); return `<div class="p-item">
        <div><div class="n">${p.nome}</div><div class="s">${s.label} · ${brl(s.preco)} cada</div></div>
        <div class="t num">${brl(s.preco * it.qtd)}</div>
        <div class="s">lote ${p.lote}</div>
        <div class="p-qty"><button data-q="${i}:-1" aria-label="menos">−</button><span class="num">${it.qtd}</span><button data-q="${i}:1" aria-label="mais">+</button></div>
      </div>`; }).join('');
    el.innerHTML = `
      <h2>Seu pedido${n ? `<span>${n} ${n === 1 ? 'item' : 'itens'}</span>` : ''}</h2>
      ${n ? `<div class="p-items">${items}</div>` : `<p class="p-empty">Escolha os produtos ao lado para montar o pedido.</p>`}
      ${overFlor ? `<div class="p-alert">Flor acima do limite mensal da receita (${g(r.florLimit)}). Reduza a quantidade para gerar o pedido.</div>` : ''}
      ${overOleo ? `<div class="p-alert">Óleo acima do limite mensal da receita (${r.oleoLimit} frascos). Reduza a quantidade para gerar o pedido.</div>` : ''}
      <div class="p-totals">
        <span>Subtotal</span><span class="num">${brl(t.sub)}</span>
        <span>Frete (Jadlog, SC)</span><span class="num">${brl(t.frete)}</span>
        <span class="big">Total</span><span class="big num">${brl(t.sub + t.frete)}</span>
      </div>
      <button class="btn btn-primary btn-block" id="gerar" ${(!n || overFlor || overOleo) ? 'disabled' : ''}>Gerar pedido</button>
      <div class="p-note"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><span>Estoque reservado por 24 h ao gerar o pedido. Pagamento por Pix; o pedido entra na separação após a confirmação.</span></div>
      <div class="p-rules">
        <div><b>Entrega</b> · separação em 1 a 2 dias úteis após o pagamento; envio por Jadlog com código de rastreio no Histórico.</div>
        <div><b>Receita</b> · cada pedido é conferido com a receita ativa. Quantidades acima do limite mensal não são liberadas.</div>
      </div>`;
    const btn = $('#gerar'); if (btn) btn.addEventListener('click', checkout);
    $$('[data-q]', el).forEach(b => b.addEventListener('click', () => { const [i, d] = b.dataset.q.split(':').map(Number); changeQty(i, d); }));
  }
  function checkout() {
    const t = cartTotals();
    const pedidos = store.get('axisPedidos', []);
    const num = 'AX-' + String(250 + pedidos.length).padStart(4, '0');
    const hoje = new Date().toLocaleDateString('pt-BR');
    pedidos.unshift({ num, data: hoje, status: 0, rastreio: null, itens: cart.items.map(it => { const p = prod(it.id), s = size(p, it.tamanho); return [`${p.nome} · ${s.label}`, it.qtd, s.preco * it.qtd]; }), total: t.sub + t.frete });
    store.set('axisPedidos', pedidos);
    cart.items = []; store.set('axisCart', []);
    location.href = `historico.html?novo=${num}`;
  }

  // ---- detalhe ----
  function openDetail(id) {
    const p = prod(id); if (!p) return;
    const dlg = $('#detail'); if (!dlg) return;
    const t = size(p, state.tam[p.id]);
    const kv = [...p.dados, ['Lote', p.lote], p.colheita ? ['Colheita', p.colheita] : ['Fabricação', p.fab], ['Validade', p.val]];
    if (p.terpenos) kv.push(['Terpenos dominantes', p.terpenos.map(x => `${x[0]} ${x[1]}`).join(' · ')]);
    dlg.innerHTML = `
      <button class="p-close" data-close aria-label="Fechar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="p-detail-grid">
        <div class="p-detail-media">${M[p.id] || ''}</div>
        <div class="p-detail-body">
          <div><div class="p-eyebrow">${p.sub}</div><h2>${p.nome}</h2></div>
          <div class="p-axis" aria-label="Eixo ${p.eixo[0]} a ${p.eixo[1]}"><i style="left:${p.eixo[2] * 100}%"></i><span>${p.eixo[0]}</span><span>${p.eixo[1]}</span></div>
          <p style="color:var(--text-muted);font-size:var(--fs-14);line-height:1.55">${p.texto}</p>
          <div class="p-kv">${kv.map(([k, v]) => `<div class="k">${k}</div><div class="num">${v}</div>`).join('')}</div>
          <a class="p-link" href="https://axisfitomed.com.br/laudo/${p.lote}" target="_blank" rel="noopener">Ver laudo (CoA) do lote ${p.lote}</a>
          <div class="p-cta">
            ${p.tamanhos.length > 1 ? `<div class="p-sizes">${p.tamanhos.map(x => `<button class="p-size" aria-pressed="${x.label === t.label}" data-dsize="${x.label}">${x.label} · ${brl(x.preco)}</button>`).join('')}</div>` : `<span class="p-price num">${brl(t.preco)}<small>/ ${t.label}</small></span>`}
            ${p.estoque === 0 ? `<button class="btn btn-ghost" data-avisar>Avisar quando voltar</button>` : `<button class="btn btn-primary" data-dadd>Adicionar ao pedido</button>`}
          </div>
        </div>
      </div>`;
    $$('[data-dsize]', dlg).forEach(b => b.addEventListener('click', () => { state.tam[p.id] = b.dataset.dsize; openDetail(id); renderCatalog(); }));
    const add = $('[data-dadd]', dlg); if (add) add.addEventListener('click', () => { addToCart(p.id, size(p, state.tam[p.id]).label); dlg.close(); });
    const av = $('[data-avisar]', dlg); if (av) av.addEventListener('click', () => { toast(`Avisaremos quando ${p.nome} voltar ao estoque.`); dlg.close(); });
    $('[data-close]', dlg).addEventListener('click', () => dlg.close());
    if (!dlg.open) dlg.showModal();
  }

  if (page === 'pedido') {
    renderRx(); renderCatalog(); renderCart();
    $('#grid').addEventListener('click', (e) => {
      const card = e.target.closest('.p-card'); if (!card) return; const id = card.dataset.id;
      if (e.target.closest('[data-size]')) { state.tam[id] = e.target.closest('[data-size]').dataset.size; renderCatalog(); return; }
      if (e.target.closest('[data-add]')) { addToCart(id, size(prod(id), state.tam[id]).label); return; }
      if (e.target.closest('[data-avisar]')) { toast(`Avisaremos quando ${prod(id).nome} voltar ao estoque.`); return; }
      if (e.target.closest('[data-open]')) openDetail(id);
    });
    $('#grid').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.p-media')) openDetail(e.target.closest('.p-card').dataset.id); });
    $$('.p-chip[data-filtro]').forEach(c => c.addEventListener('click', () => { state.filtro = c.dataset.filtro; renderCatalog(); }));
    const busca = $('#busca'); if (busca) busca.addEventListener('input', () => { state.busca = busca.value.trim(); renderCatalog(); });
    const ordem = $('#ordem'); if (ordem) ordem.addEventListener('change', () => { state.ordem = ordem.value; renderCatalog(); });
    $('#detail').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  }

  // ---- histórico ----
  if (page === 'historico') {
    const novo = new URLSearchParams(location.search).get('novo');
    const todos = [...store.get('axisPedidos', []), ...D.pedidos];
    const el = $('#orders');
    el.innerHTML = todos.map(o => `<article class="p-order" ${o.num === novo ? 'style="border-color:rgba(95,200,155,.5)"' : ''}>
      <div>
        <div class="p-order-head"><b>Pedido ${o.num}</b><span>${o.data}</span></div>
        <div class="p-order-items">${o.itens.map(([n, q, v]) => `<div><span>${q}× ${n}</span><span class="num">${brl(v)}</span></div>`).join('')}<div class="tot"><span>Total com frete</span><span class="num">${brl(o.total)}</span></div></div>
      </div>
      <div>
        <div class="p-steps">${D.statusLabels.map((s, i) => `<div class="p-step ${i <= o.status ? 'done' : ''} ${i === o.status ? 'now' : ''}">${s}</div>`).join('')}</div>
        <div class="p-track">${o.rastreio ? `Rastreio <span class="mono">${o.rastreio}</span> · <a href="https://melhorrastreio.com.br/" target="_blank" rel="noopener">acompanhar</a>` : (o.status === 0 ? 'Aguardando confirmação do Pix. Estoque reservado por 24 h.' : 'Em separação. O código de rastreio aparece aqui no envio.')}</div>
      </div>
    </article>`).join('');
    if (novo) toast(`Pedido ${novo} gerado. Pix enviado ao seu e-mail.`);
  }

  // ---- perfil ----
  if (page === 'perfil') {
    const a = D.associado, r = D.receita;
    $('#perfil-dados').innerHTML = [['Nome', a.nome], ['Associado', a.id + ' · desde ' + a.desde], ['E-mail', a.email], ['Telefone', a.telefone], ['Endereço de entrega', a.endereco]].map(([k, v]) => `<div class="k">${k}</div><div>${v}</div>`).join('');
    $('#perfil-rx').innerHTML = [['Prescritor', `${r.medico} · ${r.crm}`], ['Emitida', r.emitida], ['Válida até', r.validade], ['Limite mensal', `${g(r.limites.flor_g)} de flor · ${r.limites.oleo_frascos} frascos de óleo`], ...r.posologia].map(([k, v]) => `<div class="k">${k}</div><div class="num">${v}</div>`).join('');
  }
})();
