
  // -------- CART + CHECKOUT --------
  const CART_KEY = 'nm-cart';
  const fmt = (n) => '€' + Number(n).toFixed(0);

  const readCart = () => {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
  };
  const writeCart = (items) => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch {}
  };

  const cartBtn = $('#cartBtn');
  const cartBadge = $('#cartBadge');
  const cartOverlay = $('#cartOverlay');
  const cartDrawer = $('#cartDrawer');
  const cartCloseBtn = $('#cartCloseBtn');
  const cartItemsEl = $('#cartItems');
  const cartEmptyEl = $('#cartEmpty');
  const cartTotalEl = $('#cartTotal');
  const checkoutBtn = $('#checkoutBtn');

  const checkoutOverlay = $('#checkoutOverlay');
  const checkoutModal = $('#checkoutModal');
  const checkoutCloseBtn = $('#checkoutCloseBtn');
  const checkoutSummary = $('#checkoutSummary');
  const checkoutForm = $('#checkoutForm');
  const checkoutMsg = $('#checkoutMsg');
  const payAmount = $('#payAmount');
  const payBtn = $('#payBtn');

  function renderCart() {
    const items = readCart();
    const count = items.reduce((s, i) => s + i.qty, 0);
    const total = items.reduce((s, i) => s + i.qty * i.price, 0);

    if (cartBadge) { cartBadge.textContent = String(count); cartBadge.hidden = count === 0; }
    if (cartTotalEl) cartTotalEl.textContent = fmt(total);
    if (checkoutBtn) checkoutBtn.disabled = count === 0;

    if (!cartItemsEl) return;
    if (items.length === 0) {
      cartItemsEl.innerHTML = '<p class="cart-empty" id="cartEmpty">Your cart is empty. Browse <a href="#pricing">our products</a>.</p>';
      return;
    }
    cartItemsEl.innerHTML = items.map((it, idx) => `
      <div class="cart-line" data-idx="${idx}">
        <div class="cart-line-info">
          <span class="cart-line-name">${it.name}</span>
          <span class="cart-line-price">${fmt(it.price)} each</span>
        </div>
        <div class="cart-line-actions">
          <button class="cart-qty-btn" data-action="dec" aria-label="Decrease quantity">−</button>
          <span class="cart-qty">${it.qty}</span>
          <button class="cart-qty-btn" data-action="inc" aria-label="Increase quantity">+</button>
          <button class="cart-remove" data-action="remove">Remove</button>
        </div>
      </div>
    `).join('');
  }

  function addToCart(name, price) {
    const items = readCart();
    const existing = items.find(i => i.name === name);
    if (existing) existing.qty += 1;
    else items.push({ name, price, qty: 1 });
    writeCart(items);
    renderCart();
    openCart();
  }

  function openCart() {
    if (!cartDrawer || !cartOverlay) return;
    cartOverlay.hidden = false; cartDrawer.hidden = false;
    requestAnimationFrame(() => { cartOverlay.classList.add('show'); cartDrawer.classList.add('show'); });
  }
  function closeCart() {
    if (!cartDrawer || !cartOverlay) return;
    cartOverlay.classList.remove('show'); cartDrawer.classList.remove('show');
    setTimeout(() => { cartOverlay.hidden = true; cartDrawer.hidden = true; }, 260);
  }

  $$('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      addToCart(btn.dataset.name, parseFloat(btn.dataset.price));
    });
  });
  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  if (cartItemsEl) {
    cartItemsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const line = btn.closest('.cart-line');
      const idx = Number(line.dataset.idx);
      const items = readCart();
      if (btn.dataset.action === 'inc') items[idx].qty += 1;
      if (btn.dataset.action === 'dec') { items[idx].qty -= 1; if (items[idx].qty <= 0) items.splice(idx, 1); }
      if (btn.dataset.action === 'remove') items.splice(idx, 1);
      writeCart(items);
      renderCart();
    });
  }

  function openCheckout() {
    const items = readCart();
    if (items.length === 0) return;
    const total = items.reduce((s, i) => s + i.qty * i.price, 0);
    checkoutSummary.innerHTML = items.map(i => `
      <div class="co-line"><span>${i.name} × ${i.qty}</span><span>${fmt(i.price * i.qty)}</span></div>
    `).join('') + `<div class="co-line co-total"><span>Total</span><span>${fmt(total)}</span></div>`;
    payAmount.textContent = fmt(total);
    closeCart();
    checkoutOverlay.hidden = false; checkoutModal.hidden = false;
    requestAnimationFrame(() => { checkoutOverlay.classList.add('show'); checkoutModal.classList.add('show'); });
  }
  function closeCheckout() {
    checkoutOverlay.classList.remove('show'); checkoutModal.classList.remove('show');
    setTimeout(() => { checkoutOverlay.hidden = true; checkoutModal.hidden = true; }, 260);
  }
  if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckout);
  if (checkoutCloseBtn) checkoutCloseBtn.addEventListener('click', closeCheckout);
  if (checkoutOverlay) checkoutOverlay.addEventListener('click', closeCheckout);

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#co-name').value.trim();
      const email = $('#co-email').value.trim();
      const address = $('#co-address').value.trim();
      const country = $('#co-country').value.trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!name || !emailOk || !address || !country) {
        checkoutMsg.textContent = 'Please complete all fields with a valid email address.';
        checkoutMsg.classList.add('error');
        return;
      }
      checkoutMsg.classList.remove('error');
      payBtn.disabled = true;
      checkoutMsg.textContent = 'Payment processor connection pending final bank approval — your order details are saved and Eliza will follow up by email to confirm delivery.';
    });
  }

  renderCart();

  // -------- HERO NEURAL NETWORK CANVAS --------
  (function initNeuralCanvas() {
    const canvas = document.getElementById('neuralCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let nodes = [];
    const hero = canvas.closest('.hero');
    const mouse = { x: null, y: null };

    function resize() {
      const rect = hero.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(24, Math.min(60, Math.floor((w * h) / 22000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 1 + Math.random() * 1.6
      }));
    }

    function step() {
      ctx.clearRect(0, 0, w, h);
      const linkDist = Math.min(150, w * 0.14);

      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDist) {
            const alpha = (1 - dist / linkDist) * 0.35;
            ctx.strokeStyle = `rgba(167,139,250,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        if (mouse.x != null) {
          const dx = nodes[i].x - mouse.x, dy = nodes[i].y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 140) {
            ctx.strokeStyle = `rgba(34,211,238,${(1 - dist / 140) * 0.5})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34,211,238,0.55)';
        ctx.fill();
      }

      if (!reduceMotion) requestAnimationFrame(step);
    }

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

    window.addEventListener('resize', resize);
    resize();
    if (reduceMotion) { step(); } else { requestAnimationFrame(step); }
  })();

  // -------- DECODE / SCRAMBLE TEXT EFFECT --------
  (function initDecodeText() {
    const el = document.getElementById('heroHeadline');
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ01#$%&*+<>/\\';
    // Walk text nodes (preserves the .grad-text span markup/styling untouched)
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) textNodes.push(node);

    textNodes.forEach((tn) => {
      const original = tn.textContent;
      const frame = { i: 0 };
      const chars = original.split('');
      const revealAt = chars.map((_, idx) => 300 + idx * 28 + Math.random() * 120);
      const start = performance.now() + 150;

      function tick(now) {
        const elapsed = now - start;
        let allDone = true;
        tn.textContent = chars.map((c, idx) => {
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
