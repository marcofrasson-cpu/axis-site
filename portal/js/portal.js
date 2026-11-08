// Portal do associado — V2. Estático; estado em localStorage/sessionStorage. Pedido e pagamento são simulação.
(function () {
  const D = window.AXIS_DATA, M = window.AXIS_MOCKUPS || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const brl = (c) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const g = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' g';
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } }
  };
  const page = document.body.dataset.page;
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/js\/portal\.js.*$/, '');
  const ICON = {
    bag: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l1 13H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    lock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    warn: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
    x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  // ---- sessão ----
  const logged = () => { try { return sessionStorage.getItem('axisSessao') === '1'; } catch { return false; } };
  if (page === 'login') {
    if (logged()) location.replace(BASE + 'pedido.html');
    $('#login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      try { sessionStorage.setItem('axisSessao', '1'); } catch { }
      location.href = BASE + 'pedido.html';
    });
    return;
  }
  if (!logged()) { location.replace(BASE + 'index.html'); return; }
  $$('[data-sair]').forEach(b => b.addEventListener('click', () => { try { sessionStorage.removeItem('axisSessao'); } catch { } location.href = BASE + 'index.html'; }));
  $$('[data-member-name]').forEach(e => e.textContent = D.associado.nome);
  $$('[data-member-id]').forEach(e => e.textContent = D.associado.id);
  $$('[data-member-initials]').forEach(e => e.textContent = D.associado.nome.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join(''));

  // ---- toast ----
  let toastT;
  function toast(msg, action) {
    let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
    if (action) $('button', t).addEventListener('click', () => { t.classList.remove('show'); action.fn(); });
    t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), action ? 3200 : 2200);
  }

  // ---- receita: validade ----
  const parseBR = (s) => { const [d, m, y] = s.split('/').map(Number); return new Date(y, m - 1, d); };
  const rxValida = parseBR(D.receita.validade) >= new Date(new Date().toDateString());

  // ---- carrinho ----
  const cart = { items: store.get('axisCart', []) };
  const prod = (id) => D.produtos.find(p => p.id === id);
  const size = (p, label) => p.tamanhos.find(t => t.label === label) || p.tamanhos[0];
  const unitsOf = (id) => cart.items.filter(i => i.id === id).reduce((a, i) => a + size(prod(i.id), i.tamanho).units * i.qtd, 0);
  function totals() {
    let sub = 0, florG = 0, frascos = 0, n = 0;
    for (const it of cart.items) { const p = prod(it.id), t = size(p, it.tamanho); sub += t.preco * it.qtd; florG += (t.g || 0) * it.qtd; frascos += (t.frascos || 0) * it.qtd; n += it.qtd; }
    florG = Math.round(florG * 10) / 10;
    return { sub, florG, frascos, n };
  }
  function rx() {
    const t = totals(), L = D.receita.limites, U = D.receita.usado;
    return {
      t,
      flor: { limit: L.flor_g, used: U.flor_g, cart: t.florG, free: Math.round((L.flor_g - U.flor_g) * 10) / 10, after: Math.round((L.flor_g - U.flor_g - t.florG) * 10) / 10 },
      oleo: { limit: L.oleo_frascos, used: U.oleo_frascos, cart: t.frascos, free: L.oleo_frascos - U.oleo_frascos, after: L.oleo_frascos - U.oleo_frascos - t.frascos }
    };
  }
  // Pode adicionar? Devolve null se sim, ou a razão.
  function canAdd(p, t, qtd = 1) {
    if (!rxValida) return 'Receita vencida. Envie uma nova receita para pedir.';
    if (p.estoque === 0) return `${p.nome} está esgotado.`;
    const have = unitsOf(p.id), need = t.units * qtd;
    if (have + need > p.estoque) return `Estoque de ${p.nome}: só ${p.estoque - have} × ${p.tamanhos[0].label} disponível${p.estoque - have === 1 ? '' : 'is'}.`;
    const r = rx();
    if (t.g && r.flor.after - t.g * qtd < -0.001) return `Passa do limite mensal de flor da sua receita (${g(r.flor.limit)}). Saldo disponível: ${g(Math.max(0, r.flor.after))}.`;
    if (t.frascos && r.oleo.after - t.frascos * qtd < 0) return `Passa do limite mensal de óleo da sua receita (${r.oleo.limit} frascos). Saldo disponível: ${Math.max(0, r.oleo.after)}.`;
    return null;
  }
  function save() { store.set('axisCart', cart.items); renderCart(); renderRx(); renderCatalog(); }
  function add(id, tamanho, btn) {
    const p = prod(id), t = size(p, tamanho);
    const why = canAdd(p, t); if (why) { toast(why); return false; }
    const key = cart.items.find(i => i.id === id && i.tamanho === t.label);
    if (key) key.qtd += 1; else cart.items.push({ id, tamanho: t.label, qtd: 1 });
    save();
    if (btn) { const old = btn.textContent; btn.classList.add('done'); btn.textContent = 'Adicionado'; setTimeout(() => { btn.classList.remove('done'); btn.textContent = old; }, 1200); }
    const compact = window.matchMedia('(max-width: 1099px)').matches;
    toast(`${p.nome} · ${t.label} no pedido`, compact ? { label: 'Ver pedido', fn: openDrawer } : null);
    return true;
  }
  function changeQty(idx, d) {
    const it = cart.items[idx]; if (!it) return;
    const p = prod(it.id), t = size(p, it.tamanho);
    if (d > 0) { const why = canAdd(p, t); if (why) { toast(why); return; } }
    it.qtd += d; if (it.qtd <= 0) cart.items.splice(idx, 1); save();
  }
  function removeItem(idx) { cart.items.splice(idx, 1); save(); }

  // ---- receita (bloco) ----
  function meter(r, fmt, unit) {
    const over = r.after < -0.0001;
    const pct = (v) => Math.max(0, Math.min(100, v / r.limit * 100));
    const usedW = pct(r.used), cartW = pct(r.used + r.cart);
    return `
      <div class="rx-big"><b class="num">${fmt(Math.max(0, r.after))}</b><span>${over ? 'saldo previsto negativo' : r.cart ? 'saldo previsto após o pedido' : 'disponíveis este mês'}</span></div>
      <div class="bar" role="img" aria-label="${fmt(r.used)} usados, ${fmt(r.cart)} no pedido, limite ${fmt(r.limit)}">
        <span class="${over ? 'over' : 'incart'}" style="width:${cartW}%"></span><span class="used" style="width:${usedW}%"></span>
      </div>
      <div class="legend">
        <span><i></i>Usado <b class="num">${fmt(r.used)}</b></span>
        ${r.cart ? `<span><i class="${over ? 'over' : 'incart'}"></i>No pedido <b class="num">${fmt(r.cart)}</b></span>` : ''}
        <span><i class="free"></i>Limite <b class="num">${fmt(r.limit)}</b>${unit ? ' ' + unit : ''}</span>
      </div>
      ${over ? `<div class="rx-forecast over">Excede o limite em <b class="num">${fmt(-r.after)}</b>. Reduza o pedido.</div>` : ''}`;
  }
  function renderRx() {
    const el = $('#rx'); if (!el) return;
    const r = rx();
    el.innerHTML = `
      <div>
        <div class="rx-k">Receita ativa</div>
        <div class="rx-doc">${esc(D.receita.medico)} <small>· ${esc(D.receita.crm)}</small></div>
        <div class="rx-dates">Emitida em <b class="num">${D.receita.emitida}</b> · válida até <b class="num">${D.receita.validade}</b></div>
        <div class="rx-status ${rxValida ? '' : 'bad'}"><i></i>${rxValida ? 'Dispensação liberada conforme receita' : 'Receita vencida: envie uma nova'}</div>
      </div>
      <div><div class="rx-k">Flor · limite mensal</div>${meter(r.flor, g, '')}</div>
      <div><div class="rx-k">Óleo · limite mensal</div>${meter(r.oleo, (v) => `${v} ${Math.abs(v) === 1 ? 'frasco' : 'frascos'}`, '')}</div>`;
  }

  // ---- imagem do card: close do produto (pote ou frasco) com o rótulo enrolado ----
  const CROP = { oleo: '-5 4 80 100' }; // frasco inteiro menos o rodapé do rótulo (y 5..105)
  const JAR_CROP = '5 4 80 100';         // pote inteiro, tampa a base (y 10..103)
  function closeup(p) {
    const svg = M[p.id]; if (!svg) return '';
    return svg.replace(/viewBox="[^"]+"/, `viewBox="${CROP[p.id] || JAR_CROP}" preserveAspectRatio="xMidYMid slice"`).replace(/ class="(bottle|jar)"/, ' class="shot"').replace(/role="img" aria-label="[^"]*"/, 'aria-hidden="true" focusable="false"');
  }

  // ---- catálogo ----
  const ui = { filtro: 'todos', busca: '', ordem: 'relevancia', tam: {} };
  function stockInfo(p) {
    const left = p.estoque - unitsOf(p.id);
    if (p.estoque === 0) return { cls: 'out', text: `Esgotado${p.previsao ? ` · previsão ${p.previsao}` : ''}`, badge: `<span class="badge out">Esgotado</span>` };
    if (left <= 0) return { cls: 'low', text: 'Tudo o que há está no seu pedido', badge: '' };
    if (p.estoque <= 5) return { cls: 'low', text: `Últimas ${p.estoque} unidades · lote ${p.lote}`, badge: `<span class="badge low">Últimas ${p.estoque}</span>` };
    return { cls: '', text: `${p.estoque} em estoque · lote ${p.lote}`, badge: '' };
  }
  function cardHTML(p) {
    const t = size(p, ui.tam[p.id]), st = stockInfo(p);
    const variants = p.tamanhos.length > 1 ? `<div class="variants" role="group" aria-label="Apresentação de ${esc(p.nome)}">${p.tamanhos.map(x => {
      const dis = p.estoque > 0 && unitsOf(p.id) + x.units > p.estoque;
      return `<button type="button" class="variant" aria-pressed="${x.label === t.label}" data-size="${esc(x.label)}" ${dis ? 'disabled title="Sem estoque para esta apresentação"' : ''}>${esc(x.label)}<span class="m num">${brl(x.preco)}</span></button>`;
    }).join('')}</div>` : `<div class="variants"><span class="variant" aria-pressed="true" tabindex="-1">${esc(t.label)}</span></div>`;
    const cta = p.estoque === 0
      ? `<button type="button" class="btn btn-ghost btn-sm" data-avisar>Avise-me</button>`
      : `<button type="button" class="btn btn-add btn-sm" data-add aria-label="Adicionar ${esc(p.nome)} ${esc(t.label)} ao pedido">Adicionar</button>`;
    return `<article class="card ${p.estoque === 0 ? 'out' : ''}" data-id="${p.id}">
      <button type="button" class="media" data-open aria-label="Ver detalhes de ${esc(p.nome)}">${closeup(p)}${st.badge}</button>
      <div class="body">
        <div class="cat">${esc(p.sub)}</div>
        ${variants}
        <div class="stock ${st.cls}"><i aria-hidden="true"></i>${st.text}</div>
        <div class="buy"><div class="price"><b class="num">${brl(t.preco)}</b><small>por ${esc(t.label)}</small></div>${cta}</div>
      </div>
    </article>`;
  }
  const num = (s) => parseFloat(String(s).replace(',', '.'));
  function filtered() {
    let list = D.produtos.filter(p => ui.filtro === 'todos' || p.tipo === ui.filtro);
    if (ui.busca) { const q = ui.busca.toLowerCase(); list = list.filter(p => (p.nome + ' ' + p.sub + ' ' + p.dados.map(d => d.join(' ')).join(' ') + ' ' + (p.terpenos || []).map(t => t[0]).join(' ')).toLowerCase().includes(q)); }
    const by = { nome: (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'), preco: (a, b) => a.tamanhos[0].preco - b.tamanhos[0].preco, thc: (a, b) => num(b.dados[0][1]) - num(a.dados[0][1]), cbd: (a, b) => num((b.dados[1] || b.dados[0])[1]) - num((a.dados[1] || a.dados[0])[1]) };
    if (by[ui.ordem]) list = [...list].sort(by[ui.ordem]);
    return list;
  }
  function renderCatalog() {
    const grid = $('#grid'); if (!grid) return;
    const list = filtered();
    grid.innerHTML = list.length ? list.map(cardHTML).join('') : `<div class="p-empty-search"><strong style="color:var(--text)">Nada encontrado${ui.busca ? ` para “${esc(ui.busca)}”` : ''}.</strong><span>Tente outro nome, canabinoide ou terpeno, ou limpe os filtros.</span><button type="button" class="btn btn-ghost btn-sm" data-clear>Limpar filtros</button></div>`;
    $$('.chip[data-filtro]').forEach(c => c.setAttribute('aria-pressed', c.dataset.filtro === ui.filtro));
    $('#n-todos').textContent = D.produtos.length;
    $('#n-flor').textContent = D.produtos.filter(p => p.tipo === 'flor').length;
    $('#n-oleo').textContent = D.produtos.filter(p => p.tipo === 'oleo').length;
    $('#count').textContent = `${list.length} ${list.length === 1 ? 'produto' : 'produtos'}`;
    const s = $('.p-search'); if (s) s.classList.toggle('has', !!ui.busca);
  }

  // ---- carrinho (render em sidebar e drawer) ----
  function cartHTML() {
    const r = rx(), t = r.t;
    const overFlor = r.flor.after < -0.0001, overOleo = r.oleo.after < 0;
    const items = cart.items.map((it, i) => { const p = prod(it.id), s = size(p, it.tamanho), more = canAdd(p, s); return `<div class="item">
        <div class="name">${esc(p.nome)}</div>
        <div class="total num">${brl(s.preco * it.qtd)}</div>
        <div class="meta"><span class="num">${esc(s.label)} · ${brl(s.preco)} cada</span><button type="button" class="rm" data-rm="${i}">remover</button></div>
        <div class="qty" aria-label="Quantidade de ${esc(p.nome)} ${esc(s.label)}"><button type="button" data-q="${i}:-1" aria-label="Diminuir">−</button><span class="num" aria-live="polite">${it.qtd}</span><button type="button" data-q="${i}:1" aria-label="Aumentar" ${more ? `disabled title="${esc(more)}"` : ''}>+</button></div>
      </div>`; }).join('');
    let why = '';
    if (!rxValida) why = 'Receita vencida: envie uma nova para gerar pedido.';
    else if (!t.n) why = 'Adicione ao menos um produto.';
    else if (overFlor || overOleo) why = 'Ajuste as quantidades para caber no limite da receita.';
    return `
      <h2>Seu pedido <span>${t.n ? `${t.n} ${t.n === 1 ? 'item' : 'itens'}` : 'vazio'}</span></h2>
      ${t.n ? `<div class="items">${items}</div>` : `<div class="cart-empty">${ICON.bag}<span>Nenhum produto ainda. Escolha no catálogo; o limite da receita é conferido na hora.</span></div>`}
      ${overFlor ? `<div class="alert">${ICON.warn}<span>Flor acima do limite mensal (${g(r.flor.limit)}) em <b class="num">${g(-r.flor.after)}</b>.</span></div>` : ''}
      ${overOleo ? `<div class="alert">${ICON.warn}<span>Óleo acima do limite mensal (${r.oleo.limit} frascos) em <b class="num">${-r.oleo.after}</b>.</span></div>` : ''}
      <div class="totals">
        <span>Subtotal</span><span class="num">${brl(t.sub)}</span>
        <span>Frete</span><span class="tbd">${t.n ? 'a calcular no endereço' : '—'}</span>
        <span class="big">Total</span><span class="big num" data-total>${brl(t.sub)}</span>
        <span class="cta-why" style="grid-column:1/-1;text-align:left">${t.n ? 'Frete e prazo aparecem antes da confirmação.' : ''}</span>
      </div>
      <button type="button" class="btn btn-primary btn-block" data-gerar ${why ? 'disabled aria-describedby="why"' : ''}>Gerar pedido</button>
      ${why ? `<div class="cta-why" id="why">${esc(why)}</div>` : `<div class="cart-note">${ICON.lock}<span>Estoque reservado por 24 h ao gerar o pedido. Pagamento por Pix; separação após a confirmação.</span></div>`}
      ${t.n ? `<div class="mini-rx"><span>Saldo previsto após o pedido</span><span>Flor <b class="num">${g(Math.max(0, r.flor.after))}</b> · Óleo <b class="num">${Math.max(0, r.oleo.after)} ${Math.abs(r.oleo.after) === 1 ? 'frasco' : 'frascos'}</b></span></div>` : ''}`;
  }
  let lastTotal = null;
  function renderCart() {
    const targets = $$('[data-cart]'); if (!targets.length) return;
    const html = cartHTML();
    for (const el of targets) {
      el.innerHTML = html;
      $$('[data-q]', el).forEach(b => b.addEventListener('click', () => { const [i, d] = b.dataset.q.split(':').map(Number); changeQty(i, d); }));
      $$('[data-rm]', el).forEach(b => b.addEventListener('click', () => removeItem(+b.dataset.rm)));
      const go = $('[data-gerar]', el); if (go) go.addEventListener('click', checkout);
    }
    const t = totals();
    if (lastTotal !== null && lastTotal !== t.sub) $$('[data-total]').forEach(e => { e.classList.add('flash'); setTimeout(() => e.classList.remove('flash'), 300); });
    lastTotal = t.sub;
    // barra inferior + contador do header
    const bar = $('#cartbar'); if (bar) { bar.classList.toggle('has', t.n > 0); document.body.classList.toggle('has-cartbar', t.n > 0 && window.matchMedia('(max-width: 1099px)').matches); $('[data-bar-n]', bar).textContent = `${t.n} ${t.n === 1 ? 'item' : 'itens'}`; $('[data-bar-total]', bar).textContent = brl(t.sub); }
    $$('[data-cart-n]').forEach(e => e.textContent = t.n || '');
  }
  function checkout() {
    const t = totals(); if (!t.n) return;
    const pedidos = store.get('axisPedidos', []);
    const num_ = 'AX-' + String(250 + pedidos.length).padStart(4, '0');
    pedidos.unshift({ num: num_, data: new Date().toLocaleDateString('pt-BR'), status: 0, simulado: true, rastreio: null, itens: cart.items.map(it => { const p = prod(it.id), s = size(p, it.tamanho); return [`${p.nome} · ${s.label}`, it.qtd, s.preco * it.qtd]; }), frete: null, total: t.sub });
    store.set('axisPedidos', pedidos);
    cart.items = []; store.set('axisCart', []);
    location.href = `${BASE}historico.html?novo=${num_}`;
  }

  // ---- drawer ----
  const drawer = $('#drawer');
  function openDrawer() { if (drawer && !drawer.open) drawer.showModal(); }
  if (drawer) {
    $$('[data-open-drawer]').forEach(b => b.addEventListener('click', openDrawer));
    $$('[data-close-drawer]', drawer).forEach(b => b.addEventListener('click', () => drawer.close()));
    drawer.addEventListener('click', (e) => { if (e.target === drawer) drawer.close(); });
    window.matchMedia('(min-width: 1100px)').addEventListener('change', (e) => { if (e.matches && drawer.open) drawer.close(); renderCart(); });
  }

  // ---- detalhe ----
  function openDetail(id) {
    const p = prod(id), dlg = $('#detail'); if (!p || !dlg) return;
    const t = size(p, ui.tam[p.id]);
    const kv = [...p.dados, ['Lote', p.lote], p.colheita ? ['Colheita', p.colheita] : ['Fabricação', p.fab], ['Validade', p.val]];
    if (p.terpenos) kv.push(['Terpenos dominantes', p.terpenos.map(x => `${x[0]} ${x[1]}`).join(' · ')]);
    const why = p.estoque === 0 ? null : canAdd(p, t);
    dlg.innerHTML = `
      <button type="button" class="icon-btn close" data-close aria-label="Fechar">${ICON.x}</button>
      <div class="detail-grid">
        <div class="detail-media">${M[p.id] || ''}</div>
        <div class="detail-body">
          <div><div class="cat">${esc(p.sub)}</div><h2>${esc(p.nome)}</h2></div>
          <div class="axis" role="img" aria-label="Eixo ${p.eixo[0]} a ${p.eixo[1]}: ${Math.round(p.eixo[2] * 100)} %"><i style="left:${p.eixo[2] * 100}%"></i><span>${p.eixo[0]}</span><span>${p.eixo[1]}</span></div>
          <p>${esc(p.texto)}</p>
          <div class="kv">${kv.map(([k, v]) => `<div class="k">${esc(k)}</div><div class="num">${esc(v)}</div>`).join('')}</div>
          <a class="link" href="https://axisfitomed.com.br/laudo/${p.lote}" target="_blank" rel="noopener">Ver laudo (CoA) do lote ${p.lote}</a>
          <div class="detail-cta">
            ${p.tamanhos.length > 1 ? `<div class="variants" role="group" aria-label="Apresentação">${p.tamanhos.map(x => `<button type="button" class="variant" aria-pressed="${x.label === t.label}" data-dsize="${esc(x.label)}">${esc(x.label)}<span class="m num">${brl(x.preco)}</span></button>`).join('')}</div>` : `<div class="price"><b class="num">${brl(t.preco)}</b><small>por ${esc(t.label)}</small></div>`}
            ${p.estoque === 0 ? `<button type="button" class="btn btn-ghost" data-avisar>Avise-me quando voltar</button>` : `<button type="button" class="btn btn-primary" data-dadd ${why ? `disabled title="${esc(why)}"` : ''}>Adicionar ao pedido</button>`}
          </div>
          ${why && p.estoque ? `<div class="cta-why" style="text-align:left">${esc(why)}</div>` : ''}
        </div>
      </div>`;
    $$('[data-dsize]', dlg).forEach(b => b.addEventListener('click', () => { ui.tam[p.id] = b.dataset.dsize; openDetail(id); renderCatalog(); }));
    const addB = $('[data-dadd]', dlg); if (addB) addB.addEventListener('click', () => { if (add(p.id, t.label)) dlg.close(); });
    const av = $('[data-avisar]', dlg); if (av) av.addEventListener('click', () => { toast(`Avisaremos quando ${p.nome} voltar ao estoque.`); dlg.close(); });
    $('[data-close]', dlg).addEventListener('click', () => dlg.close());
    if (!dlg.open) dlg.showModal();
  }

  if (page === 'pedido') {
    renderRx(); renderCatalog(); renderCart();
    $('#grid').addEventListener('click', (e) => {
      if (e.target.closest('[data-clear]')) { ui.filtro = 'todos'; ui.busca = ''; const b = $('#busca'); if (b) b.value = ''; renderCatalog(); return; }
      const card = e.target.closest('.card'); if (!card) return; const id = card.dataset.id;
      const v = e.target.closest('[data-size]'); if (v) { if (v.disabled) return; ui.tam[id] = v.dataset.size; renderCatalog(); $(`.card[data-id="${id}"] [data-size="${v.dataset.size}"]`)?.focus(); return; }
      const a = e.target.closest('[data-add]'); if (a) { add(id, size(prod(id), ui.tam[id]).label, a); return; }
      if (e.target.closest('[data-avisar]')) { toast(`Avisaremos quando ${prod(id).nome} voltar ao estoque.`); return; }
      if (e.target.closest('[data-open]')) openDetail(id);
    });
    $$('.chip[data-filtro]').forEach(c => c.addEventListener('click', () => { ui.filtro = c.dataset.filtro; renderCatalog(); }));
    const busca = $('#busca');
    if (busca) { busca.addEventListener('input', () => { ui.busca = busca.value.trim(); renderCatalog(); }); busca.addEventListener('keydown', (e) => { if (e.key === 'Escape') { busca.value = ''; ui.busca = ''; renderCatalog(); } }); }
    const clr = $('[data-clear-search]'); if (clr) clr.addEventListener('click', () => { busca.value = ''; ui.busca = ''; renderCatalog(); busca.focus(); });
    const ordem = $('#ordem'); if (ordem) ordem.addEventListener('change', () => { ui.ordem = ordem.value; renderCatalog(); });
    const detail = $('#detail'); detail.addEventListener('click', (e) => { if (e.target === detail) detail.close(); });
    document.addEventListener('keydown', (e) => { if (e.key === '/' && document.activeElement !== busca && !(e.target.closest('input,select,textarea'))) { e.preventDefault(); busca.focus(); } });
  }

  // ---- histórico ----
  if (page === 'historico') {
    const novo = new URLSearchParams(location.search).get('novo');
    const todos = [...store.get('axisPedidos', []), ...D.pedidos];
    $('#orders').innerHTML = todos.map(o => `<article class="order ${o.num === novo ? 'new' : ''}">
      <div>
        <div class="order-head"><b>Pedido ${esc(o.num)}</b><span class="status-pill ${o.status === 0 ? 'wait' : ''}">${o.concluido ? 'Entregue' : o.status === 0 ? 'Aguardando pagamento' : D.statusLabels[o.status]}</span><span class="d num">${esc(o.data)}${o.simulado ? ' · simulado' : ''}</span></div>
        <div class="order-items">${o.itens.map(([n, q, v]) => `<div><span>${q}× ${esc(n)}</span><span class="num">${brl(v)}</span></div>`).join('')}<div><span>Frete</span><span class="num">${o.frete == null ? 'a calcular' : brl(o.frete)}</span></div><div class="tot"><span>Total</span><span class="num">${brl(o.total)}</span></div></div>
      </div>
      <div>
        <div class="steps" aria-label="Etapas do pedido">${D.statusLabels.map((s, i) => `<div class="step ${o.concluido || i < o.status ? 'done' : ''} ${!o.concluido && i === o.status ? 'now' : ''}">${s}</div>`).join('')}</div>
        <div class="track">${o.rastreio ? `Rastreio <span class="mono">${esc(o.rastreio)}</span> · <a href="https://melhorrastreio.com.br/" target="_blank" rel="noopener">acompanhar</a>` : esc(D.statusTexto[o.status] || '')}</div>
      </div>
    </article>`).join('');
    if (novo) toast(`Pedido ${novo} gerado (simulação). Pix enviado ao seu e-mail.`);
  }

  // ---- perfil ----
  if (page === 'perfil') {
    const a = D.associado, r = D.receita;
    $('#perfil-dados').innerHTML = [['Nome', a.nome], ['Associado', `${a.id} · desde ${a.desde}`], ['E-mail', a.email], ['Telefone', a.telefone], ['Endereço de entrega', a.endereco]].map(([k, v]) => `<div class="k">${k}</div><div>${esc(v)}</div>`).join('');
    $('#perfil-rx').innerHTML = [['Prescritor', `${r.medico} · ${r.crm}`], ['Emitida', r.emitida], ['Válida até', r.validade], ['Limite mensal', `${g(r.limites.flor_g)} de flor · ${r.limites.oleo_frascos} frascos de óleo`], ...r.posologia].map(([k, v]) => `<div class="k">${esc(k)}</div><div class="num">${esc(v)}</div>`).join('');
  }
})();
