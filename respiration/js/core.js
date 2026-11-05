/* مختبر فسلجة التنفس — أدوات مشتركة */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const L = (window.Lab = {});
  L.$ = (s, r = document) => r.querySelector(s);
  L.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  L.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  L.lerp = (a, b, t) => a + (b - a) * t;
  L.ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  L.reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  L.f = (v, d = 1) => (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);

  /* SVG element helper */
  L.svg = function (tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) {
      if (k === 'text') e.textContent = attrs[k];
      else if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    }
    if ((tag === 'text' || tag === 'tspan') && attrs && attrs.text !== undefined) L.bidi(e);
    if (parent) parent.appendChild(e);
    return e;
  };
  /* نص SVG مختلط (عربي + أرقام/لاتيني): يُعزل باتجاه اليمين لليسار (RLI…PDI) دون تغيير موضع الربط */
  const AR = /[\u0600-\u06FF]/, LT = /[0-9A-Za-z\u2080-\u209C%=+−≈→]/;
  L.bidi = function (el) {
    const s = el.textContent.replace(/[\u2067\u2069]/g, '');
    el.textContent = AR.test(s) && LT.test(s) ? '\u2067' + s + '\u2069' : s;
  };
  L.setText = function (el, s) { s = String(s); if (el.__raw !== s) { el.__raw = s; el.textContent = s; L.bidi(el); } };
  L.arrowDefs = function (svg, id, color) {
    let defs = svg.querySelector('defs') || L.svg('defs', {}, svg);
    const m = L.svg('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    L.svg('path', { d: 'M0 0L10 5L0 10z', style: `fill:${color}` }, m);
    return `url(#${id})`;
  };

  /* theme colours for canvas drawing */
  const C = {};
  const names = ['paper', 'surface', 'surface-2', 'ink', 'ink-2', 'muted', 'line', 'accent', 'accent-soft', 'o2', 'o2-soft', 'co2', 'co2-soft', 'hl', 'pen', 'tissue', 'tissue-2', 'bone'];
  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    names.forEach(n => (C[n] = cs.getPropertyValue('--' + n).trim()));
  }
  readColors();
  L.C = C;
  L.onTheme = [];
  const themeChanged = () => { readColors(); L.onTheme.forEach(fn => { try { fn(); } catch (e) {} }); };
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', themeChanged); else if (mq.addListener) mq.addListener(themeChanged);
  }
  new MutationObserver(themeChanged).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });

  /* visibility-gated animation loop */
  L.loop = function (el, step) {
    let vis = false, raf = 0, last = 0;
    function tick(t) {
      raf = 0;
      if (!vis || document.hidden) return;
      if (L.navigating && Date.now() - L.navigating < 500) { last = t; raf = requestAnimationFrame(tick); return; }
      const dt = Math.max(0, Math.min(0.05, (t - last) / 1000 || 0));
      last = t;
      step(dt, t / 1000);
      raf = requestAnimationFrame(tick);
    }
    function start() { if (!raf && vis && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { vis = es[es.length - 1].isIntersecting; start(); }, { rootMargin: '120px' }).observe(el);
    } else { vis = true; start(); }
    document.addEventListener('visibilitychange', start);
    return { kick() { step(0, performance.now() / 1000); } };
  };

  /* segmented control */
  L.seg = function (el, cb) {
    const btns = L.$$('button', el);
    function set(v, fire = true) {
      btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(v))));
      if (fire && cb) cb(String(v));
    }
    btns.forEach(b => b.addEventListener('click', () => set(b.dataset.v)));
    return set;
  };
  /* range input with live value */
  L.range = function (id, cb, fmt) {
    const inp = document.getElementById(id), out = document.getElementById(id + 'V');
    function upd(fire = true) {
      const v = +inp.value;
      if (out) out.textContent = fmt ? fmt(v) : v;
      if (fire && cb) cb(v);
    }
    inp.addEventListener('input', () => upd());
    upd(false);
    return { el: inp, get: () => +inp.value, set(v, fire = true) { inp.value = v; upd(fire); } };
  };
  /* readout tiles */
  L.readout = function (el, defs) {
    el.innerHTML = defs.map(d => `<div class="ro ${d.cls || ''}"><span>${d.label}</span><b data-k="${d.k}">—</b></div>`).join('');
    const m = {};
    defs.forEach(d => (m[d.k] = el.querySelector(`[data-k="${d.k}"]`)));
    return (k, v) => { const e = m[k]; if (!e || e.textContent === String(v)) return; e.textContent = v; e.style.direction = /[\u0600-\u06FF]/.test(String(v)) ? 'rtl' : ''; };
  };
  /* HiDPI canvas */
  L.canvas = function (cv, onResize) {
    const ctx = cv.getContext('2d');
    const st = { ctx, w: 0, h: 0, dpr: 1 };
    function resize(init) {
      const r = cv.getBoundingClientRect();
      st.dpr = Math.min(2, window.devicePixelRatio || 1);
      st.w = Math.max(10, r.width);
      st.h = +cv.getAttribute('height') || r.height;
      cv.style.height = st.h + 'px';
      cv.width = Math.round(st.w * st.dpr);
      cv.height = Math.round(st.h * st.dpr);
      ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
      if (onResize && init !== true) onResize();
    }
    st.h = +cv.getAttribute('height') || 200;
    if ('ResizeObserver' in window) new ResizeObserver(() => resize()).observe(cv); else window.addEventListener('resize', () => resize());
    resize(true);
    st.resize = resize;
    return st;
  };
  /* monotone cubic interpolation (Fritsch–Carlson) */
  L.monotone = function (xs, ys) {
    const n = xs.length, dx = [], m = [], t = new Array(n);
    for (let i = 0; i < n - 1; i++) { dx[i] = xs[i + 1] - xs[i]; m[i] = (ys[i + 1] - ys[i]) / dx[i]; }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = t[i + 1] = 0; continue; }
      const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
      if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
    }
    return x => {
      if (x <= xs[0]) return ys[0];
      if (x >= xs[n - 1]) return ys[n - 1];
      let i = 0;
      while (x > xs[i + 1]) i++;
      const h = dx[i], s = (x - xs[i]) / h, s2 = s * s, s3 = s2 * s;
      return (2 * s3 - 3 * s2 + 1) * ys[i] + (s3 - 2 * s2 + s) * h * t[i] + (-2 * s3 + 3 * s2) * ys[i + 1] + (s3 - s2) * h * t[i + 1];
    };
  };

  /* منحني افتراق الأوكسجين من جدول الكتاب (شكل 3-7) */
  L.ODC_P = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  L.ODC_S = [0, 13.5, 35, 57, 75, 83.5, 89, 92.7, 94.5, 96.5, 97.5];
  const odcBase = L.monotone(L.ODC_P, L.ODC_S);
  L.odc = function (P) {
    if (P <= 100) return Math.max(0, odcBase(P));
    return 97.5 + 2.2 * (1 - Math.exp(-(P - 100) / 45));
  };
  /* k > 1 يزيح المنحني إلى اليمين (ألفة أقل) */
  L.odcShift = (P, k) => L.odc(P / k);
  L.bohrK = (T, pco2, pH) => Math.pow(10, 0.024 * (T - 38) + 0.48 * (7.4 - pH) + 0.1 * Math.log10(pco2 / 40));
  L.P50 = (function () { let lo = 0, hi = 100; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (L.odc(m) < 50) lo = m; else hi = m; } return (lo + hi) / 2; })();

  /* seeded random */
  L.rnd = function (seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

  /* ---------------- navigation ---------------- */
  function initNav() {
    const toc = L.$('#toc'), btn = L.$('#tocBtn'), prog = L.$('#progress'), topSec = L.$('#topSec');
    let scrim = null;
    function close() { toc.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); if (scrim) { scrim.remove(); scrim = null; } }
    btn.addEventListener('click', () => {
      const open = !toc.classList.contains('open');
      if (!open) return close();
      toc.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
      scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.addEventListener('click', close); document.body.appendChild(scrim);
    });
    L.$$('a', toc).forEach(a => a.addEventListener('click', close));
    /* التنقل داخل الصفحة بالسكربت: يعمل داخل الإطارات ومع تغيّر ارتفاع المحتوى أثناء التمرير */
    // قفزة فورية: نلغي التمرير الناعم مؤقتاً لأن سفاري يرتد ويُظهر صفحة بيضاء مع المسافات الطويلة
    const html = document.documentElement;
    function jump(y) {
      const prev = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      window.scrollTo(0, y);
      html.style.scrollBehavior = prev;
    }
    function go(id) {
      const el = document.getElementById(id); if (!el) return;
      const bar = L.$('.topbar'), off = (bar ? bar.offsetHeight : 60) + 12;
      const target = () => (id === 'top' ? 0 : Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - off)));
      const near = Math.abs(target() - window.scrollY) < window.innerHeight * 1.5 && !L.reduce;
      L.navigating = Date.now();
      if (near && 'scrollBehavior' in html.style) window.scrollTo({ top: target(), behavior: 'smooth' });
      else jump(target());
      let tries = 0;
      const fix = () => {
        L.navigating = Date.now();
        if (Math.abs(target() - window.scrollY) > 6) jump(target());
        if (++tries < 4) setTimeout(fix, 350);
      };
      setTimeout(fix, near ? 700 : 60);
      try { history.replaceState(null, '', '#' + id); } catch (e) {}
    }
    L.go = go;
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault(); close(); go(id);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    const links = new Map(L.$$('a', toc).map(a => [a.getAttribute('href').slice(1), a]));
    const secs = L.$$('main .sec');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => {
        es.forEach(e => {
          if (!e.isIntersecting) return;
          links.forEach(a => a.classList.remove('on'));
          const a = links.get(e.target.id); if (a) a.classList.add('on');
          topSec.textContent = e.target.dataset.title || '';
        });
      }, { rootMargin: '-35% 0px -60% 0px' });
      secs.forEach(s => io.observe(s));
    }
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0).toFixed(2) + '%';
      if (window.scrollY < 300) topSec.textContent = 'الفصل الثالث';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  /* نوع الخط: نسخ (افتراضي) / القاهرة / المراعي */
  const FONTS = [['naskh', 'نسخ'], ['cairo', 'القاهرة'], ['almarai', 'المراعي']];
  function setFont(k) {
    const f = FONTS.find(x => x[0] === k) || FONTS[0];
    if (f[0] === 'naskh') document.documentElement.removeAttribute('data-font'); else document.documentElement.setAttribute('data-font', f[0]);
    const n = document.getElementById('fontName'); if (n) n.textContent = f[1];
    try { localStorage.setItem('resp-font', f[0]); } catch (e) {}
  }
  let saved = null; try { saved = localStorage.getItem('resp-font'); } catch (e) {}
  if (saved && saved !== 'naskh') document.documentElement.setAttribute('data-font', saved);
  function initFont() {
    const b = document.getElementById('fontBtn'); if (!b) return;
    setFont(saved || 'naskh');
    b.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-font') || 'naskh';
      const i = FONTS.findIndex(x => x[0] === cur);
      setFont(FONTS[(i + 1) % FONTS.length][0]);
    });
  }
  L.ready = [];
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initFont();
    L.ready.forEach(fn => { try { fn(); } catch (err) { console.error(err); } });
  });
})();
