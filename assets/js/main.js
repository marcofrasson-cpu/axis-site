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

  // Header sombra ao scroll
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 20) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
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
})();
