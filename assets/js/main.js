// Axis FitoMed — site main.js (sem libs)
(function () {
  // Hamburger
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
      var open = nav.classList.contains('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Fecha ao clicar em link
    nav.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Header: sombra ao scroll + some ao descer no mobile (volta ao subir)
  var header = document.querySelector('.site-header');
  if (header) {
    var lastY = window.scrollY;
    var onScroll = function () {
      var y = window.scrollY;
      if (y > 20) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
      // 860px: mesmo ponto em que o CSS troca para o menu mobile (styles.css).
      // Estava 720px, deixando 140px de faixa em que o header nao se escondia.
      var isMobile = window.matchMedia('(max-width: 860px)').matches;
      var menuOpen = nav && nav.classList.contains('open');
      if (isMobile && !menuOpen && y > 120 && y > lastY + 4) {
        header.classList.add('header-hidden');       // descendo
      } else if (!isMobile || y <= 120 || y < lastY - 4 || menuOpen) {
        header.classList.remove('header-hidden');     // subindo / topo / desktop / menu aberto
      }
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Marca link ativo pela pagina atual.
  // Antes usava href.replace('/','') — String.replace com padrao string troca so a
  // PRIMEIRA ocorrencia, entao '../sobre.html' virava '..sobre.html' e nunca casava:
  // nos 3 posts do blog nenhum item do menu ficava marcado.
  var path = window.location.pathname;
  var inBlog = path.indexOf('/blog/') !== -1;
  var here = path.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    var target = href.split('/').pop() || 'index.html';
    var sobe = href.indexOf('../') === 0;          // link que sai da pasta blog/
    var ativo = inBlog
      // dentro de blog/: so o item Blog acende (href relativo, sem ../)
      ? (href.indexOf('blog/') !== -1 || (!sobe && target === 'index.html'))
      : target === here;
    if (ativo) a.classList.add('active');
  });

  // ========== Fade-in on scroll ==========
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { revealObserver.observe(el); });
  }

  // Fallback robusto: garante reveal mesmo se o IntersectionObserver falhar
  // (ex.: secoes muito mais altas que a viewport no mobile).
  var revealPending = [].slice.call(document.querySelectorAll('.reveal'));
  var revealScan = function () {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    for (var i = revealPending.length - 1; i >= 0; i--) {
      var r = revealPending[i].getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) {
        revealPending[i].classList.add('is-visible');
        revealPending.splice(i, 1);
      }
    }
  };
  window.addEventListener('scroll', revealScan, { passive: true });
  window.addEventListener('resize', revealScan, { passive: true });
  revealScan();

  // ========== Counter animado ==========
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var numbers = document.querySelectorAll('.stat-number');
  if (numbers.length) {
    var affix = function (s) { return s ? '<span class="stat-affix">' + s + '</span>' : ''; };
    // Fecha o numero no valor real e marca como resolvido. Toda saida da
    // animacao passa por aqui — e o unico lugar que escreve o valor final.
    var settleCounter = function (el) {
      el.innerHTML = affix(el.dataset.prefix || '') + parseInt(el.dataset.target, 10) +
        affix(el.dataset.suffix || '');
      el.dataset.done = '1';
    };
    var animateCounter = function (el) {
      // rAF nao roda em aba que nao esta em primeiro plano: a contagem ficaria
      // congelada em 0 e a secao anunciaria "0 medicos com RQE" pra quem abriu
      // o link em nova aba. Sem primeiro plano, nao anima — escreve o valor.
      if (prefersReducedMotion || document.visibilityState !== 'visible') {
        settleCounter(el);
        return;
      }
      var target = parseInt(el.dataset.target, 10);
      var prefix = el.dataset.prefix || '';
      var suffix = el.dataset.suffix || '';
      var duration = 1400;
      var start = performance.now();
      var tick = function (now) {
        var elapsed = now - start;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = Math.round(target * eased);
        el.innerHTML = affix(prefix) + current + affix(suffix);
        if (progress < 1) requestAnimationFrame(tick);
        else settleCounter(el);
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      numbers.forEach(function (n) { counterObserver.observe(n); });
    } else {
      numbers.forEach(animateCounter);
    }
    // Se o visitante trocou de aba no meio da contagem, o rAF parou onde estava.
    // Ao voltar, fecha nos valores reais o que ficou pendente.
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState !== 'visible') return;
      numbers.forEach(function (n) { if (!n.dataset.done) settleCounter(n); });
    });
  }

  // ========== Filtros Ciencia ==========
  var filterGroups = document.querySelectorAll('.filter-chips');
  var paperCards = document.querySelectorAll('.paper-card');
  var papersEmpty = document.querySelector('.papers-empty');
  if (filterGroups.length && paperCards.length) {
    var filterState = { area: 'all', type: 'all' };
    function applyFilters() {
      var visible = 0;
      paperCards.forEach(function (card) {
        var matchArea = filterState.area === 'all' || card.dataset.area === filterState.area;
        var matchType = filterState.type === 'all' || card.dataset.type === filterState.type;
        var show = matchArea && matchType;
        card.hidden = !show;
        if (show) visible++;
      });
      if (papersEmpty) papersEmpty.hidden = visible > 0;
    }
    filterGroups.forEach(function (group) {
      var filterName = group.dataset.filter;
      group.querySelectorAll('.filter-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          group.querySelectorAll('.filter-chip').forEach(function (c) { c.classList.remove('is-active'); });
          chip.classList.add('is-active');
          filterState[filterName] = chip.dataset.value;
          applyFilters();
        });
      });
    });
  }

  // ========== Formulario de contato (monta mailto) ==========
  var contatoForm = document.getElementById('contatoForm');
  if (contatoForm) {
    contatoForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!contatoForm.checkValidity()) { contatoForm.reportValidity(); return; }
      var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      var assunto = g('assunto') || 'Contato';
      var subject = 'Contato site — ' + assunto + ' — ' + g('nome') + ' ' + g('sobrenome');
      var consentEl = document.getElementById('consent');
      var body = [
        'Nome: ' + g('nome') + ' ' + g('sobrenome'),
        'E-mail: ' + g('email'),
        'WhatsApp/Telefone: ' + g('telefone'),
        'Cidade: ' + g('cidade'),
        'Assunto: ' + assunto,
        '',
        'Mensagem:',
        g('mensagem'),
        '',
        // registra o aceite: o formulario exige o consentimento, entao ele precisa
        // chegar junto — sem isso a associacao nao guarda prova nenhuma
        '---',
        'Consentimento LGPD: ' + (consentEl && consentEl.checked ? 'aceito' : 'nao aceito') +
          ' (enviado pelo formulario do site)'
      ].join('\n');

      // Feedback: o mailto abre o cliente de e-mail do visitante. Se ele nao tiver
      // um configurado, o clique nao faz nada — sem esta nota o usuario fica sem saber.
      var aviso = document.getElementById('contatoAviso');
      if (aviso) {
        aviso.hidden = false;
        aviso.textContent = 'Abrimos o seu aplicativo de e-mail com a mensagem pronta — revise e envie. ' +
          'Se nada abriu, escreva direto para contato@axisfitomed.com.br.';
      }
      window.location.href = 'mailto:contato@axisfitomed.com.br?subject=' +
        encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }

  // ========== Toggle dos filtros (Ciencia) ==========
  var filterToggle = document.getElementById('filterToggle');
  var filtersPanel = document.getElementById('filtersPanel');
  if (filterToggle && filtersPanel) {
    filterToggle.addEventListener('click', function () {
      var closed = filtersPanel.hasAttribute('hidden');
      if (closed) { filtersPanel.removeAttribute('hidden'); filterToggle.setAttribute('aria-expanded', 'true'); }
      else { filtersPanel.setAttribute('hidden', ''); filterToggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  // ========== Mapa endocanabinoide interativo (hero) ==========
  var nhVisual = document.querySelector('.nh-visual');
  if (nhVisual) {
    var nhTip = nhVisual.querySelector('.nh-tip');
    var nhTipT = nhTip && nhTip.querySelector('.nh-tip-t');
    var nhTipD = nhTip && nhTip.querySelector('.nh-tip-d');
    var nhConn = nhVisual.querySelector('.nh-connector');
    var nhHint = nhVisual.querySelector('.nh-hint');
    var nhLegend = [].slice.call(nhVisual.querySelectorAll('.nh-legend li'));
    var nhNodes = [].slice.call(nhVisual.querySelectorAll('.nh-node'));
    // acende na legenda o termo do no ativo (passe null para apagar todos)
    var nhMark = function (mod) {
      nhLegend.forEach(function (li) {
        li.classList.toggle('is-on', !!mod && li.getAttribute('data-mod') === mod);
      });
    };
    if (nhTip && nhConn && nhNodes.length) {
      // a troca mouse/toque da legenda agora e CSS (@media pointer:coarse)
      var nhActive = null;

      var nhHero = nhVisual.closest('.nh-hero') || nhVisual;
      var nhPlace = function (node) {
        var vr = nhVisual.getBoundingClientRect();
        var hr = nhHero.getBoundingClientRect();
        var nr = node.getBoundingClientRect();
        var cx = nr.left + nr.width / 2 - vr.left;
        var cy = nr.top + nr.height / 2 - vr.top;
        var tw = nhTip.offsetWidth || 180;
        var th = nhTip.offsetHeight || 60;
        cx = Math.max(tw / 2 + 6, Math.min(cx, vr.width - tw / 2 - 6));
        nhTip.style.left = cx + 'px';
        nhTip.style.top = cy + 'px';
        // Acima por padrão; vira pra baixo quando não cabe acima dentro do hero
        // (o hero tem overflow:hidden — sem isso o tooltip é cortado no topo).
        var nodeCenterY = nr.top + nr.height / 2;
        var below = (nodeCenterY - (th + 22)) < hr.top;
        nhTip.classList.toggle('below', below);
      };
      var nhShow = function (node) {
        if (nhActive && nhActive !== node) nhActive.classList.remove('is-active');
        nhActive = node;
        node.classList.add('is-active');
        nhTipT.textContent = node.getAttribute('data-mod') || '';
        nhTipD.textContent = node.getAttribute('data-desc') || '';
        nhPlace(node);
        nhTip.classList.add('is-on');
        nhConn.setAttribute('x2', node.getAttribute('data-cx'));
        nhConn.setAttribute('y2', node.getAttribute('data-cy'));
        nhConn.classList.add('is-on');
        nhMark(node.getAttribute('data-mod'));
        if (nhHint) nhHint.classList.add('is-hidden');
      };
      var nhHide = function (node) {
        if (node) node.classList.remove('is-active');
        if (nhActive === node || !node) nhActive = null;
        nhTip.classList.remove('is-on');
        nhConn.classList.remove('is-on');
        nhMark(null);
      };
      nhNodes.forEach(function (node) {
        node.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') nhShow(node); });
        node.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') nhHide(node); });
        node.addEventListener('focus', function () { nhShow(node); });
        node.addEventListener('blur', function () { nhHide(node); });
        node.addEventListener('click', function (e) { e.preventDefault(); if (nhActive === node) nhHide(node); else nhShow(node); });
        node.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); if (nhActive === node) nhHide(node); else nhShow(node); }
        });
      });
      document.addEventListener('click', function (e) { if (nhActive && !nhActive.contains(e.target)) nhHide(nhActive); });
    }
  }

  // ========== Scrollytelling do sistema endocanabinoide ==========
  // Mesmo comportamento no desktop e no mobile: diagrama sticky que transforma
  // pelas cenas conforme cada passo entra em tela (layout muda via CSS).
  var ecs = document.querySelector('.ecs');
  if (ecs && 'IntersectionObserver' in window) {
    var ecsSteps = [].slice.call(ecs.querySelectorAll('.ecs-step'));
    var ecsScene = function (n) { return ecs.querySelector('.ecs-s' + n); };
    var ecsScenes = {};
    [1, 2, 3, 4].forEach(function (n) { ecsScenes[n] = ecsScene(n); });
    var ecsActivate = function (n) {
      ecsSteps.forEach(function (st) { st.classList.toggle('is-current', st.getAttribute('data-scene') === String(n)); });
      [1, 2, 3, 4].forEach(function (k) { if (ecsScenes[k]) ecsScenes[k].classList.toggle('is-active', k === Number(n)); });
    };
    ecsActivate(1);
    var ecsIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) ecsActivate(e.target.getAttribute('data-scene')); });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    ecsSteps.forEach(function (st) { ecsIO.observe(st); });
  }

  // ========== Mapa do corpo (indicações interativas) ==========
  var bmStage = document.querySelector('.bm-stage');
  if (bmStage) {
    var bmMarkers = [].slice.call(bmStage.querySelectorAll('.bm-marker'));
    var bmCats = [].slice.call(bmStage.querySelectorAll('.bm-cat'));
    var bmHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
    // Cross-fade: paineis empilhados (absolutos). Remove hidden e trava a altura
    // do painel pela maior categoria, p/ nao pular ao trocar.
    var bmPanel = bmStage.querySelector('.bm-panel');
    var bmSize = function () {
      var mx = 0;
      bmCats.forEach(function (c) { if (c.offsetHeight > mx) mx = c.offsetHeight; });
      if (bmPanel && mx) bmPanel.style.minHeight = mx + 'px';
    };
    bmCats.forEach(function (c) {
      c.removeAttribute('hidden');
      c.setAttribute('aria-hidden', c.classList.contains('is-active') ? 'false' : 'true');
    });
    bmSize();
    window.addEventListener('resize', bmSize);
    window.addEventListener('load', bmSize);
    var bmActivate = function (cat) {
      bmMarkers.forEach(function (m) {
        var on = m.getAttribute('data-cat') === cat;
        m.classList.toggle('is-on', on);
        m.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      bmCats.forEach(function (c) {
        var on = c.getAttribute('data-cat') === cat;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      bmStage.querySelectorAll('.bm-zone').forEach(function (z) {
        z.classList.toggle('is-on', z.getAttribute('data-cat') === cat);
      });
      var conduit = bmStage.querySelector('.bm-conduit[data-cat="' + cat + '"]');
      if (conduit) { conduit.classList.remove('fire'); void conduit.getBoundingClientRect(); conduit.classList.add('fire'); }
    };
    bmMarkers.forEach(function (m) {
      var cat = m.getAttribute('data-cat');
      m.addEventListener('click', function () { bmActivate(cat); });
      m.addEventListener('mouseenter', function () { if (bmHover) bmActivate(cat); });
    });
  }
})();

// ========== Fluxo do heroi (Gateway Flow, porte em canvas puro) ==========
// Curvas de Bezier saem das bordas esquerda e direita e convergem num alvo:
// o centro do hexagono da marca. Particulas percorrem as curvas. Um toque no
// heroi solta uma onda que empurra as particulas. Respeita prefers-reduced-
// motion (quadro estatico, sem loop) e so anima com o heroi em tela.
(function () {
  var hero = document.querySelector('.nh-hero');
  var canvas = hero && hero.querySelector('.nh-flow');
  if (!hero || !canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var width = 0, height = 0, target = { x: 0, y: 0 };
  var paths = [], explosions = [];
  var running = false, frame = 0;

  function measureTarget() {
    // O alvo e a marca; sem ela, o centro do canvas.
    var mark = hero.querySelector('.axis-mark .hex');
    var hr = hero.getBoundingClientRect();
    if (mark) {
      var mr = mark.getBoundingClientRect();
      target.x = mr.left + mr.width / 2 - hr.left;
      target.y = mr.top + mr.height / 2 - hr.top;
    } else {
      target.x = width / 2; target.y = height / 2;
    }
  }

  function buildPaths() {
    // Densidade acompanha a largura: 80 curvas em 1440px, 24 em 390px.
    var count = Math.max(24, Math.min(80, Math.round(width / 18)));
    paths = [];
    for (var i = 0; i < count; i++) {
      paths.push({
        isLeft: i % 2 === 0,
        startY: (i / count) * height * 1.4 - height * 0.2,
        t: Math.random(),
        speed: 0.0015 + Math.random() * 0.002
      });
    }
  }

  function resize() {
    var r = hero.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.round(r.width); height = Math.round(r.height);
    canvas.width = width * dpr; canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    measureTarget();
    if (!paths.length || Math.abs(paths.length - Math.round(width / 18)) > 12) buildPaths();
    if (reduced) drawFrame(false);
  }

  function bezier(t, p0, p1, p2, p3) {
    var u = 1 - t;
    return {
      x: u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x,
      y: u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y
    };
  }

  function drawFrame(advance) {
    ctx.clearRect(0, 0, width, height);
    var tx = target.x, ty = target.y;

    if (advance) {
      explosions.forEach(function (e) { e.radius += 15; e.life -= 0.015; });
      explosions = explosions.filter(function (e) { return e.life > 0; });
    }

    for (var i = 0; i < paths.length; i++) {
      var path = paths[i];
      // Os pontos de controle sao os do original, com o alvo no lugar do centro.
      var p0 = { x: path.isLeft ? 0 : width, y: path.startY };
      var p1 = { x: path.isLeft ? tx * 0.5 : width - (width - tx) * 0.5, y: path.startY };
      var p2 = { x: path.isLeft ? tx * 0.8 : width - (width - tx) * 0.8, y: ty };
      var p3 = { x: tx, y: ty };

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      ctx.strokeStyle = 'rgba(95, 200, 155, 0.28)';
      ctx.lineWidth = 1;
      ctx.setLineDash([1, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (advance) {
        path.t += path.speed;
        if (path.t > 1) { path.t = 0; path.startY += (Math.random() - 0.5) * 10; }
      }
      var pos = bezier(path.t, p0, p1, p2, p3);

      var dxT = 0, dyT = 0;
      for (var k = 0; k < explosions.length; k++) {
        var e = explosions[k];
        var dx = pos.x - e.x, dy = pos.y - e.y;
        var dist = Math.hypot(dx, dy) || 1;
        if (dist < e.radius + 120 && dist > e.radius - 120) {
          var force = (1 - Math.abs(dist - e.radius) / 120) * e.life;
          dxT += (dx / dist) * force * 80;
          dyT += (dy / dist) * force * 80;
        }
      }
      ctx.fillStyle = 'rgba(168, 236, 202, 0.75)';
      ctx.fillRect(pos.x + dxT - 1.25, pos.y + dyT - 1.25, 2.5, 2.5);
    }
  }

  function loop() {
    if (!running) return;
    drawFrame(true);
    frame = requestAnimationFrame(loop);
  }
  function start() { if (running || reduced) return; running = true; frame = requestAnimationFrame(loop); }
  function stop() { running = false; if (frame) cancelAnimationFrame(frame); frame = 0; }

  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero);
  else window.addEventListener('resize', resize);
  // A grade assenta depois das fontes; o alvo e medido de novo.
  window.addEventListener('load', function () { measureTarget(); if (reduced) drawFrame(false); });

  if (!reduced) {
    hero.addEventListener('pointerdown', function (ev) {
      var r = hero.getBoundingClientRect();
      explosions.push({ x: ev.clientX - r.left, y: ev.clientY - r.top, radius: 0, life: 1 });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) start(); else stop(); });
      }, { threshold: 0.05 }).observe(hero);
    } else {
      start();
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') { if (!running) start(); } else stop();
    });
  }
})();
