(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /** PRNG determinista para que las visualizaciones se vean igual siempre. */
  const mulberry32 = (a) => () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /** Ejecuta cb cuando el elemento entra en pantalla (una vez). */
  const onceVisible = (el, cb, threshold = 0.25) => {
    if (!el) return;
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); cb(); }
    }, { threshold });
    io.observe(el);
  };

  /* ───────── Nav: estado, progreso, menú móvil, sección activa ───────── */
  const nav = $('#nav');
  const bar = $('#progress');
  const burger = $('#burger');
  const menu = $('#menu');

  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open);
    menu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('a', menu).forEach((a) => a.addEventListener('click', () => {
    burger.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
    document.body.style.overflow = '';
  }));

  const links = $$('.menu a[href^="#"]');
  const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));

  /* ───────── Reveal ───────── */
  // El hero se revela al cargar: los .line con overflow:hidden esconden el texto del IntersectionObserver.
  $$('.hero .reveal').forEach((el) => setTimeout(() => el.classList.add('in'), 60));
  if (reduced) {
    $$('.reveal').forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').filter((el) => !el.closest('.hero')).forEach((el) => io.observe(el));
  }

  /* ───────── Símbolos matemáticos flotantes (parallax) ───────── */
  (function floatingMath() {
    const glyphs = ['∑', '∫', '∂', 'π', 'λ', 'σ', '∇', '≈', '∞', 'θ', 'ε', '√', '∈', 'μ', 'Δ', 'ℝ'];
    const rnd = mulberry32(31416);
    const perSection = innerWidth < 700 ? 2 : 4;
    $$('.section').forEach((sec) => {
      for (let i = 0; i < perSection; i++) {
        const el = document.createElement('span');
        el.className = 'mf';
        el.setAttribute('aria-hidden', 'true');
        el.textContent = glyphs[Math.floor(rnd() * glyphs.length)];
        const left = i % 2 ? 60 + rnd() * 35 : 2 + rnd() * 30; // alternamos lados
        el.style.left = left.toFixed(1) + '%';
        el.style.top = (18 + rnd() * 72).toFixed(1) + '%';
        el.style.fontSize = (2.4 + rnd() * 3.6).toFixed(2) + 'rem';
        el.dataset.speed = ((rnd() > 0.5 ? 1 : -1) * (0.08 + rnd() * 0.22)).toFixed(2);
        sec.prepend(el);
      }
    });
  })();

  /* ───────── Parallax + scroll (un solo rAF) ───────── */
  const px = $$('[data-speed]').map((el) => ({ el, speed: parseFloat(el.dataset.speed), py: 0 }));
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    const vh = innerHeight;
    nav.classList.toggle('scrolled', y > 24);
    const max = document.documentElement.scrollHeight - vh;
    bar.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
    if (!reduced) {
      for (const p of px) {
        const r = p.el.getBoundingClientRect();
        const center = r.top + r.height / 2 - p.py; // quitamos el offset ya aplicado
        if (center < -vh * 1.5 || center > vh * 2.5) continue;
        p.py = Math.round((center - vh / 2) * p.speed * 10) / 10;
        p.el.style.setProperty('--py', p.py + 'px');
      }
    }
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ───────── Spotlight en tarjetas ───────── */
  $$('[data-spot]').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', e.clientX - r.left + 'px');
      c.style.setProperty('--my', e.clientY - r.top + 'px');
    });
  });

  /* ───────── Roles rotativos ───────── */
  const role = $('#role');
  const roles = ['Riesgo cuantitativo', 'Criptografía', 'Machine learning', 'Series temporales', 'Econometría', 'Álgebra lineal'];
  if (!reduced) {
    const ease = 'cubic-bezier(.2,.7,.2,1)';
    let i = 0;
    setInterval(async () => {
      try {
        role.getAnimations().forEach((a) => a.cancel());
        await role.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-110%)', opacity: 0 }], { duration: 380, easing: ease, fill: 'forwards' }).finished;
        i = (i + 1) % roles.length;
        role.textContent = roles[i];
        role.getAnimations().forEach((a) => a.cancel());
        role.animate([{ transform: 'translateY(110%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: ease });
      } catch { /* animación cancelada (pestaña en segundo plano): se reintenta en el siguiente ciclo */ }
    }, 2600);
  }

  /* ───────── Contadores ───────── */
  $$('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const suf = el.dataset.suffix || '';
    const fmt = (v) => v.toFixed(dec) + suf;
    if (reduced) return;
    el.textContent = fmt(0);
    onceVisible(el, () => {
      const t0 = performance.now(), dur = 1600;
      const step = (t) => {
        const k = clamp((t - t0) / dur, 0, 1);
        el.textContent = fmt(target * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, 0.6);
  });

  /* ───────── Hero: atractor de Lorenz ─────────
     Tres trayectorias; dos empiezan a 1e-4 de distancia: se ven separarse
     (dependencia sensible a condiciones iniciales). */
  (function lorenz() {
    const cv = $('#lorenz');
    const ctx = cv.getContext('2d');
    const hero = $('#inicio');
    const σ = 10, ρ = 28, β = 8 / 3, dt = 0.0055;
    const TRAIL = 4200;
    const palette = [[242, 217, 159], [216, 181, 106], [127, 166, 255]];
    const starts = [[1, 1, 1], [1.0001, 1, 1], [-3, 2, 22]];

    const bodies = starts.map((s) => ({
      p: s.slice(),
      buf: new Float32Array(TRAIL * 3),
      n: 0, head: 0,
    }));

    const step = (b) => {
      const [x, y, z] = b.p;
      // RK2 (punto medio): suficiente y estable a este dt
      const f = (x, y, z) => [σ * (y - x), x * (ρ - z) - y, x * y - β * z];
      const k1 = f(x, y, z);
      const k2 = f(x + k1[0] * dt / 2, y + k1[1] * dt / 2, z + k1[2] * dt / 2);
      b.p = [x + k2[0] * dt, y + k2[1] * dt, z + k2[2] * dt];
      const i = b.head * 3;
      b.buf[i] = b.p[0]; b.buf[i + 1] = b.p[1]; b.buf[i + 2] = b.p[2];
      b.head = (b.head + 1) % TRAIL;
      b.n = Math.min(b.n + 1, TRAIL);
    };
    bodies.forEach((b) => { for (let i = 0; i < 600 + TRAIL; i++) step(b); });

    let W = 0, H = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    addEventListener('pointermove', (e) => {
      mouse.tx = e.clientX / innerWidth - 0.5;
      mouse.ty = e.clientY / innerHeight - 0.5;
    }, { passive: true });

    let t = 0;
    const project = (x, y, z, cosA, sinA, s, cx, cy, tilt) => {
      const X = x * cosA - y * sinA;
      const D = x * sinA + y * cosA;
      return [cx + X * s, cy - (z - 25) * s * 0.95 + D * s * tilt];
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const wide = W > 900;
      const s = Math.min(W * (wide ? 0.019 : 0.024), H * 0.017);
      const cx = W * (wide ? 0.73 : 0.52) + mouse.x * -40;
      const cy = H * 0.5 + mouse.y * -30;
      const ang = t * 0.00022 + mouse.x * 0.7;
      const cosA = Math.cos(ang), sinA = Math.sin(ang);
      const tilt = 0.28 + mouse.y * 0.3;
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';

      bodies.forEach((b, bi) => {
        const [r, g, bl] = palette[bi];
        const CH = 42; // segmentos con alpha creciente
        const per = Math.floor(b.n / CH);
        if (per < 2) return;
        const start = b.n < TRAIL ? 0 : b.head;
        let prev = null;
        for (let c = 0; c < CH; c++) {
          const a = Math.pow((c + 1) / CH, 2.2);
          ctx.strokeStyle = `rgba(${r},${g},${bl},${(a * (bi === 2 ? 0.5 : 0.75)).toFixed(3)})`;
          ctx.lineWidth = 0.6 + a * (bi === 2 ? 0.9 : 1.4);
          ctx.beginPath();
          if (prev) ctx.moveTo(prev[0], prev[1]);
          for (let k = 0; k <= per; k++) {
            const idx = ((start + c * per + k) % TRAIL) * 3;
            if (c * per + k >= b.n) break;
            const pt = project(b.buf[idx], b.buf[idx + 1], b.buf[idx + 2], cosA, sinA, s, cx, cy, tilt);
            if (!prev && k === 0) ctx.moveTo(pt[0], pt[1]); else ctx.lineTo(pt[0], pt[1]);
            prev = pt;
          }
          ctx.stroke();
        }
        // cabeza brillante
        if (prev) {
          const g2 = ctx.createRadialGradient(prev[0], prev[1], 0, prev[0], prev[1], 14);
          g2.addColorStop(0, `rgba(${r},${g},${bl},.9)`);
          g2.addColorStop(1, `rgba(${r},${g},${bl},0)`);
          ctx.fillStyle = g2;
          ctx.beginPath(); ctx.arc(prev[0], prev[1], 14, 0, 6.2832); ctx.fill();
        }
      });
      ctx.globalCompositeOperation = 'source-over';
    };

    resize();
    addEventListener('resize', () => { resize(); if (reduced) draw(); });

    if (reduced) {
      bodies.forEach((b) => { for (let i = 0; i < TRAIL; i++) step(b); });
      draw();
      return;
    }

    let running = true;
    new IntersectionObserver((es) => { running = es[0].isIntersecting; if (running) loop(); }, { threshold: 0 }).observe(hero);
    let raf = 0;
    const loop = () => {
      cancelAnimationFrame(raf);
      if (!running) return;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      t += 16;
      for (let i = 0; i < 4; i++) bodies.forEach(step);
      draw();
      raf = requestAnimationFrame(loop);
    };
    loop();
  })();

  /* ───────── CryptoRisk: retornos + VaR (GARCH(1,1) simulado, t-Student) ───────── */
  (function riskViz() {
    const svg = $('#viz-risk');
    const NS = 'http://www.w3.org/2000/svg';
    let rnd;
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(6.2832 * rnd());
    const tStud = (nu) => { // t con nu g.l., escalada a varianza 1
      let chi = 0; for (let i = 0; i < nu; i++) { const g = gauss(); chi += g * g; }
      return gauss() / Math.sqrt(chi / nu) * Math.sqrt((nu - 2) / nu);
    };

    // GARCH(1,1) simulado. Se busca una semilla con 3–6 excedencias para que la ilustración sea legible.
    const N = 150, ω = 0.05, α = 0.14, b = 0.84, q = 2.33;
    let rets, vars;
    for (let seed = 1; seed < 400; seed++) {
      rnd = mulberry32(seed * 7919);
      let s2 = ω / (1 - α - b);
      rets = []; vars = [];
      for (let i = 0; i < N; i++) {
        const s = Math.sqrt(s2);
        const r = s * tStud(5);
        rets.push(r); vars.push(-q * s);
        s2 = ω + α * r * r + b * s2;
      }
      const hits = rets.filter((r, i) => r < vars[i]).length;
      if (hits >= 3 && hits <= 6) break;
    }

    const W = 600, H = 280, padX = 8, mid = H / 2;
    const mx = Math.max(...rets.map(Math.abs), ...vars.map(Math.abs)) * 1.05;
    const X = (i) => padX + (i / (N - 1)) * (W - padX * 2);
    const Y = (v) => mid - (v / mx) * (H / 2 - 14);
    const el = (n, a, p = svg) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };

    const defs = el('defs', {});
    const gr = el('linearGradient', { id: 'bandGrad', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0', 'stop-color': '#d8b56a', 'stop-opacity': '0.0' }, gr);
    el('stop', { offset: '1', 'stop-color': '#d8b56a', 'stop-opacity': '0.16' }, gr);

    [-1, -.5, 0, .5, 1].forEach((k) => el('line', { class: 'grid', x1: 0, x2: W, y1: mid - k * (H / 2 - 14), y2: mid - k * (H / 2 - 14) }));
    el('text', { class: 'lbl', x: 2, y: 11 }).textContent = 'r(t)';
    el('text', { class: 'lbl', x: W - 2, y: H - 4, 'text-anchor': 'end' }).textContent = 't →';

    // banda debajo de −VaR
    const bandPts = vars.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`);
    el('path', { class: 'band', d: `M${X(0)},${H} L${bandPts.join(' L')} L${X(N - 1)},${H} Z` });

    el('path', { class: 'ret', pathLength: 1, d: rets.map((r, i) => `M${X(i).toFixed(1)},${mid} V${Y(r).toFixed(1)}`).join(' ') });
    el('path', { class: 'var', d: 'M' + bandPts.join(' L') });

    rets.forEach((r, i) => {
      if (r < vars[i]) {
        const c = el('circle', { class: 'hit', cx: X(i), cy: Y(r), r: 3.6 });
        c.style.setProperty('--hd', (2.2 + (i / N) * 1.4).toFixed(2) + 's');
      }
    });

    if (reduced) svg.classList.add('play'); else onceVisible(svg, () => svg.classList.add('play'), 0.35);
  })();

  /* ───────── Entropy Arena: Regla 30 ───────── */
  (function rule30() {
    const cv = $('#viz-rule30');
    const ctx = cv.getContext('2d');
    const CELL = 3, COLS = Math.floor(cv.width / CELL), ROWS = Math.floor(cv.height / CELL);
    let row = new Uint8Array(COLS);
    row[COLS >> 1] = 1;
    let y = 0;

    const drawRow = (r, y) => {
      const age = y / ROWS;
      ctx.fillStyle = `rgba(${Math.round(216 + 26 * (1 - age))},${Math.round(181 + 36 * (1 - age))},${Math.round(106 + 53 * (1 - age))},${(0.95 - age * 0.4).toFixed(2)})`;
      for (let x = 0; x < COLS; x++) if (r[x]) ctx.fillRect(x * CELL, y * CELL, CELL - 0.4, CELL - 0.4);
    };
    const next = (r) => {
      const n = new Uint8Array(COLS);
      for (let x = 1; x < COLS - 1; x++) n[x] = r[x - 1] ^ (r[x] | r[x + 1]); // Regla 30
      return n;
    };
    const reset = () => { ctx.clearRect(0, 0, cv.width, cv.height); row = new Uint8Array(COLS); row[COLS >> 1] = 1; y = 0; };

    if (reduced) { for (y = 0; y < ROWS; y++) { drawRow(row, y); row = next(row); } return; }

    let running = false, last = 0, pause = 0;
    const tick = (t) => {
      if (!running) return;
      if (t - last > 45) {
        last = t;
        if (y < ROWS) { drawRow(row, y); row = next(row); y++; }
        else if ((pause += 45) > 2600) { pause = 0; reset(); }
      }
      requestAnimationFrame(tick);
    };
    new IntersectionObserver((es) => {
      const v = es[0].isIntersecting;
      if (v && !running) { running = true; requestAnimationFrame(tick); } else if (!v) running = false;
    }, { threshold: 0.2 }).observe(cv);
  })();

  /* ───────── RetinoVision: fondo de ojo estilizado ───────── */
  (function retina() {
    const svg = $('#viz-retina');
    const NS = 'http://www.w3.org/2000/svg';
    const rnd = mulberry32(77);
    const el = (n, a, p = svg) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };

    const defs = el('defs', {});
    const bg = el('radialGradient', { id: 'rBg', cx: '.42', cy: '.5', r: '.65' }, defs);
    [['0', '#d2674a'], ['.55', '#a63a25'], ['1', '#3a0f0a']].forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, bg));
    const disc = el('radialGradient', { id: 'rDisc' }, defs);
    [['0', '#fff1c4'], ['.6', '#f1c477'], ['1', 'rgba(241,196,119,0)']].forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, disc));
    const scan = el('linearGradient', { id: 'rScan', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    [['0', 'rgba(216,181,106,0)'], ['.5', 'rgba(216,181,106,.55)'], ['1', 'rgba(216,181,106,0)']].forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, scan));
    const clip = el('clipPath', { id: 'rClip' }, defs);
    el('circle', { cx: 200, cy: 200, r: 188 }, clip);

    el('circle', { cx: 200, cy: 200, r: 195, fill: 'none', stroke: 'rgba(236,231,220,.18)', 'stroke-width': 1 });
    const g = el('g', { 'clip-path': 'url(#rClip)' });
    el('circle', { cx: 200, cy: 200, r: 190, fill: 'url(#rBg)' }, g);

    // vasos: ramificación recursiva desde el disco óptico
    const D = { x: 285, y: 190 };
    const vessels = el('g', { fill: 'none', stroke: '#4a1109', 'stroke-linecap': 'round', opacity: '.9' }, g);
    const branch = (x, y, a, len, w, depth) => {
      if (depth === 0 || w < 0.35) return;
      const a2 = a + (rnd() - 0.5) * 0.5;
      const x2 = x + Math.cos(a2) * len, y2 = y + Math.sin(a2) * len;
      const cx = x + Math.cos(a + (rnd() - 0.5) * 0.4) * len * 0.55, cy = y + Math.sin(a + (rnd() - 0.5) * 0.4) * len * 0.55;
      el('path', { d: `M${x.toFixed(1)},${y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`, 'stroke-width': w.toFixed(2) }, vessels);
      branch(x2, y2, a2 - 0.35 - rnd() * 0.3, len * 0.82, w * 0.72, depth - 1);
      branch(x2, y2, a2 + 0.3 + rnd() * 0.3, len * 0.8, w * 0.7, depth - 1);
      if (rnd() > 0.35) branch(x2, y2, a2 + (rnd() - 0.5) * 0.2, len * 0.9, w * 0.85, depth - 1);
    };
    [Math.PI * 0.82, Math.PI * 1.18, Math.PI * 0.95, Math.PI * 1.05].forEach((a, i) => branch(D.x, D.y, a, 46 + i * 4, 5.2 - i * 0.6, 6));

    el('circle', { cx: D.x, cy: D.y, r: 34, fill: 'url(#rDisc)' }, g);
    el('circle', { cx: 150, cy: 205, r: 18, fill: 'rgba(60,10,5,.35)' }, g); // mácula

    // hallazgos: hemorragias / exudados con marcadores tipo detección
    const spots = [[128, 150, '#5a0f08', 6], [175, 250, '#5a0f08', 5], [110, 240, '#f0cd7c', 4], [205, 128, '#f0cd7c', 5], [160, 190, '#5a0f08', 4]];
    spots.forEach(([x, y, c, r]) => {
      el('circle', { cx: x, cy: y, r, fill: c, opacity: '.95' }, g);
      const gg = el('g', { class: 'lesion', fill: 'none', stroke: '#d8b56a', 'stroke-width': 1.1 }, g);
      const k = r + 8, l = 6;
      el('path', { d: `M${x - k},${y - k + l} v${-l} h${l} M${x + k - l},${y - k} h${l} v${l} M${x + k},${y + k - l} v${l} h${-l} M${x - k + l},${y + k} h${-l} v${-l}` }, gg);
    });

    // línea de escaneo
    el('rect', { class: 'scan', x: 0, y: 0, width: 400, height: 40, fill: 'url(#rScan)' }, g);
  })();

  /* ───────── Certificados: filtro + lightbox ───────── */
  const filters = $$('.filter');
  const certs = $$('.cert');
  filters.forEach((f) => f.addEventListener('click', () => {
    filters.forEach((x) => x.classList.toggle('is-on', x === f));
    const k = f.dataset.filter;
    certs.forEach((c) => c.classList.toggle('hide', k !== 'all' && c.dataset.cat !== k));
  }));

  const lb = $('#lightbox');
  certs.forEach((c) => c.addEventListener('click', () => {
    $('#lbImg').src = c.dataset.img;
    $('#lbImg').alt = 'Certificado: ' + c.dataset.title;
    $('#lbTitle').textContent = c.dataset.title;
    $('#lbPdf').href = c.dataset.pdf;
    const v = $('#lbVerify');
    v.hidden = !c.dataset.verify;
    if (c.dataset.verify) v.href = c.dataset.verify;
    lb.showModal();
  }));
  $('#lbClose').addEventListener('click', () => lb.close());
  lb.addEventListener('click', (e) => { if (!e.target.closest('.lb-inner')) lb.close(); });

  /* ───────── Fórmulas con KaTeX (si no carga, queda el texto plano de respaldo) ───────── */
  addEventListener('DOMContentLoaded', () => {
    if (!window.katex) return;
    $$('.tex[data-tex]').forEach((el) => {
      try { window.katex.render(el.dataset.tex, el, { throwOnError: true, displayMode: false }); }
      catch { /* se conserva el respaldo */ }
    });
  });
})();
