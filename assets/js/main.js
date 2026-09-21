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
  var band = { top: 0, bottom: 0 };   // faixa vertical do diagrama (mobile)
  var paths = [], explosions = [];
  var running = false, frame = 0;

  function measureTarget() {
    // O alvo e a marca; sem ela, o centro do canvas.
    var mark = hero.querySelector('.axis-mark .hex');
    var svg = hero.querySelector('.nh-visual svg');
    var hr = hero.getBoundingClientRect();
    if (mark) {
      var mr = mark.getBoundingClientRect();
      target.x = mr.left + mr.width / 2 - hr.left;
      target.y = mr.top + mr.height / 2 - hr.top;
    } else {
      target.x = width / 2; target.y = height / 2;
    }
    // No mobile o diagrama e uma faixa no meio do heroi: o CSS mascara o canvas
    // fora dela (--nh-flow-top/bottom) e as curvas nascem dentro dela.
    if (svg) {
      var sr = svg.getBoundingClientRect();
      band.top = sr.top - hr.top; band.bottom = sr.bottom - hr.top;
    } else {
      band.top = 0; band.bottom = height;
    }
    hero.style.setProperty('--nh-flow-top', Math.round(band.top) + 'px');
    hero.style.setProperty('--nh-flow-bottom', Math.round(band.bottom) + 'px');
  }
  // Empilhado (uma coluna) = o breakpoint do .nh-grid no CSS
  function stacked() { return width <= 900; }
  function spawnY(i, count) {
    if (!stacked()) return (i / count) * height * 1.4 - height * 0.2;
    // arcos entram de lado, na altura do diagrama, com folga de 12% acima e abaixo
    var span = band.bottom - band.top;
    return band.top - span * 0.12 + (i / (count - 1)) * span * 1.24;
  }

  function buildPaths() {
    // Densidade acompanha a largura: 80 curvas em 1440px, 24 em 390px.
    var count = Math.max(24, Math.min(80, Math.round(width / 18)));
    paths = [];
    for (var i = 0; i < count; i++) {
      paths.push({
        isLeft: i % 2 === 0,
        startY: spawnY(i, count),
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
    buildPaths();
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
        if (path.t > 1) {
          path.t = 0; path.startY += (Math.random() - 0.5) * 10;
          if (stacked()) path.startY = Math.max(band.top - 40, Math.min(band.bottom + 40, path.startY));
        }
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
    hero.addEventListener('click', function (ev) {
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

// ========== Mapa do corpo: spotlight + figura em perspectiva ==========
// O spotlight e um div que segue o mouse dentro do card. A figura inclina e
// vira para o cursor (ate 7deg em X, 10deg em Y), com interpolacao curta, e
// balanca devagar quando o cursor sai. So em dispositivo com hover; nada sob
// prefers-reduced-motion; loop so com o card em tela.
(function () {
  var stage = document.querySelector('.bm-stage');
  var figure = stage && stage.querySelector('.bm-figure');
  var spot = stage && stage.querySelector('.bm-spot');
  if (!stage || !figure) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;
  if (reduced || !canHover) return;

  var over = false, tx = 0, ty = 0, rx = 0, ry = 0, running = false, frame = 0;
  stage.addEventListener('mousemove', function (ev) {
    var r = stage.getBoundingClientRect();
    if (spot) spot.style.transform = 'translate(' + (ev.clientX - r.left) + 'px,' + (ev.clientY - r.top) + 'px) translate(-50%, -50%)';
    var f = figure.getBoundingClientRect();
    var nx = Math.max(-1, Math.min(1, (ev.clientX - (f.left + f.width / 2)) / (f.width / 2)));
    var ny = Math.max(-1, Math.min(1, (ev.clientY - (f.top + f.height / 2)) / (f.height / 2)));
    ty = nx * 10; tx = -ny * 7;
  });
  stage.addEventListener('mouseenter', function () { over = true; stage.classList.add('is-lit'); });
  stage.addEventListener('mouseleave', function () { over = false; stage.classList.remove('is-lit'); });

  function tick(t) {
    if (!running) return;
    if (!over) { ty = Math.sin(t * 0.0005) * 3; tx = Math.cos(t * 0.00035) * 1.5; }   // balanco em repouso
    rx += (tx - rx) * 0.08; ry += (ty - ry) * 0.08;
    figure.style.setProperty('--bm-rx', rx.toFixed(2) + 'deg');
    figure.style.setProperty('--bm-ry', ry.toFixed(2) + 'deg');
    frame = requestAnimationFrame(tick);
  }
  function start() { if (running) return; running = true; frame = requestAnimationFrame(tick); }
  function stop() { running = false; if (frame) cancelAnimationFrame(frame); frame = 0; }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) start(); else stop(); }); }, { threshold: 0.05 }).observe(stage);
  } else start();
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { if (!running) start(); } else stop(); });
})();

// ========== Campo vivo da faixa final (Velaris, porte em WebGL puro) ==========
// Ruido simplex em duas oitavas e meia misturando quatro verdes da paleta sobre
// o navy, com vinheta, no lugar da foto de fundo do fecho da home. Fica sob o
// mesmo glow e veu que governam o contraste do texto. Meia resolucao: o campo
// e suave, nao perde nada e custa 4x menos. Anima so com a faixa em tela; sob
// prefers-reduced-motion desenha um quadro e para.
(function () {
  var stage = document.querySelector('.finale');
  var canvas = stage && stage.querySelector('.fin-field');
  if (!stage || !canvas) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return;   // sem WebGL fica o navy da secao, que e o mesmo do shader

  var VERT = 'attribute vec2 position; varying vec2 vUv; void main(){ vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }';
  var FRAG = [
    'precision highp float; varying vec2 vUv;',
    'uniform vec2 u_resolution; uniform float u_time; uniform float u_grain; uniform vec3 u_colors[4]; uniform vec3 u_bg;',
    'vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }',
    'float snoise(vec2 v){',
    '  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);',
    '  vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx);',
    '  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);',
    '  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.0);',
    '  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));',
    '  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0); m = m*m; m = m*m;',
    '  vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;',
    '  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);',
    '  vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;',
    '  return 130.0 * dot(m, g); }',
    'void main(){',
    '  vec2 uv = vUv; float ratio = u_resolution.x / u_resolution.y; vec2 p = uv - 0.5; p.x *= ratio;',
    '  float t = u_time * 0.1;',
    // Escala espacial 1.1/1.5/2.0 (era 0.4/0.55/0.75): com p em +-0.5 no
    // retrato, 0.4 dava um unico borrao plano — nada para se mover.
    '  float n1 = snoise(p * 1.1 + vec2(t * 0.2, -t * 0.3));',
    '  float n2 = snoise(p * 1.5 + vec2(-t * 0.15, t * 0.25) + n1 * 0.25);',
    '  float n3 = snoise(p * 2.0 + vec2(t * 0.1, -t * 0.2) + n2 * 0.2);',
    '  vec3 col = u_bg; float dist = length(p) * 1.5; float vignette = 1.0 - smoothstep(0.3, 1.2, dist);',
    '  col = mix(col, u_colors[0], smoothstep(-0.2, 0.5, n1) * 0.85);',
    '  col = mix(col, u_colors[1], smoothstep(-0.1, 0.6, n2) * 0.7);',
    '  col = mix(col, u_colors[2], smoothstep(-0.3, 0.4, n3) * 0.6);',
    '  col = mix(col, u_colors[3], smoothstep(0.0, 0.7, n1 * n2) * 0.5);',
    '  float glow = smoothstep(0.8, 0.0, dist) * 0.3; col += u_colors[1] * glow;',
    '  col = mix(col * 0.2, col, vignette);',
    '  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + u_time); col += (grain - 0.5) * u_grain * 0.1;',
    '  gl_FragColor = vec4(col, 1.0); }'
  ].join('\n');

  function shader(type, src) {
    var sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn('fin-field shader:', gl.getShaderInfoLog(sh)); return null; }
    return sh;
  }
  var vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var pos = gl.getAttribLocation(prog, 'position'); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  var U = { res: gl.getUniformLocation(prog, 'u_resolution'), time: gl.getUniformLocation(prog, 'u_time'),
            grain: gl.getUniformLocation(prog, 'u_grain'), colors: gl.getUniformLocation(prog, 'u_colors'), bg: gl.getUniformLocation(prog, 'u_bg') };

  function rgb(hex) { var h = hex.replace('#', ''); return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]; }
  // Paleta: verde profundo, verde da marca (tambem no brilho central), verde-musgo, navy.
  // SPEED 2.4 (era 0.6): a 0.6 o campo mudava ~1% em 2 s — parecia parado.
  var COLORS = ['#1c5a45', '#3fa57c', '#0f3d2e', '#0d1b2a'], BG = '#08111c', SPEED = 2.4, GRAIN = 0.15;
  var flat = new Float32Array([].concat.apply([], COLORS.map(rgb)));
  gl.uniform3fv(U.colors, flat); gl.uniform3f(U.bg, rgb(BG)[0], rgb(BG)[1], rgb(BG)[2]); gl.uniform1f(U.grain, GRAIN);

  function resize() {
    var r = stage.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2) * 0.5;   // meia resolucao
    canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (reduced) draw(0);
  }
  function draw(t) {
    gl.uniform2f(U.res, canvas.width, canvas.height);
    gl.uniform1f(U.time, t * 0.001 * SPEED);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  var running = false, frame = 0;
  function loop(t) { if (!running) return; draw(t); frame = requestAnimationFrame(loop); }
  function start() { if (running || reduced) return; running = true; frame = requestAnimationFrame(loop); }
  function stop() { running = false; if (frame) cancelAnimationFrame(frame); frame = 0; }

  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  if (!reduced) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) start(); else stop(); }); }, { threshold: 0.05 }).observe(stage);
    } else start();
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { if (!running) start(); } else stop(); });
  }
})();

// ========== Equipe em orbita (home) ==========
// Palco de referencia 1200x450, centro dos arcos em (600,580), raios 492 e 372.
// Escala so a geometria (posicoes, altura do palco); o texto fica no tamanho da
// escala tipografica. Abaixo de 640px os angulos sao os de data-angle-m e os
// fatos saem do arco (o CSS os poe em fileira).
(function () {
  var orb = document.querySelector('.orb');
  if (!orb) return;
  var frame = orb.querySelector('.orb-frame'), stage = orb.querySelector('.orb-stage'), facts = orb.querySelector('.orb-facts');
  var W = 1200, H = 450, CX = 600, CY = 580, R = { outer: 492, inner: 372 };   // era 490/620: subiu 40, menos vazio sob o titulo
  var knockRects = [].slice.call(orb.querySelectorAll('.orb-knock')), knocks = [];
  var flow = orb.querySelector('.orb-flow'), ctx = flow && flow.getContext ? flow.getContext('2d') : null;
  var scale = 1, dots = [];
  function layout() {
    var w = frame.clientWidth; if (!w) return;
    var narrow = w < 640;            // angulos de data-angle-m, avatar menor (CSS)
    var factsRow = true;             // fatos sempre na fileira abaixo do A (antes: so < 1000px)
    orb.classList.toggle('orb--facts-row', factsRow);
    var s = Math.min(1, Math.max(0.6, w / W));
    frame.style.height = Math.round(H * s) + 'px';
    stage.style.width = Math.round(W * s) + 'px'; stage.style.height = Math.round(H * s) + 'px';
    var offset = (w - W * s) / 2;   // o palco e centrado no quadro; os fatos sao relativos ao quadro
    orb.querySelectorAll('[data-ring]').forEach(function (el) {
      var inFacts = facts && facts.contains(el);
      if (inFacts && factsRow) { el.style.left = ''; el.style.top = ''; return; }
      var deg = parseFloat((narrow && el.dataset.angleM) ? el.dataset.angleM : el.dataset.angle);
      var a = deg * Math.PI / 180, r = R[el.dataset.ring] * s;
      var x = CX * s + r * Math.cos(a), y = CY * s - r * Math.sin(a);
      if (inFacts) x += offset;
      el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px';
    });
    var core = orb.querySelector('.orb-core');
    // no estreito o bloco do medico central (nome, especialidade, CRM) desce ate
    // o A: a marca vai mais para baixo (445 em vez de 393)
    if (core) { core.style.left = Math.round(CX * s) + 'px'; core.style.top = Math.round((narrow ? 405 : 353) * s) + 'px'; }
    scale = s;
    // O quadro cresce se algum medico (ancorado pela foto, texto pendente)
    // ultrapassar o palco — entre 640 e 1000px os laterais ficam baixos no arco.
    var sr0 = stage.getBoundingClientRect(), need = H * s;
    orb.querySelectorAll('.orb-doc, .orb-core').forEach(function (d) { need = Math.max(need, d.getBoundingClientRect().bottom - sr0.top + 6); });
    frame.style.height = Math.round(need) + 'px';
    // Recortes: uniao das caixas de nome e CRM de cada medico, com folga, em px
    // do palco (para o canvas) e em unidades do viewBox (px / s, para a mascara
    // do SVG). O arco some atras do texto em qualquer largura.
    var sr = stage.getBoundingClientRect();
    knocks = [];
    orb.querySelectorAll('.orb-doc').forEach(function (doc, i) {
      var parts = [].slice.call(doc.querySelectorAll('.orb-name, .orb-spec, .orb-rqe')).map(function (n) { return n.getBoundingClientRect(); });
      if (!parts.length) return;
      var x1 = Math.min.apply(null, parts.map(function (r) { return r.left; })) - sr.left - 8, x2 = Math.max.apply(null, parts.map(function (r) { return r.right; })) - sr.left + 8;
      var y1 = Math.min.apply(null, parts.map(function (r) { return r.top; })) - sr.top - 5, y2 = Math.max.apply(null, parts.map(function (r) { return r.bottom; })) - sr.top + 5;
      knocks.push({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 });
      var rect = knockRects[i];
      if (rect) { rect.setAttribute('x', x1 / s); rect.setAttribute('y', y1 / s); rect.setAttribute('width', (x2 - x1) / s); rect.setAttribute('height', (y2 - y1) / s); }
    });
    if (ctx) {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      flow.width = Math.round(W * s * dpr); flow.height = Math.round(H * s * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed(w < 640);
    }
  }

  // ---- Moleculas nos arcos: o fluxo do heroi, em orbita ----
  // Pontos saem das duas pontas de cada arco e convergem no apice (como as
  // curvas do heroi convergem na marca), com um rastro curto. Nao passam por
  // cima do texto (mesmos recortes da mascara). So animam com a secao em tela;
  // sob prefers-reduced-motion o canvas fica vazio — os arcos ja descrevem o espaco.
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var running = false, raf = 0;
  function seed(narrow) {
    dots = [];
    [{ r: 'outer', n: narrow ? 8 : 14 }, { r: 'inner', n: narrow ? 6 : 10 }].forEach(function (ring) {
      for (var i = 0; i < ring.n; i++) {
        dots.push({ ring: ring.r, left: i % 2 === 0, t: Math.random(), speed: 0.0009 + Math.random() * 0.0012, trail: [] });
      }
    });
  }
  function inKnock(x, y) {
    for (var k = 0; k < knocks.length; k++) {
      var q = knocks[k];
      if (x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h) return true;
    }
    return false;
  }
  function drawFlow() {
    var s = scale, w = W * s, h = H * s;
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      d.t += d.speed;
      if (d.t > 1) { d.t = 0; d.trail = []; }
      var th = d.left ? Math.PI - d.t * Math.PI / 2 : d.t * Math.PI / 2;
      var r = R[d.ring] * s;
      var x = CX * s + r * Math.cos(th), y = CY * s - r * Math.sin(th);
      // entra e some suave nas pontas do trajeto
      var a = Math.min(1, d.t / 0.12) * Math.min(1, (1 - d.t) / 0.15);
      d.trail.push({ x: x, y: y }); if (d.trail.length > 7) d.trail.shift();
      for (var j = 0; j < d.trail.length; j++) {
        var p = d.trail[j];
        if (inKnock(p.x, p.y)) continue;
        var f = (j + 1) / d.trail.length;   // 1 = ponto atual
        var size = 1 + f * 1.6;
        ctx.fillStyle = 'rgba(168, 236, 202, ' + (0.8 * a * f * f).toFixed(3) + ')';
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      }
    }
  }
  function loop() { if (!running) return; drawFlow(); raf = requestAnimationFrame(loop); }
  function start() { if (running || reduced || !ctx) return; running = true; raf = requestAnimationFrame(loop); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  layout();
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(frame); else window.addEventListener('resize', layout);
  window.addEventListener('load', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  if (ctx && !reduced) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) start(); else stop(); }); }, { threshold: 0.05 }).observe(orb);
    } else start();
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { if (!running) start(); } else stop(); });
  }
})();

// ========== Titulos em revelacao por palavra (reveal-text, porte em vanilla) ==========
// Cada palavra de h1/h2 entra com blur + subida, escalonada (45ms), uma vez, ao
// entrar em tela. Marcacao inline (.hl, .accent, <br>) fica: so os nos de texto
// sao envolvidos. O texto continua inteiro no DOM. Sob prefers-reduced-motion
// nao envolve nada. Fora: o kicker do contador e os titulos das paginas legais.
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var heads = [].slice.call(document.querySelectorAll('h1, h2')).filter(function (h) {
    return !h.classList.contains('stats-kicker') && !h.closest('.lg-doc');
  });
  if (!heads.length) return;
  function wrap(node, st) {
    if (node.nodeType === 3) {
      var parts = node.nodeValue.split(/(\s+)/), frag = document.createDocumentFragment();
      parts.forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
        var w = document.createElement('span'); w.className = 'rt-w'; w.style.setProperty('--i', st.i++); w.textContent = p;
        frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === 1 && node.tagName !== 'BR') {
      [].slice.call(node.childNodes).forEach(function (c) { wrap(c, st); });
    }
  }
  heads.forEach(function (h) { var st = { i: 0 }; [].slice.call(h.childNodes).forEach(function (c) { wrap(c, st); }); h.classList.add('rt'); });
  var show = function (h) { h.classList.add('rt-in'); };
  if (!('IntersectionObserver' in window)) { heads.forEach(show); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  heads.forEach(function (h) { io.observe(h); });
})();

// ========== Buraco negro (hero de /ciencia, WebGL puro) ==========
// Raio por pixel, integrado passo a passo sob uma gravidade que dobra a luz
// (newtoniana reforcada — nao e relatividade, e o gesto dela). O disco de
// acrecao e um anel no plano y=0 entre dois raios, nos verdes da paleta, com
// bandas de ruido girando e o lado que vem na direcao da camera mais claro
// (doppler). Raio que cai no horizonte = sombra. Meia resolucao; anima so com
// o hero em tela; sob prefers-reduced-motion desenha um quadro e para.
(function () {
  var stage = document.querySelector('.ciencia-hero');
  var canvas = stage && stage.querySelector('.bh-field');
  if (!stage || !canvas) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return;

  var VERT = 'attribute vec2 position; varying vec2 vUv; void main(){ vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }';
  var FRAG = [
    'precision highp float; varying vec2 vUv; uniform vec2 u_res; uniform float u_time; uniform vec2 u_c; uniform float u_s;',
    'float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y); }',
    'void main(){',
    // Centro (u_c, px do canvas) e escala (u_s, px por unidade) vem do JS,
    // medidos a partir do fim do texto: o disco nunca sobe ate ele.
    '  vec2 uv = (gl_FragCoord.xy - u_c) / u_s;',
    '  float dist = 22.0;',
    // Camera orbita devagar (±17°) e sobe e desce (±0.35): a lente muda de
    // forma a olho nu. Antes era um balanco de 0.06 a 22 de distancia — parado.
    '  float orb = sin(u_time * 0.2) * 0.35; float bob = sin(u_time * 0.27) * 0.4;',
    '  vec3 ro = vec3(sin(orb) * dist, 2.2 + bob, -cos(orb) * dist); vec3 ta = vec3(0.0);',
    '  vec3 fw = normalize(ta - ro); vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)); vec3 up = cross(fw, rt);',
    '  vec3 v = normalize(fw * 1.6 + uv.x * rt + uv.y * up); vec3 p = ro;',
    '  vec3 col = vec3(0.0); float occ = 0.0; bool captured = false;',
    '  for (int i = 0; i < 128; i++) {',
    '    float r2 = dot(p, p); float r = sqrt(r2);',
    '    if (r < 1.0) { captured = true; break; }',
    '    float dt = 0.06 + 0.035 * r;',
    '    vec3 a = -p * (1.35 / (r2 * r));',
    '    vec3 pn = p + v * dt;',
    '    if (p.y * pn.y < 0.0) {',
    '      float t = p.y / (p.y - pn.y); vec3 hp = mix(p, pn, t); float hr = length(hp.xz);',
    '      if (hr > 2.1 && hr < 6.8) {',
    '        float edge = smoothstep(2.1, 2.6, hr) * (1.0 - smoothstep(5.0, 6.8, hr));',
    '        float ang = atan(hp.z, hp.x);',
    // Rotacao diferencial: o interior gira mais rapido (kepleriano), as
    // bandas se cisalham — e o que da a sensacao de disco girando.
    '        float w = 0.5 + 3.0 / hr;',
    '        float band = 0.35 + 0.65 * noise(vec2(ang * 4.0 + u_time * w, hr * 3.0));',
    '        band *= 0.6 + 0.8 * noise(vec2(ang * 9.0 + u_time * w * 1.6, hr * 1.2));',   // estrias que giram
    '        band *= 0.7 + 0.3 * noise(vec2(hr * 9.0 - u_time * 0.3, ang * 2.0 + u_time * w * 0.5));',
    '        vec3 tang = normalize(vec3(-hp.z, 0.0, hp.x));',
    '        float dop = 1.0 + 0.55 * dot(tang, -normalize(v));',
    '        float heat = smoothstep(6.8, 2.1, hr);',
    '        vec3 c = mix(vec3(0.08, 0.30, 0.24), vec3(0.37, 0.78, 0.60), heat);',
    '        c = mix(c, vec3(0.86, 0.98, 0.92), pow(heat, 4.0) * 0.6);',
    '        c *= band * dop * 1.25;',
    '        col += c * edge * (1.0 - occ); occ += edge * 0.55;',
    '      }',
    '    }',
    '    v = normalize(v + a * dt); p = pn;',
    '    if (r > 40.0) break;',
    '  }',
    '  if (captured) { col += vec3(0.02, 0.04, 0.07) * (1.0 - occ); }',
    '  else {',
    '    vec3 d = normalize(v); vec2 sp = d.xy * 90.0 + d.z * 13.0;',
    '    float s = pow(hash21(floor(sp)), 60.0) * smoothstep(0.85, 1.0, 1.0 - length(fract(sp) - 0.5) * 1.4);',
    '    vec3 bg = vec3(0.045, 0.095, 0.15) + vec3(0.02, 0.07, 0.05) * noise(d.xy * 2.0 + 3.0);',
    '    col += (bg + vec3(0.7, 0.85, 0.8) * s * 1.4) * (1.0 - occ);',
    '  }',
    '  col = col / (1.0 + col * 0.6);',
    '  gl_FragColor = vec4(col, 1.0); }'
  ].join('\n');

  function shader(type, src) {
    var sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn('bh-field shader:', gl.getShaderInfoLog(sh)); return null; }
    return sh;
  }
  var vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var pos = gl.getAttribLocation(prog, 'position'); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  var U = { res: gl.getUniformLocation(prog, 'u_res'), time: gl.getUniformLocation(prog, 'u_time'),
            c: gl.getUniformLocation(prog, 'u_c'), s: gl.getUniformLocation(prog, 'u_s') };
  var copy = stage.querySelector('.container');

  // Geometria a partir do texto (medida em captura: o apice do arco lensado
  // fica 0.31 unidade acima do centro; a sombra, 0.275). O arco comeca 40px
  // abaixo do fim do texto; a unidade (370–560px, 38.5% da largura) fixa o
  // tamanho do buraco — sombra de ~300px no desktop, ~200 no celular. O hero
  // fica exatamente da altura que o buraco precisa.
  function resize() {
    var r = stage.getBoundingClientRect();
    var textBottom = copy ? copy.getBoundingClientRect().bottom - r.top : r.height * 0.45;
    var unit = Math.max(370, Math.min(560, r.width * 0.385));
    var centerTop = textBottom + 44 + 0.36 * unit;
    var need = Math.round(centerTop + 0.36 * unit);
    if (Math.abs(need - r.height) > 1) { stage.style.minHeight = need + 'px'; r = stage.getBoundingClientRect(); }
    var dpr = Math.min(window.devicePixelRatio || 1, 2) * 0.5;   // meia resolucao: 128 passos por pixel
    canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.c, canvas.width / 2, canvas.height - centerTop * dpr);
    gl.uniform1f(U.s, unit * dpr);
    if (reduced) draw(0);
  }
  function draw(t) { gl.uniform2f(U.res, canvas.width, canvas.height); gl.uniform1f(U.time, t * 0.001); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
  var running = false, frame = 0;
  function loop(t) { if (!running) return; draw(t); frame = requestAnimationFrame(loop); }
  function start() { if (running || reduced) return; running = true; frame = requestAnimationFrame(loop); }
  function stop() { running = false; if (frame) cancelAnimationFrame(frame); frame = 0; }

  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  if (!reduced) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) start(); else stop(); }); }, { threshold: 0.05 }).observe(stage);
    } else start();
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { if (!running) start(); } else stop(); });
  }
})();

// ========== Glyph Portal (abertura de /sobre) ==========
// Porte em vanilla do Glyph Portal © 2026 Christian Katzmann, MIT (origem:
// UsefulPortal.astro em ktzm.dk). Uma camera guiada pelo scroll atravessa a
// palavra: o clip (texto SVG) escala do tamanho da palavra ate o miolo da
// letra escolhida — a de maior quadrado opaco, medido num canvas — encher a
// tela; o campo verde cresce 16%; a legenda some; o conteudo entra no fim.
// Escala fica no clipPath e a translacao no texto (limites de pintura de texto
// e zoom do WebKit). Sob prefers-reduced-motion: nada pina, tudo visivel.
(function () {
  var gp = document.querySelector('.gp');
  if (!gp) return;
  var pin = gp.querySelector('.gp-pin'), field = gp.querySelector('.gp-field'), art = gp.querySelector('.gp-art');
  var clip = gp.querySelector('#gpClip'), glyph = gp.querySelector('.gp-glyph'), probe = gp.querySelector('.gp-vh');
  if (!pin || !field || !art || !clip || !glyph) return;
  var text = glyph.textContent.trim() || 'AXIS', LEN = 2.4;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
  var W = 1, H = 1, travel = 1, startScale = 1, endScale = 1, center = { x: 0, y: 0 }, target = null, bounds = null;
  var ready = false, dirty = true, active = true, raf = 0;
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
  function smooth(a, b, n) { var t = clamp((n - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  // Maior quadrado opaco da letra, em tempo linear (funciona em O, S e A —
  // um chute pela haste nao). Desenha a 300px e devolve em unidades de 100px.
  function interior(ch, font) {
    ctx.font = font; var m = ctx.measureText(ch), pad = 8;
    var left = Math.ceil(m.actualBoundingBoxLeft), ascent = Math.ceil(m.actualBoundingBoxAscent);
    canvas.width = Math.max(1, Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + pad * 2);
    canvas.height = Math.max(1, Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + pad * 2);
    ctx.font = font; ctx.fontKerning = 'none'; ctx.fillStyle = '#000';
    ctx.fillText(ch, pad + left, pad + ascent);
    var w = canvas.width, h = canvas.height, px = ctx.getImageData(0, 0, w, h).data;
    var rows = new Uint16Array(w + 1), size = 0, bx = 0, by = 0;
    for (var y = 0; y < h; y++) {
      var diag = 0;
      for (var x = 0; x < w; x++) {
        var above = rows[x + 1];
        rows[x + 1] = px[(y * w + x) * 4 + 3] > 245 ? Math.min(above, rows[x], diag) + 1 : 0;
        diag = above;
        if (rows[x + 1] > size) { size = rows[x + 1]; bx = x; by = y; }
      }
    }
    if (size < 3) return null;
    return { x: (bx + 1 - size / 2 - pad - left) / 3, y: (by + 1 - size / 2 - pad - ascent) / 3, radius: (size / 2 - 1) / 3 };
  }
  function readInk() {
    var cs = getComputedStyle(glyph), fam = cs.fontFamily, wt = cs.fontWeight;
    ctx.font = wt + ' 100px ' + fam; ctx.fontKerning = 'none';
    var m = ctx.measureText(text);
    bounds = { x: -m.actualBoundingBoxLeft, y: -m.actualBoundingBoxAscent,
      width: m.actualBoundingBoxLeft + m.actualBoundingBoxRight, height: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent };
    if (!bounds.width || !bounds.height) return false;
    center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    var best = null;
    for (var i = 0; i < text.length; i++) {
      ctx.font = wt + ' 100px ' + fam; ctx.fontKerning = 'none';
      var adv = ctx.measureText(text.slice(0, i)).width;
      var f = interior(text[i], wt + ' 300px ' + fam);
      if (f) { f.x += adv; if (!best || f.radius > best.radius || (f.radius === best.radius && Math.abs(f.x - center.x) < Math.abs(best.x - center.x))) best = f; }
    }
    target = best;
    return true;
  }
  function layout() {
    if (!gp.clientWidth) return;
    W = pin.clientWidth;
    var svh = probe ? probe.offsetHeight : window.innerHeight;
    H = Math.max(1, Math.min(window.innerHeight, svh || window.innerHeight));
    if (motion.matches) H = Math.min(H * 0.75, 480);
    gp.style.setProperty('--gp-h', H + 'px'); travel = H * LEN;
    art.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    if (!ready) ready = readInk();
    if (!ready) return;
    startScale = Math.min(W * 0.84 / bounds.width, H * 0.38 / bounds.height);
    endScale = target ? Math.max(startScale, Math.hypot(W, H) / (target.radius * 1.35)) : startScale;
    gp.style.setProperty('--gp-word-bottom', Math.round(H * 0.46 + bounds.height * startScale / 2) + 'px');
    gp.dataset.gpReady = 'true';
    gp.dataset.gpMotion = (!motion.matches && target) ? 'on' : 'off';
  }
  function position() { return clamp(-gp.getBoundingClientRect().top / travel, 0, 1); }
  function paint(progress) {
    var isStatic = motion.matches || !target;
    var p = isStatic ? 0 : progress, t = clamp(p / 0.78, 0, 1);
    var eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    var scale = Math.exp(Math.log(startScale) + Math.log(endScale / startScale) * eased);
    var blend = endScale === startScale ? 0 : (1 / scale - 1 / startScale) / (1 / endScale - 1 / startScale);
    var tx = target ? target.x : center.x, ty = target ? target.y : center.y;
    var cx = center.x + (tx - center.x) * blend, cy = center.y + (ty - center.y) * blend;
    var roll = -4 * smooth(0.06, 0.5, t) * (1 - smooth(0.62, 0.92, t));
    var rad = roll * Math.PI / 180, dx = W / 2 / scale, dy = (H * 0.46 + H * 0.04 * eased) / scale;
    clip.setAttribute('transform', 'scale(' + scale + ') rotate(' + roll + ')');
    glyph.setAttribute('transform', 'translate(' + (Math.cos(rad) * dx + Math.sin(rad) * dy - cx) + ' ' + (-Math.sin(rad) * dx + Math.cos(rad) * dy - cy) + ')');
    field.style.clipPath = t >= 1 ? 'none' : 'url(#gpClip)';
    gp.style.setProperty('--gp-cap', String(1 - smooth(0.01, 0.16, p)));
    gp.style.setProperty('--gp-reveal', String(isStatic ? 1 : smooth(0.78, 0.9, p)));
    gp.style.setProperty('--gp-fs', String(1 + 0.16 * smooth(0, 0.82, p)));
    gp.style.setProperty('--gp-cap-hit', p < 0.08 ? 'auto' : 'none');
    gp.dataset.gpEntered = String(p >= 0.9);
  }
  function frame() { raf = 0; if (dirty) { dirty = false; layout(); } if (ready) paint(position()); }
  function schedule() { if (!raf && active) raf = requestAnimationFrame(frame); }
  function relayout() { dirty = true; schedule(); }
  function remeasure() { ready = false; relayout(); }   // a fonte chegou: a tinta muda de lugar

  frame();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', relayout);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', relayout);
  if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(gp);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  if (motion.addEventListener) motion.addEventListener('change', relayout);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      active = es[0].isIntersecting;
      if (active) relayout(); else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { rootMargin: '100% 0px' }).observe(gp);
  }
})();

// ========== Bundle de artigos (/ciencia, stack-spread em vanilla) ==========
// Porte do stack-spread (Hyperiux Vault). Os cartoes nascem da lista
// .paper-card (tipo, area, titulo, autores) e vivem em vw/vh no palco
// pegajoso. Progresso do scroll: segura ate 12%, espalha ate 90%, assenta.
// Cada cartao vai de um leque (offset + angulo) ao seu lugar: no desktop, doze
// celulas em volta do texto; no toque (pointer: coarse), uma grade 3x4 sob o
// texto. Depois de espalhado, o ponteiro empurra os cartoes de leve
// (paralaxe por profundidade, com mola simples). Clique leva ao paper na
// lista. Sob prefers-reduced-motion: tudo no lugar final, sem pino.
(function () {
  var ps = document.querySelector('.ps');
  if (!ps) return;
  var stage = ps.querySelector('.ps-stage'), host = ps.querySelector('.ps-cards');
  var papers = [].slice.call(document.querySelectorAll('.paper-card'));
  if (!host || !papers.length) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)');
  var START = 0.12, END = 0.9, PX = 2.6, PY = 2.2, STACK_SCALE = 0.82;

  // Lugares no desktop: grade 5x3 (x em vw, y em vh) sem as tres celulas do meio.
  var DESK = [], xs = [-38, -19, 0, 19, 38], ys = [-26, 0, 34];   // linha de cima livre do header
  ys.forEach(function (y) { xs.forEach(function (x) { if (!(y === 0 && Math.abs(x) < 30)) DESK.push({ x: x, y: y }); }); });
  // No toque: 3 colunas x 4 linhas, abaixo do texto.
  // No toque a grade nasce do fim do texto, medido (offsetTop ignora o scale
  // do .ps-copy): no iPhone o texto descia mais que os vh fixos e os cartoes
  // subiam por cima. A altura do cartao encolhe se as quatro linhas nao couberem.
  var SMALL = [];
  function measureSmall() {
    var copy = ps.querySelector('.ps-copy'), last = copy && copy.lastElementChild;
    var H = stage.clientHeight || window.innerHeight;
    var top = last ? last.offsetTop + last.offsetHeight + 14 : H * 0.45;
    var gap = H * 0.022, rowH = Math.max(56, Math.min(H * 0.12, (H - top - 16 - 3 * gap) / 4));
    ps.style.setProperty('--ps-ch', Math.round(rowH) + 'px');
    SMALL = [];
    for (var r = 0; r < 4; r++) {
      var cy = top + rowH / 2 + r * (rowH + gap);
      [-32, 0, 32].forEach(function (x) { SMALL.push({ x: x, y: (cy / H - 0.5) * 100 }); });
    }
  }

  var cards = papers.map(function (paper, i) {
    var el = document.createElement('div'); el.className = 'ps-card';
    var type = paper.querySelector('.paper-type'), area = paper.querySelector('.paper-area'), h3 = paper.querySelector('h3'), by = paper.querySelector('.paper-authors');
    el.innerHTML = '<div class="ps-meta">' + (type ? '<span class="ps-type">' + type.textContent + '</span>' : '') + (area ? '<span>' + area.textContent + '</span>' : '') + '</div>'
      + '<h3>' + (h3 ? h3.textContent : '') + '</h3>' + (by ? '<p class="ps-by">' + by.textContent + '</p>' : '');
    el.style.zIndex = String(i + 2);
    el.addEventListener('click', function () { paper.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    host.appendChild(el);
    // leque: offsets e angulos espalhados de forma determinista
    var col = i % 4, row = Math.floor(i / 4);
    return {
      el: el,
      stack: { x: -15 + col * 9 + (i % 3) * 2, y: -10 + row * 8 + (i % 2) * 2, r: -18 + ((i * 7) % 36) },
      restR: (i % 2 ? 1 : -1) * (1.5 + (i % 3)),
      depth: papers.length <= 1 ? 1 : 0.55 + (i / (papers.length - 1)) * 0.75
    };
  });

  var small = false, p = 0, spread = false;
  var ptr = { x: 0, y: 0, cx: 0, cy: 0 }, raf = 0, inView = false;
  function readSmall() { small = coarse.matches; ps.dataset.psSmall = String(small); measureSmall(); }
  function progress() {
    var r = ps.getBoundingClientRect(), travel = r.height - window.innerHeight;
    var raw = travel > 0 ? Math.min(1, Math.max(0, -r.top / travel)) : 1;
    return { raw: raw, p: Math.min(1, Math.max(0, (raw - START) / (END - START))) };
  }
  function paint() {
    var pr = reduced ? { raw: 1, p: 1 } : progress();
    p = pr.p;
    var wasSpread = spread; spread = p > 0.985;
    if (spread !== wasSpread) ps.dataset.psSpread = String(spread);
    if (!spread) { ptr.x = ptr.y = 0; }
    ptr.cx += (ptr.x - ptr.cx) * 0.08; ptr.cy += (ptr.y - ptr.cy) * 0.08;
    var drift = (!small && !reduced) ? 1 : 0;
    cards.forEach(function (c, i) {
      var end = small ? SMALL[i % SMALL.length] : DESK[i % DESK.length];
      var tx = c.stack.x + (end.x - c.stack.x) * p, ty = c.stack.y + (end.y - c.stack.y) * p;
      var dx = tx - ptr.cx * PX * c.depth * p * drift, dy = ty - ptr.cy * PY * c.depth * p * drift;
      var rot = reduced ? 0 : c.stack.r + (((small ? 0 : c.restR)) - c.stack.r) * p;
      var sc = STACK_SCALE + (1 - STACK_SCALE) * p;
      c.el.style.transform = 'translate(calc(-50% + ' + dx.toFixed(3) + 'vw), calc(-50% + ' + dy.toFixed(3) + 'vh)) rotate(' + rot.toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')';
    });
    var fade = Math.min(1, Math.max(0, (p - 0.3) / 0.35)), grow = Math.min(1, Math.max(0, (p - 0.3) / 0.6));
    ps.style.setProperty('--ps-copy', fade.toFixed(3));
    ps.style.setProperty('--ps-copy-s', reduced ? '1' : (0.85 + 0.15 * grow).toFixed(4));
    ps.style.setProperty('--ps-hint', (1 - Math.min(1, pr.raw / START)).toFixed(3));
  }
  function loop() {
    raf = 0; paint();
    // a mola do ponteiro continua ate assentar; o scroll agenda o resto
    if (inView && (Math.abs(ptr.x - ptr.cx) > 0.002 || Math.abs(ptr.y - ptr.cy) > 0.002)) raf = requestAnimationFrame(loop);
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(loop); }

  readSmall(); paint();
  if (coarse.addEventListener) coarse.addEventListener('change', function () { readSmall(); schedule(); });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', function () { measureSmall(); schedule(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measureSmall(); schedule(); });
  if (!reduced) {
    window.addEventListener('pointermove', function (e) {
      if (!spread || small || !inView) return;
      ptr.x = (e.clientX / window.innerWidth) * 2 - 1; ptr.y = (e.clientY / window.innerHeight) * 2 - 1; schedule();
    }, { passive: true });
    document.addEventListener('pointerleave', function () { ptr.x = ptr.y = 0; schedule(); });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { inView = es[0].isIntersecting; if (inView) schedule(); }, { rootMargin: '20% 0px' }).observe(ps);
  } else inView = true;
})();

// ========== Filtro de vidro liquido (botoes) ==========
// O backdrop-filter dos .btn aponta para #axis-glass: turbulencia fractal,
// desfocada, desloca o que esta atras do botao (refracao) e desfoca de novo.
// Injetado uma vez no body — um filtro serve a todos os botoes da pagina.
(function () {
  if (document.getElementById('axis-glass')) return;
  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  svg.innerHTML = '<filter id="axis-glass" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">'
    + '<feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="t"/>'
    + '<feGaussianBlur in="t" stdDeviation="2" result="b"/>'
    + '<feDisplacementMap in="SourceGraphic" in2="b" scale="70" xChannelSelector="R" yChannelSelector="B" result="d"/>'
    + '<feGaussianBlur in="d" stdDeviation="4"/></filter>';
  document.body.appendChild(svg);
})();