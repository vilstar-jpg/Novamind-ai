/* ============================================================
   NovaMind AI — Main Script
   i18n · Cart · Checkout · Animations · Accessibility · Perf
   ============================================================ */

'use strict';

/* ── 1. CONSTANTS ─────────────────────────────────────────── */
const LANG_KEY  = 'nm_lang';
const THEME_KEY = 'nm_theme';
const CART_KEY  = 'nm_cart';

/* ── 2. STATE ─────────────────────────────────────────────── */
let translations = {};
let currentLang  = localStorage.getItem(LANG_KEY) || 'en';
let cart         = [];

try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { cart = []; }

/* ── 3. i18n ENGINE ───────────────────────────────────────── */
async function loadTranslations(lang) {
  try {
    const res = await fetch('./i18n/' + lang + '.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    translations = await res.json();
    return true;
  } catch (e) {
    console.warn('[i18n] Failed to load', lang, e);
    if (lang !== 'en') return loadTranslations('en');
    return false;
  }
}

function t(key) {
  const parts = key.split('.');
  let val = translations;
  for (const p of parts) {
    if (val == null) return key;
    val = val[p];
  }
  return (val != null && val !== '') ? String(val) : key;
}

function applyTranslations() {
  const lang = translations.lang || 'en';
  const dir  = translations.dir  || 'ltr';

  document.documentElement.lang = lang;
  document.documentElement.dir  = dir;

  // <title>
  const titleEl = document.querySelector('title[data-i18n]');
  if (titleEl) document.title = t(titleEl.dataset.i18n);

  // meta[content]
  document.querySelectorAll('meta[data-i18n]').forEach(function(el) {
    el.content = t(el.dataset.i18n);
  });

  // text content
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    if (el.tagName === 'META' || el.tagName === 'TITLE') return;
    var val = t(el.dataset.i18n);
    if (val !== el.dataset.i18n) el.innerHTML = val;
  });

  // aria-label
  document.querySelectorAll('[data-i18n-aria]').forEach(function(el) {
    var val = t(el.dataset.i18nAria);
    if (val !== el.dataset.i18nAria) el.setAttribute('aria-label', val);
  });

  // placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
    var val = t(el.dataset.i18nPlaceholder);
    if (val !== el.dataset.i18nPlaceholder) el.placeholder = val;
  });

  // year tokens
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Update lang buttons
  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    var active = btn.dataset.lang === lang;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });

  // Re-render cart
  renderCart();
}

async function setLang(lang) {
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  await loadTranslations(lang);
  applyTranslations();

  var url = new URL(window.location.href);
  if (lang === 'en') {
    url.searchParams.delete('lang');
  } else {
    url.searchParams.set('lang', lang);
  }
  history.replaceState(null, '', url.toString());
}

/* ── 4. THEME ─────────────────────────────────────────────── */
function initTheme() {
  var saved = localStorage.getItem(THEME_KEY);
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  var current = document.documentElement.dataset.theme || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ── 5. MOBILE MENU ───────────────────────────────────────── */
function initMobileMenu() {
  var btn  = document.getElementById('menuBtn');
  var menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  function openMenu() {
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', function() {
    menu.hidden ? openMenu() : closeMenu();
  });

  menu.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', function(e) {
    if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !menu.hidden) closeMenu();
  });
}

/* ── 6. CART ──────────────────────────────────────────────── */
function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
}

function getCartTotal() {
  return cart.reduce(function(sum, item) { return sum + item.price * item.qty; }, 0);
}

function updateCartBadge() {
  var badge = document.getElementById('cartBadge');
  var total = cart.reduce(function(sum, i) { return sum + i.qty; }, 0);
  if (!badge) return;
  if (total > 0) {
    badge.textContent = total;
    badge.hidden = false;
  } else {
    badge.hidden = true;
  }
}

function renderCart() {
  var container = document.getElementById('cartItems');
  var totalEl   = document.getElementById('cartTotal');
  var checkBtn  = document.getElementById('checkoutBtn');
  if (!container) return;

  container.querySelectorAll('.cart-item').forEach(function(el) { el.remove(); });

  var emptyMsg = document.getElementById('cartEmpty');

  if (cart.length === 0) {
    if (emptyMsg) {
      emptyMsg.hidden = false;
      emptyMsg.innerHTML = t('cart.empty') || 'Your cart is empty. Browse <a href="#pricing">our products</a>.';
    }
    if (totalEl) totalEl.textContent = '€0';
    if (checkBtn) checkBtn.disabled = true;
    updateCartBadge();
    return;
  }

  if (emptyMsg) emptyMsg.hidden = true;
  if (checkBtn) checkBtn.disabled = false;

  cart.forEach(function(item, idx) {
    var el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML =
      '<div class="ci-info">' +
        '<p class="ci-name">' + item.name + '</p>' +
        '<p class="ci-price">€' + (item.price * item.qty).toFixed(0) + '</p>' +
        '<div class="ci-qty">' +
          '<button type="button" aria-label="' + (t('cart.aria_decrease') || 'Decrease') + '" data-idx="' + idx + '" data-action="dec">−</button>' +
          '<span aria-live="polite">' + item.qty + '</span>' +
          '<button type="button" aria-label="' + (t('cart.aria_increase') || 'Increase') + '" data-idx="' + idx + '" data-action="inc">+</button>' +
        '</div>' +
      '</div>' +
      '<button class="ci-remove" type="button" aria-label="' + (t('cart.remove') || 'Remove') + ' ' + item.name + '" data-idx="' + idx + '" data-action="remove">' + (t('cart.remove') || 'Remove') + '</button>';
    container.appendChild(el);
  });

  var total = getCartTotal();
  if (totalEl) totalEl.textContent = '€' + total.toFixed(0);
  updateCartBadge();

  var payAmount = document.getElementById('payAmount');
  if (payAmount) payAmount.textContent = '€' + total.toFixed(0);
}

function addToCart(name, price) {
  var existing = cart.find(function(i) { return i.name === name; });
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name: name, price: Number(price), qty: 1 });
  }
  saveCart();
  renderCart();
  openCart();
}

function openCart() {
  var drawer  = document.getElementById('cartDrawer');
  var overlay = document.getElementById('cartOverlay');
  if (!drawer || !overlay) return;
  drawer.hidden  = false;
  overlay.hidden = false;
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(function() {
    var first = drawer.querySelector('button, [href], input');
    if (first) first.focus();
  }, 50);
}

function closeCart() {
  var drawer  = document.getElementById('cartDrawer');
  var overlay = document.getElementById('cartOverlay');
  if (!drawer || !overlay) return;
  drawer.hidden  = true;
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  var cartBtn = document.getElementById('cartBtn');
  if (cartBtn) cartBtn.focus();
}

function initCart() {
  var cartBtn      = document.getElementById('cartBtn');
  var cartCloseBtn = document.getElementById('cartCloseBtn');
  var overlay      = document.getElementById('cartOverlay');
  var checkoutBtn  = document.getElementById('checkoutBtn');
  var cartItems    = document.getElementById('cartItems');

  if (cartBtn)      cartBtn.addEventListener('click', openCart);
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
  if (overlay)      overlay.addEventListener('click', closeCart);

  if (cartItems) {
    cartItems.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var idx    = Number(btn.dataset.idx);
      var action = btn.dataset.action;
      if (action === 'inc') {
        cart[idx].qty++;
      } else if (action === 'dec') {
        cart[idx].qty--;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
      } else if (action === 'remove') {
        cart.splice(idx, 1);
      }
      saveCart();
      renderCart();
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function() {
      closeCart();
      openCheckout();
    });
  }

  document.querySelectorAll('.btn-add-cart').forEach(function(btn) {
    btn.addEventListener('click', function() {
      addToCart(btn.dataset.name, btn.dataset.price);
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var drawer = document.getElementById('cartDrawer');
      if (drawer && !drawer.hidden) closeCart();
    }
  });

  renderCart();
}

/* ── 7. CHECKOUT ──────────────────────────────────────────── */
function openCheckout() {
  var modal   = document.getElementById('checkoutModal');
  var overlay = document.getElementById('checkoutOverlay');
  var summary = document.getElementById('checkoutSummary');
  if (!modal || !overlay) return;

  if (summary) {
    var lines = cart.map(function(i) {
      return i.name + ' × ' + i.qty + ' — €' + (i.price * i.qty).toFixed(0);
    }).join('<br>');
    summary.innerHTML = '<strong>' + (t('cart.total') || 'Total') + ': €' + getCartTotal().toFixed(0) + '</strong><br><small style="color:var(--muted)">' + lines + '</small>';
  }

  var payAmount = document.getElementById('payAmount');
  if (payAmount) payAmount.textContent = '€' + getCartTotal().toFixed(0);

  modal.hidden   = false;
  overlay.hidden = false;
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  setTimeout(function() {
    var first = modal.querySelector('input');
    if (first) first.focus();
  }, 50);
}

function closeCheckout() {
  var modal   = document.getElementById('checkoutModal');
  var overlay = document.getElementById('checkoutOverlay');
  if (!modal || !overlay) return;
  modal.hidden   = true;
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  var checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) checkoutBtn.focus();
}

function initCheckout() {
  var closeBtn = document.getElementById('checkoutCloseBtn');
  var overlay  = document.getElementById('checkoutOverlay');
  var form     = document.getElementById('checkoutForm');
  var msg      = document.getElementById('checkoutMsg');

  if (closeBtn) closeBtn.addEventListener('click', closeCheckout);
  if (overlay)  overlay.addEventListener('click', closeCheckout);

  document.addEventListener('keydown', function(e) {
    var modal = document.getElementById('checkoutModal');
    if (e.key === 'Escape' && modal && !modal.hidden) closeCheckout();
  });

  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var name    = (document.getElementById('co-name') || {}).value || '';
      var email   = (document.getElementById('co-email') || {}).value || '';
      var address = (document.getElementById('co-address') || {}).value || '';
      var country = (document.getElementById('co-country') || {}).value || '';
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

      if (!name.trim() || !emailOk || !address.trim() || !country.trim()) {
        if (msg) { msg.textContent = t('checkout.error') || 'Please complete all fields.'; msg.className = 'form-msg err'; }
        return;
      }

      if (msg) {
        msg.textContent = t('checkout.pending') || 'Payment processor connection pending — Eliza will follow up by email.';
        msg.className = 'form-msg ok';
      }

      var payBtn = document.getElementById('payBtn');
      if (payBtn) { payBtn.disabled = true; payBtn.textContent = '✓ Order received'; }
    });
  }
}

/* ── 8. CONTACT FORM ──────────────────────────────────────── */
function initContactForm() {
  var form = document.getElementById('contactForm');
  var msg  = document.getElementById('formMsg');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var name  = (document.getElementById('cf-name') || {}).value || '';
    var email = (document.getElementById('cf-email') || {}).value || '';
    var body  = (document.getElementById('cf-msg') || {}).value || '';
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    if (!name.trim() || !emailOk || !body.trim()) {
      if (msg) { msg.textContent = t('contact.form_error') || 'Please fill in all fields.'; msg.className = 'form-msg err'; }
      return;
    }

    if (msg) { msg.textContent = t('contact.form_success') || 'Thank you! Eliza will respond within 24 hours.'; msg.className = 'form-msg ok'; }
    form.reset();
  });
}

/* ── 9. NEWSLETTER FORM ───────────────────────────────────── */
function initNewsletter() {
  var form = document.getElementById('nlForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var input = form.querySelector('input[type="email"]');
    var btn   = form.querySelector('button[type="submit"]');
    var email = input ? input.value.trim() : '';
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!emailOk) {
      if (input) input.style.borderColor = 'var(--err)';
      return;
    }

    if (btn) { btn.textContent = t('newsletter.success') || '✓ Subscribed!'; btn.disabled = true; }
    form.reset();
  });
}

/* ── 10. SCROLL REVEAL ────────────────────────────────────── */
function initReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(function(el) { el.classList.add('visible'); });
    return;
  }

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
}

/* ── 11. COUNTER ANIMATION ────────────────────────────────── */
function animateCounter(el) {
  var target   = Number(el.dataset.counter);
  var suffix   = el.dataset.suffix || '';
  var duration = 1600;
  var start    = performance.now();

  function step(now) {
    var progress = Math.min((now - start) / duration, 1);
    var ease     = 1 - Math.pow(1 - progress, 3);
    var current  = Math.round(ease * target);
    el.textContent = current.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString() + suffix;
  }

  requestAnimationFrame(step);
}

function initCounters() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-counter]').forEach(function(el) {
      el.textContent = Number(el.dataset.counter).toLocaleString() + (el.dataset.suffix || '');
    });
    return;
  }

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-counter]').forEach(function(el) { observer.observe(el); });
}

/* ── 12. PROGRESS BAR ANIMATION ──────────────────────────── */
function initProgressBars() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.hv-bar span').forEach(function(el) { el.classList.add('animated'); });
    return;
  }

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.hv-bar span').forEach(function(bar) { bar.classList.add('animated'); });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.hv-card').forEach(function(card) { observer.observe(card); });
}

/* ── 13. NEURAL CANVAS ────────────────────────────────────── */
(function initNeuralCanvas() {
  var canvas = document.getElementById('neuralCanvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.display = 'none';
    return;
  }

  var ctx = canvas.getContext('2d');
  var w, h, nodes, raf;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var hero = canvas.closest('.hero');
  var mouse = { x: null, y: null };

  function resize() {
    var rect = hero.getBoundingClientRect();
    w = rect.width; h = rect.height;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.max(20, Math.min(60, Math.floor((w * h) / 22000)));
    nodes = Array.from({ length: count }, function() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 1 + Math.random() * 1.5
      };
    });
  }

  function step() {
    ctx.clearRect(0, 0, w, h);
    var linkDist = Math.min(150, w * 0.14);

    nodes.forEach(function(n) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    });

    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var a = nodes[i], b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var dist = Math.hypot(dx, dy);
        if (dist < linkDist) {
          var alpha = (1 - dist / linkDist) * 0.35;
          ctx.strokeStyle = 'rgba(167,139,250,' + alpha + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      if (mouse.x != null) {
        var mdx = nodes[i].x - mouse.x, mdy = nodes[i].y - mouse.y;
        var mdist = Math.hypot(mdx, mdy);
        if (mdist < 140) {
          ctx.strokeStyle = 'rgba(34,211,238,' + ((1 - mdist / 140) * 0.5) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }

    nodes.forEach(function(n) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34,211,238,0.55)';
      ctx.fill();
    });

    raf = requestAnimationFrame(step);
  }

  hero.addEventListener('mousemove', function(e) {
    var rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  hero.addEventListener('mouseleave', function() { mouse.x = null; mouse.y = null; });

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) cancelAnimationFrame(raf);
    else step();
  });

  resize();
  step();
})();

/* ── 14. DECODE TEXT EFFECT ───────────────────────────────── */
(function initDecodeText() {
  var el = document.getElementById('heroHeadline');
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ01#$%&*+<>/\\';
  var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  var textNodes = [];
  var node;
  while ((node = walker.nextNode())) textNodes.push(node);

  textNodes.forEach(function(tn) {
    var original = tn.textContent;
    var chars = original.split('');
    var revealAt = chars.map(function(_, idx) { return 300 + idx * 28 + Math.random() * 120; });
    var start = performance.now() + 150;

    function tick(now) {
      var elapsed = now - start;
      var allDone = true;
      tn.textContent = chars.map(function(c, idx) {
        if (c === ' ') return c;
        if (elapsed >= revealAt[idx]) return c;
        allDone = false;
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }).join('');
      if (!allDone) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
})();

/* ── 15. BACK TO TOP ──────────────────────────────────────── */
function initBackToTop() {
  var btn = document.getElementById('toTop');
  if (!btn) return;

  window.addEventListener('scroll', function() {
    btn.hidden = window.scrollY < 400;
  }, { passive: true });

  btn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ── 16. STICKY NAV SHADOW ────────────────────────────────── */
function initNavShadow() {
  var nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', function() {
    nav.style.boxShadow = window.scrollY > 10 ? '0 4px 16px rgba(0,0,0,.5)' : 'none';
  }, { passive: true });
}

/* ── 17. SMOOTH SCROLL ────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
}

/* ── 18. ACTIVE NAV LINK ──────────────────────────────────── */
function initActiveNav() {
  var sections = document.querySelectorAll('section[id]');
  var links    = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !links.length) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        links.forEach(function(l) { l.classList.remove('active'); });
        var active = document.querySelector('.nav-links a[href="#' + entry.target.id + '"]');
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(function(s) { observer.observe(s); });
}

/* ── 19. LANGUAGE SWITCHER ────────────────────────────────── */
function initLangSwitcher() {
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.lang-btn');
    if (!btn) return;
    var lang = btn.dataset.lang;
    if (lang && lang !== currentLang) setLang(lang);
  });
}

/* ── 20. THEME TOGGLE ─────────────────────────────────────── */
function initThemeToggle() {
  var btn = document.getElementById('themeToggle');
  if (btn) btn.addEventListener('click', toggleTheme);
}

/* ── 21. INIT ─────────────────────────────────────────────── */
async function init() {
  // Determine lang from URL param or storage
  var urlLang = new URLSearchParams(window.location.search).get('lang');
  if (urlLang && ['en', 'bg'].includes(urlLang)) {
    currentLang = urlLang;
    localStorage.setItem(LANG_KEY, urlLang);
  }

  await loadTranslations(currentLang);
  applyTranslations();

  initTheme();
  initMobileMenu();
  initCart();
  initCheckout();
  initContactForm();
  initNewsletter();
  initLangSwitcher();
  initThemeToggle();
  initReveal();
  initCounters();
  initProgressBars();
  initBackToTop();
  initNavShadow();
  initSmoothScroll();
  if ('IntersectionObserver' in window) initActiveNav();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
