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
      var isMobile = window.matchMedia('(max-width: 720px)').matches;
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

  // Marca link ativo pela pagina atual
  var path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (
      (path === '/' || path.endsWith('/index.html')) && (href === '/' || href === 'index.html' || href === '/index.html')
    ) {
      a.classList.add('active');
    } else if (href !== '/' && href !== 'index.html' && href !== '/index.html' && path.indexOf(href.replace('./', '').replace('/', '')) !== -1) {
      a.classList.add('active');
    }
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
    var animateCounter = function (el) {
      var target = parseInt(el.dataset.target, 10);
      var prefix = el.dataset.prefix || '';
      var suffix = el.dataset.suffix || '';
      if (prefersReducedMotion) {
        el.innerHTML = affix(prefix) + target + affix(suffix);
        return;
      }
      var duration = 1400;
      var start = performance.now();
      var tick = function (now) {
        var elapsed = now - start;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = Math.round(target * eased);
        el.innerHTML = affix(prefix) + current + affix(suffix);
        if (progress < 1) requestAnimationFrame(tick);
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
      var body = [
        'Nome: ' + g('nome') + ' ' + g('sobrenome'),
        'E-mail: ' + g('email'),
        'WhatsApp/Telefone: ' + g('telefone'),
        'Cidade: ' + g('cidade'),
        'Assunto: ' + assunto,
        '',
        'Mensagem:',
        g('mensagem')
      ].join('\n');
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
    var nhNodes = [].slice.call(nhVisual.querySelectorAll('.nh-node'));
    if (nhTip && nhConn && nhNodes.length) {
      var nhTouch = window.matchMedia && window.matchMedia('(hover: none)').matches;
      if (nhHint) { var hs = nhHint.querySelector('span'); if (hs) hs.textContent = nhTouch ? 'Toque nos pontos' : 'Passe o mouse pelos pontos'; }
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
        if (nhHint) nhHint.classList.add('is-hidden');
      };
      var nhHide = function (node) {
        if (node) node.classList.remove('is-active');
        if (nhActive === node || !node) nhActive = null;
        nhTip.classList.remove('is-on');
        nhConn.classList.remove('is-on');
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
