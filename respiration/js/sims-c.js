/* المحاكاة: الأقسام 9–12 */
(function () {
  'use strict';
  const L = window.Lab, S = L.svg, $ = L.$;
  const CAP = 15 * 1.3; // سعة الأوكسجين لـ 15 غم هيموكلوبين (سم³/100 سم³)

  /* ============ 9. معدل التهوية ============ */
  function vqSim() {
    const svg = $('#vq'); svg.style.direction = 'ltr';
    const X0 = 30, X1 = 490, MAX = 2, X = v => X0 + (L.clamp(v, 0, MAX) / MAX) * (X1 - X0);
    const g = S('g', {}, svg);
    S('rect', { x: X0, y: 34, width: X(0.7) - X0, height: 16, rx: 4, style: 'fill:var(--co2-soft)' }, g);
    S('rect', { x: X(0.7), y: 34, width: X(0.9) - X(0.7), height: 16, style: 'fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5' }, g);
    S('rect', { x: X(0.9), y: 34, width: X1 - X(0.9), height: 16, rx: 4, style: 'fill:var(--surface-2)' }, g);
    for (let v = 0; v <= MAX + 0.001; v += 0.5) {
      S('line', { x1: X(v), y1: 50, x2: X(v), y2: 56, class: 'sv-line' }, g);
      S('text', { x: X(v), y: 68, 'text-anchor': 'middle', class: 'sv-num', text: v.toFixed(1) }, g);
    }
    S('text', { x: X(0.8), y: 26, 'text-anchor': 'middle', class: 'sv-sm', style: 'font-weight:700;fill:var(--accent)', text: '0.8 المثالية' }, g);
    const mk = S('g', {}, svg);
    S('path', { d: 'M0 0l-8 -12h16z', style: 'fill:var(--ink)' }, mk);
    const val = S('text', { x: 0, y: -16, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-family:var(--f-mono);font-weight:700' }, mk);
    const txt = S('text', { x: 260, y: 96, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:600' }, svg);
    let A = 4.2, Q = 5;
    function upd() {
      const r = A / Q;
      mk.setAttribute('transform', `translate(${X(r).toFixed(1)} 33)`);
      val.textContent = L.f(r, 2);
      txt.textContent = r < 0.7 ? 'الهواء أقل من أن يؤكسج كل الدم المار بالرئتين' : r > 0.9 ? 'هواء أكثر مما يحتاجه الدم المار بالرئتين' : 'قريب من 0.8: أكسجة فعالة للدم';
      txt.style.fill = r < 0.7 ? 'var(--co2)' : r > 0.9 ? 'var(--muted)' : 'var(--accent)';
    }
    L.range('vqA', v => { A = v; upd(); }, v => v.toFixed(1));
    L.range('vqQ', v => { Q = v; upd(); }, v => v.toFixed(1));
    upd();
  }

  /* ============ 9. جدول 3-2 (قانون دالتون) ============ */
  function daltonSim() {
    const svg = $('#dalton'); svg.style.direction = 'ltr';
    const G = [
      { k: 'o2', n: 'أوكسجين', f: 'O₂', p: 13.6, mm: 104, c: 'var(--o2)' },
      { k: 'co2', n: 'ثاني أوكسيد الكاربون', f: 'CO₂', p: 5.3, mm: 40, c: 'var(--co2)' },
      { k: 'h2o', n: 'ماء (بخار)', f: 'H₂O', p: 6.2, mm: 47, c: 'var(--accent)' },
      { k: 'n2', n: 'نايتروجين', f: 'N₂', p: 74.9, mm: 569, c: 'var(--muted)' }
    ];
    const X0 = 20, W = 480;
    let x = X0, sel = 'o2';
    const tb = $('#daltonTbl tbody'), msg = $('#daltonMsg');
    G.forEach(g => {
      g.x = x; g.w = (g.p / 100) * W; x += g.w;
      const cx = g.x + g.w / 2;
      g.el = S('g', { class: 'hot', 'data-k': g.k }, svg);
      S('rect', { x: g.x, y: 40, width: g.w, height: 46, style: `fill:${g.c};opacity:.85;stroke:var(--surface);stroke-width:2` }, g.el);
      if (g.w > 80) {
        S('text', { x: cx, y: 68, 'text-anchor': 'middle', class: 'sv-lbl', style: 'fill:var(--surface);font-weight:700;font-family:var(--f-mono)', text: `${g.f}  ${g.mm}` }, g.el);
      } else {
        S('text', { x: cx, y: 32, 'text-anchor': 'middle', class: 'sv-sm', style: `font-weight:700;fill:${g.c}`, text: g.f }, g.el);
        S('text', { x: cx, y: 104, 'text-anchor': 'middle', class: 'sv-num', style: 'font-weight:700', text: g.mm }, g.el);
      }
      g.el.addEventListener('click', () => pick(g.k));
      const tr = document.createElement('tr');
      tr.dataset.k = g.k; tr.style.cursor = 'pointer';
      tr.innerHTML = `<td>${g.n} <span class="en">${g.f}</span></td><td class="n">${g.p}</td><td class="n"><b>${g.mm}</b></td>`;
      tr.addEventListener('click', () => pick(g.k));
      tb.appendChild(tr);
    });
    S('path', { d: `M${X0} 116v6h${W}v-6`, style: 'fill:none;stroke:var(--ink-2);stroke-width:1.5' }, svg);
    S('text', { x: X0 + W / 2, y: 140, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700', text: 'المجموع = 100% = 760 ملم زئبق' }, svg);
    function pick(k) {
      sel = k;
      const g = G.find(q => q.k === k);
      G.forEach(q => { q.el.style.opacity = q.k === k ? 1 : 0.35; });
      L.$$('tr', tb).forEach(r => r.classList.toggle('on', r.dataset.k === k));
      msg.className = 'status';
      msg.innerHTML = `<b>الضغط الجزئي لـ${g.n}</b> = نسبته في الهواء × الضغط الكلي = ${g.p}% × 760 ≈ <mark>${g.mm} ملم زئبق</mark>. ` +
        (k === 'o2' ? 'وهذا الضغط العالي هو الذي يدفع الأوكسجين من الأسناخ إلى الدم.' : k === 'co2' ? 'وهذا هو PCO₂ في الأسناخ (40)، ويبقى واطئاً وثابتاً في الراحة.' : k === 'n2' ? 'النايتروجين أكبر نسبة، لكنه لا يشترك في التبادل الغازي.' : 'الهواء في الأسناخ مشبع ببخار الماء.');
    }
    pick('o2');
  }

  /* ============ 9. تهوية الغرفة (غير داخل في الامتحان) ============ */
  function roomSim() {
    const ro = L.readout($('#roomRO'), [{ k: 'v', label: 'حجم الغرفة (م³)' }, { k: 'o', label: 'أوكسجين يمكن استهلاكه (لتر)', cls: 'o2' }, { k: 'd', label: 'يكفي لمدة', cls: 'ac' }]);
    let l = 3, w = 3, p = 1;
    function upd() {
      const V = l * w * 2.7, O = V * 1000 * (0.21 - 0.12), days = O / (360 * p);
      ro('v', L.f(V, 1)); ro('o', Math.round(O).toLocaleString('en'));
      ro('d', days >= 1 ? L.f(days, 1) + ' يوم' : Math.round(days * 24) + ' ساعة');
    }
    L.range('roomL', v => { l = v; upd(); });
    L.range('roomW', v => { w = v; upd(); });
    L.range('roomP', v => { p = v; upd(); });
    upd();
  }

  /* أدوات رسم المنحني */
  function plotFrame(svg, o) {
    const P = { x0: 66, x1: 500, y0: 34, y1: 344 };
    const X = p => P.x0 + (p / 100) * (P.x1 - P.x0), Y = s => P.y1 - (s / 100) * (P.y1 - P.y0);
    const g = S('g', {}, svg);
    for (let s = 0; s <= 100; s += 20) {
      S('line', { x1: P.x0, y1: Y(s), x2: P.x1, y2: Y(s), class: 'sv-grid' }, g);
      S('text', { x: P.x0 - 8, y: Y(s) + 4, 'text-anchor': 'end', class: 'sv-num', text: s }, g);
    }
    for (let p = 0; p <= 100; p += 10) {
      S('line', { x1: X(p), y1: P.y1, x2: X(p), y2: P.y1 + 5, class: 'sv-line' }, g);
      S('text', { x: X(p), y: P.y1 + 19, 'text-anchor': 'middle', class: 'sv-num', text: p }, g);
    }
    S('rect', { x: P.x0, y: P.y0, width: P.x1 - P.x0, height: P.y1 - P.y0, style: 'fill:none;stroke:var(--ink-2);stroke-width:1.5' }, g);
    S('text', { x: (P.x0 + P.x1) / 2, y: 392, 'text-anchor': 'middle', class: 'sv-sm', style: 'font-weight:600', text: 'الضغط الجزئي للأوكسجين PO₂ (ملم زئبق)' }, g);
    S('text', { x: 0, y: 0, transform: `translate(18 ${(P.y0 + P.y1) / 2}) rotate(-90)`, 'text-anchor': 'middle', class: 'sv-sm', style: 'font-weight:600', text: 'نسبة تشبع الهيموكلوبين %' }, g);
    if (o && o.content) {
      for (let c = 0; c <= 20; c += 5) {
        const y = Y((c / CAP) * 100);
        if (y < P.y0 - 1) continue;
        S('line', { x1: P.x1, y1: y, x2: P.x1 + 5, y2: y, class: 'sv-line' }, g);
        S('text', { x: P.x1 + 9, y: y + 4, class: 'sv-num', text: c }, g);
      }
      S('text', { x: 0, y: 0, transform: `translate(548 ${(P.y0 + P.y1) / 2}) rotate(90)`, 'text-anchor': 'middle', class: 'sv-sm', text: 'المحتوى (سم³/100 سم³ دم)' }, g);
    }
    return { P, X, Y };
  }
  function curvePath(X, Y, fn) {
    let d = '';
    for (let p = 0; p <= 100; p += 1) d += (p ? 'L' : 'M') + X(p).toFixed(1) + ' ' + Y(fn(p)).toFixed(1);
    return d;
  }
  function svgPoint(svg, e) {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  /* ============ 10. منحني افتراق الأوكسجين ============ */
  function odcSim() {
    const svg = $('#odc'); svg.style.direction = 'ltr';
    const { P, X, Y } = plotFrame(svg, { content: true });
    // مناطق
    S('rect', { x: X(70), y: P.y0, width: X(100) - X(70), height: P.y1 - P.y0, style: 'fill:var(--o2-soft);opacity:.45' }, svg);
    S('rect', { x: X(10), y: P.y0, width: X(40) - X(10), height: P.y1 - P.y0, style: 'fill:var(--co2-soft);opacity:.45' }, svg);
    S('text', { x: X(85), y: P.y1 - 12, 'text-anchor': 'middle', class: 'sv-sm', style: 'font-weight:700;fill:var(--o2)', text: 'منبسط: تحميل في الرئتين' }, svg);
    S('text', { x: X(25), y: P.y1 - 12, 'text-anchor': 'middle', class: 'sv-sm', style: 'font-weight:700;fill:var(--co2)', text: 'حاد: تحرير في الأنسجة' }, svg);
    S('path', { d: curvePath(X, Y, L.odc), style: 'fill:none;stroke:var(--o2);stroke-width:3.2;stroke-linejoin:round' }, svg);
    L.ODC_P.forEach((p, i) => S('circle', { cx: X(p), cy: Y(L.ODC_S[i]), r: 3.2, style: 'fill:var(--surface);stroke:var(--ink-2);stroke-width:1.5' }, svg));
    // النقطتان أ و ب
    [[100, 'أ'], [40, 'ب']].forEach(([p, t]) => {
      S('circle', { cx: X(p), cy: Y(L.odc(p)), r: 5, style: 'fill:var(--ink)' }, svg);
      S('text', { x: X(p) + (p === 100 ? -12 : -14), y: Y(L.odc(p)) - 10, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700', text: t }, svg);
    });
    const gx = S('line', { style: 'stroke:var(--ink);stroke-width:1.3;stroke-dasharray:4 4' }, svg);
    const gy = S('line', { style: 'stroke:var(--ink);stroke-width:1.3;stroke-dasharray:4 4' }, svg);
    const hnd = S('g', { style: 'cursor:grab' }, svg);
    S('circle', { r: 20, style: 'fill:var(--o2);opacity:.18' }, hnd);
    S('circle', { r: 9, style: 'fill:var(--o2);stroke:var(--surface);stroke-width:3' }, hnd);
    const tip = S('g', {}, svg);
    const tipBg = S('rect', { rx: 6, height: 24, style: 'fill:var(--ink)' }, tip);
    const tipT = S('text', { y: 16, 'text-anchor': 'middle', style: 'fill:var(--surface);font-family:var(--f-mono);font-size:12.5px;font-weight:600' }, tip);
    const zone = S('text', { x: X(50), y: P.y0 - 12, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700' }, svg);
    const ro = L.readout($('#odcRO'), [{ k: 'p', label: 'PO₂ (ملم زئبق)' }, { k: 's', label: 'نسبة التشبع %', cls: 'o2' }, { k: 'c', label: 'المحتوى (سم³/100 سم³)', cls: 'co2' }, { k: 'b', label: 'محتوى الكتاب (سم³)' }]);
    const BOOK = { 100: '19 (أ)', 40: '14 (ب)', 20: '4 (بور)' };
    let p = 100;
    const pre = L.seg($('#odcPre'), v => sl.set(+v));
    const sl = L.range('odcP', v => { p = v; draw(); });
    function draw() {
      const s = L.odc(p), x = X(p), y = Y(s);
      hnd.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      gx.setAttribute('x1', P.x0); gx.setAttribute('x2', x); gx.setAttribute('y1', y); gx.setAttribute('y2', y);
      gy.setAttribute('x1', x); gy.setAttribute('x2', x); gy.setAttribute('y1', y); gy.setAttribute('y2', P.y1);
      const label = `${p} → ${L.f(s, 1)}%`;
      tipT.textContent = label;
      const tw = label.length * 7.6 + 14, tx = L.clamp(x, P.x0 + tw / 2 + 4, P.x1 - tw / 2 - 4), ty = y + (y < P.y0 + 60 ? 22 : -46);
      tipBg.setAttribute('width', tw); tipBg.setAttribute('x', -tw / 2);
      tip.setAttribute('transform', `translate(${tx.toFixed(1)} ${ty.toFixed(1)})`);
      ro('p', p); ro('s', L.f(s, 1)); ro('c', L.f((s / 100) * CAP, 1)); ro('b', BOOK[p] || '—');
      zone.textContent = p >= 70 ? 'الرئتان: الدم مشبع تقريباً، وتغير الضغط لا يغير التشبع كثيراً' : p >= 35 ? 'الأنسجة في الراحة: يتحرر جزء من الأوكسجين' : 'نسيج فاعل: هبوط صغير في الضغط يحرر أوكسجيناً كثيراً';
      zone.style.fill = p >= 70 ? 'var(--o2)' : 'var(--co2)';
      pre(String(p), false);
    }
    let drag = false;
    const move = e => { const q = svgPoint(svg, e); sl.set(Math.round(L.clamp((q.x - P.x0) / (P.x1 - P.x0) * 100, 0, 100))); };
    svg.addEventListener('pointerdown', e => {
      const q = svgPoint(svg, e);
      if (q.x < P.x0 - 10 || q.x > P.x1 + 10 || q.y < P.y0 - 10 || q.y > P.y1 + 10) return;
      drag = true; svg.setPointerCapture(e.pointerId); hnd.style.cursor = 'grabbing'; move(e);
    });
    svg.addEventListener('pointermove', e => { if (drag) move(e); });
    ['pointerup', 'pointercancel'].forEach(ev => svg.addEventListener(ev, () => { drag = false; hnd.style.cursor = 'grab'; }));
    svg.style.touchAction = 'pan-y';
    draw();
  }

  /* ============ 10. شكل 3-8: محتوى الدم الأوكسجيني ============ */
  function loopSim() {
    const svg = $('#loop'), msg = $('#loopMsg'); svg.style.direction = 'ltr';
    const R = { l: 110, r: 450, t: 104, b: 252 };
    const lungs = S('g', {}, svg), tis = S('g', {}, svg);
    S('rect', { x: 200, y: 14, width: 160, height: 62, rx: 12, style: 'fill:var(--o2-soft);stroke:var(--o2);stroke-width:2' }, lungs);
    S('text', { x: 280, y: 40, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700', text: 'الرئتان' }, lungs);
    S('text', { x: 280, y: 60, 'text-anchor': 'middle', class: 'sv-sm', text: 'PO₂ = 100 ملم زئبق' }, lungs);
    S('rect', { x: 200, y: 284, width: 160, height: 62, rx: 12, style: 'fill:var(--tissue);stroke:var(--tissue-2);stroke-width:2' }, tis);
    const tisT = S('text', { x: 280, y: 310, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700', text: 'الأنسجة' }, tis);
    const tisP = S('text', { x: 280, y: 330, 'text-anchor': 'middle', class: 'sv-sm' }, tis);
    const path = `M${R.r} ${R.t}V${R.b}H${R.l}V${R.t}Z`;
    S('path', { d: `M280 ${R.t}H${R.r}V${R.b}H280`, style: 'fill:none;stroke:var(--o2);stroke-width:14;stroke-linecap:round;stroke-linejoin:round;opacity:.22' }, svg);
    const venP = S('path', { d: `M280 ${R.b}H${R.l}V${R.t}H280`, style: 'fill:none;stroke-width:14;stroke-linecap:round;stroke-linejoin:round;opacity:.22' }, svg);
    const mk = L.arrowDefs(svg, 'loopA', 'var(--ink-2)');
    [[`M${R.r - 4} ${R.t + 30}V${R.t + 70}`], [`M${R.l + 4} ${R.b - 30}V${R.b - 70}`], [`M${R.r - 60} ${R.b}H${R.r - 110}`], [`M${R.l + 60} ${R.t}H${R.l + 110}`]].forEach(([d]) => S('path', { d, style: 'fill:none;stroke:var(--ink-2);stroke-width:2', 'marker-end': mk }, svg));
    S('text', { x: R.r + 16, y: (R.t + R.b) / 2 - 8, class: 'sv-lbl', style: 'font-weight:700', text: 'الشرايين' }, svg);
    S('text', { x: R.r + 16, y: (R.t + R.b) / 2 + 12, class: 'sv-num', style: 'fill:var(--o2);font-weight:700', text: '19 سم³' }, svg);
    S('text', { x: R.l - 16, y: (R.t + R.b) / 2 - 8, 'text-anchor': 'end', class: 'sv-lbl', style: 'font-weight:700', text: 'الأوردة' }, svg);
    const venT = S('text', { x: R.l - 16, y: (R.t + R.b) / 2 + 12, 'text-anchor': 'end', class: 'sv-num', style: 'font-weight:700' }, svg);
    S('text', { x: R.l - 16, y: (R.t + R.b) / 2 + 30, 'text-anchor': 'end', class: 'sv-sm', text: 'لكل 100 سم³ دم' }, svg);
    S('text', { x: R.r + 16, y: (R.t + R.b) / 2 + 30, class: 'sv-sm', text: 'لكل 100 سم³ دم' }, svg);
    const inT = S('text', { x: 280, y: R.t - 12, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700;fill:var(--o2)' }, svg);
    const outT = S('text', { x: 280, y: R.b + 25, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700;fill:var(--co2)' }, svg);
    const mid = S('text', { x: 280, y: 172, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700' }, svg);
    const mid2 = S('text', { x: 280, y: 192, 'text-anchor': 'middle', class: 'sv-sm' }, svg);
    // جزيئات O2 تدخل وتخرج
    const drops = [];
    for (let i = 0; i < 18; i++) drops.push({ el: S('circle', { r: 3.4, style: 'fill:var(--o2)' }, svg), t: Math.random(), kind: i % 2 ? 'in' : 'out', x: 255 + Math.random() * 50 });
    // كريات الدم
    const pathEl = S('path', { d: path, style: 'fill:none;stroke:none' }, svg);
    const len = pathEl.getTotalLength();
    const N = 16, cells = [];
    for (let i = 0; i < N; i++) {
      const c = S('g', {}, svg);
      const body = S('ellipse', { rx: 10, ry: 7, style: 'stroke:var(--surface);stroke-width:1.5' }, c);
      S('ellipse', { rx: 4.5, ry: 2.6, style: 'fill:#000;opacity:.14' }, c);
      cells.push({ c, body, u: i / N });
    }
    let ex = false, off = 0;
    // u = 0 at top-right corner. segments: right side down → bottom → left up → top
    const L1 = R.b - R.t, L2 = R.r - R.l;
    function contentAt(d) {
      const ven = ex ? 4 : 14;
      if (d < L1) return 19; // الشرايين
      if (d < L1 + L2) { const k = (d - L1) / L2, mid = (R.r - 280) / L2; return k < mid ? 19 : ven; }
      if (d < 2 * L1 + L2) return ven;
      const k = (d - 2 * L1 - L2) / L2, mid = (280 - R.l) / L2; return k < mid ? ven : 19;
    }
    function set(mode) {
      ex = mode === 'ex';
      const ven = ex ? 4 : 14, give = 19 - ven;
      L.setText(venT, ven + ' سم³'); venT.style.fill = ex ? 'var(--co2)' : 'color-mix(in srgb, var(--o2) 55%, var(--co2))';
      venP.style.stroke = ex ? 'var(--co2)' : 'color-mix(in srgb, var(--o2) 55%, var(--co2))';
      L.setText(inT, `يكتسب ${give} سم³ لكل 100 سم³ دم`);
      L.setText(outT, `يفقد ${give} سم³ لكل 100 سم³ دم`);
      L.setText(tisP, `PO₂ = ${ex ? 20 : 40} ملم زئبق`);
      L.setText(tisT, ex ? 'عضلة فاعلة' : 'الأنسجة');
      L.setText(mid, ex ? 'تُعطى العضلة 15 سم³ بدلاً من 5' : 'كل 100 سم³ دم تعطي الأنسجة 5 سم³');
      L.setText(mid2, ex ? 'يبقى في الدم الوريدي 4 سم³ فقط: لونه داكن جداً' : 'ويعود الدم الوريدي وفيه 14 سم³ (70% من السعة)');
      msg.className = ex ? 'status warn' : 'status ok';
      msg.innerHTML = ex ? '<b>أثناء التمرين</b> يهبط ضغط الأوكسجين في العضلات الفاعلة إلى <mark>20 ملم زئبق</mark>، فتستخلص من الدم كمية أكبر: يبقى <b>4 سم³</b> في كل 100 سم³ وتأخذ العضلة <b>15 سم³</b> بدلاً من 5، ويترك الدم العضلة ولونه داكن جداً.'
        : '<b>في الراحة</b> يخرج الدم من الرئتين بضغط <b>100 ملم زئبق</b> ومحتوى <mark>19 سم³</mark> في كل 100 سم³ (النقطة أ)، ويترك الأنسجة بضغط <b>40</b> ومحتوى <mark>14 سم³</mark> (النقطة ب)، فتأخذ الأنسجة <b>5 سم³</b>.';
    }
    L.seg($('#loopSeg'), set);
    set('rest');
    L.loop(svg, dt => {
      off = (off + dt * (ex ? 0.11 : 0.06)) % 1;
      cells.forEach(cl => {
        const d = ((cl.u + off) % 1) * len, q = pathEl.getPointAtLength(d), c = contentAt(d);
        cl.c.setAttribute('transform', `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})`);
        cl.body.style.fill = `color-mix(in srgb, var(--o2) ${Math.round((c / 19) * 100)}%, #3a2030)`;
      });
      const rate = ex ? 1.6 : 0.6;
      drops.forEach(dp => {
        dp.t += dt * rate * 0.7;
        if (dp.t > 1) { dp.t -= 1; dp.x = 255 + Math.random() * 50; dp.on = Math.random() < (ex ? 1 : 0.4); }
        const y = dp.kind === 'in' ? L.lerp(78, R.t - 2, dp.t) : L.lerp(R.b + 2, 282, dp.t);
        dp.el.setAttribute('cx', dp.x.toFixed(1)); dp.el.setAttribute('cy', y.toFixed(1));
        dp.el.setAttribute('opacity', dp.on === false ? 0 : (Math.sin(dp.t * Math.PI) * 0.9).toFixed(2));
      });
    });
  }

  /* ============ 10. السعة حسب الهيموكلوبين ============ */
  function hbCapSim() {
    const ro = L.readout($('#hbRO'), [{ k: 'cap', label: 'سعة الأوكسجين (سم³/100 سم³)', cls: 'co2' }, { k: 'art', label: 'المحتوى الشرياني عند 100 ملم زئبق', cls: 'o2' }, { k: 'lit', label: 'في كل لتر دم (سم³)' }]);
    L.range('hbG', g => {
      const cap = g * 1.3;
      ro('cap', `${g} × 1.3 = ${L.f(cap, 1)}`);
      ro('art', L.f(cap * L.odc(100) / 100, 1));
      ro('lit', Math.round(cap * 10));
    }).set(15);
  }

  /* ============ 10. صورتا وجود الأوكسجين ============ */
  function formsSim() {
    const svg = $('#forms'); svg.style.direction = 'ltr';
    const pair = (x, y, r, parent) => { S('circle', { cx: x - r * 0.75, cy: y, r, style: 'fill:var(--o2)' }, parent); S('circle', { cx: x + r * 0.75, cy: y, r, style: 'fill:var(--o2)' }, parent); };
    // ذائب
    S('rect', { x: 290, y: 12, width: 210, height: 96, rx: 12, style: 'fill:var(--hl);opacity:.35' }, svg);
    S('text', { x: 395, y: 30, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700', text: '1 ذائباً في البلازما' }, svg);
    [[330, 70], [420, 56], [460, 86]].forEach(([x, y]) => pair(x, y, 4.5, svg));
    S('text', { x: 395, y: 100, 'text-anchor': 'middle', class: 'sv-sm', text: 'نسبة قليلة جداً' }, svg);
    // متحد
    S('rect', { x: 20, y: 12, width: 250, height: 96, rx: 12, style: 'fill:var(--o2-soft);opacity:.6' }, svg);
    S('text', { x: 145, y: 30, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700', text: '2 متحداً بالهيموكلوبين' }, svg);
    S('ellipse', { cx: 145, cy: 70, rx: 62, ry: 26, style: 'fill:var(--o2);opacity:.85' }, svg);
    S('ellipse', { cx: 145, cy: 70, rx: 28, ry: 10, style: 'fill:#000;opacity:.12' }, svg);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; pair(145 + Math.cos(a) * 74, 70 + Math.sin(a) * 34, 3.8, svg); }
    S('text', { x: 145, y: 74, 'text-anchor': 'middle', style: 'fill:var(--surface);font-size:12px;font-weight:700', text: 'كرية دم حمراء' }, svg);
    // الشريط
    const X0 = 20, W = 480, d = W * 0.015;
    S('rect', { x: X0, y: 134, width: W - d, height: 22, rx: 4, style: 'fill:var(--o2)' }, svg);
    S('rect', { x: X0 + W - d, y: 134, width: d, height: 22, style: 'fill:var(--hl);stroke:var(--ink-2);stroke-width:1' }, svg);
    S('text', { x: X0 + 8, y: 150, style: 'fill:var(--surface);font-size:12px;font-weight:700', text: 'متحد: 97–99% ≈ 197 سم³ لكل لتر دم' }, svg);
    S('path', { d: `M${X0 + W - d / 2} 158v14h-30`, style: 'fill:none;stroke:var(--ink-2);stroke-width:1.2' }, svg);
    S('text', { x: X0 + W - d / 2 - 34, y: 176, 'text-anchor': 'end', class: 'sv-sm', style: 'font-weight:700', text: 'ذائب: 1–3% ≈ 3 سم³ لكل لتر' }, svg);
    S('text', { x: 20, y: 196, class: 'sv-sm', text: 'المجموع ≈ 200 سم³ أوكسجين في كل لتر دم' }, svg);
  }

  /* ============ 11. الهيموكلوبين ============ */
  function hbGlue() {
    const hb = L.hb;
    if (!hb) return;
    const add = $('#hbAdd'), rem = $('#hbRem'), msg = $('#hbMsg'), pv = $('#hbPV');
    const eq = $('#hbEq'); eq.style.direction = 'ltr';
    const F = ['Hb₄', 'Hb₄O₂', 'Hb₄O₄', 'Hb₄O₆', 'Hb₄O₈'], CW = 84, GAP = (560 - 5 * CW - 8) / 4;
    const chips = F.map((f, i) => {
      const x = 4 + i * (CW + GAP), g = S('g', {}, eq);
      const r = S('rect', { x, y: 6, width: CW, height: 36, rx: 9, style: 'stroke-width:2' }, g);
      const t = S('text', { x: x + CW / 2, y: 30, 'text-anchor': 'middle', style: 'font-size:16px;font-weight:700' }, g);
      t.textContent = f;
      S('text', { x: x + CW / 2, y: 62, 'text-anchor': 'middle', class: 'sv-num', text: i * 25 + '%' }, g);
      if (i < 4) {
        const ax = x + CW + GAP / 2;
        S('text', { x: ax, y: 18, 'text-anchor': 'middle', class: 'sv-sm', style: 'font-weight:700;fill:var(--o2)', text: '+O₂' }, eq);
        S('text', { x: ax, y: 36, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-size:18px', text: '⇌' }, eq);
      }
      return { r, t };
    });
    const MSG = [
      '<b>Hb₄ غير مؤكسج:</b> المواقع الأربعة فارغة، والحديد بصورة حديدوز <bdi dir="ltr">Fe²⁺</bdi>. اتحاد الجزيئة الأولى هو الأبطأ.',
      '<b>Hb₄O₂:</b> اتحدت أول جزيئة O₂ بمجموعة هيم. <mark>الهيم المؤكسج أولاً يسهّل أكسجة الجاميع الثلاث الباقية</mark> لأن البناء البروتيني للكلوبين يتغير، لاحظ أن البقية تتحد أسرع.',
      '<b>Hb₄O₄:</b> نصف المواقع مشغولة، والتشبع 50%.',
      '<b>Hb₄O₆:</b> التشبع 75%، وهي تقريباً حالة الدم العائد من الأنسجة عند 40 ملم زئبق.',
      '<b>Hb₄O₈ مشبع 100%:</b> كل المواقع متحدة بالأوكسجين، والمحتوى يساوي السعة. والحديد ما زال حديدوز، لذلك هي <mark>أكسجة وليست أكسدة</mark>.'
    ];
    function upd(n) {
      chips.forEach((c, i) => {
        const on = i === n;
        c.r.style.fill = on ? 'var(--o2)' : i < n ? 'var(--o2-soft)' : 'var(--surface-2)';
        c.r.style.stroke = on ? 'var(--o2)' : 'var(--line)';
        c.t.style.fill = on ? 'var(--surface)' : 'var(--ink)';
      });
      msg.className = 'status' + (n === 4 ? ' ok' : '');
      msg.innerHTML = MSG[n];
      add.disabled = n >= 4; rem.disabled = n <= 0;
    }
    hb.listeners.push(upd);
    add.addEventListener('click', () => { hb.add(); pv.textContent = '—'; });
    rem.addEventListener('click', () => { hb.remove(); pv.textContent = '—'; });
    const sat = p => L.odc(p);
    const sl = L.range('hbP', p => hb.setTarget(Math.round(sat(p) / 25)), p => `${p} → ${Math.round(sat(p))}%`);
    pv.textContent = '—';
    upd(hb.count);
  }

  /* ============ 12. تأثير بور ============ */
  function bohrSim() {
    const svg = $('#bohr'), msg = $('#bohrMsg'); svg.style.direction = 'ltr';
    const { P, X, Y } = plotFrame(svg);
    const inv = (s, k) => { let lo = 0, hi = 400; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (L.odcShift(m, k) < s) lo = m; else hi = m; } return (lo + hi) / 2; };
    const figG = S('g', {}, svg);
    const ref = S('path', { d: curvePath(X, Y, L.odc), style: 'fill:none;stroke:var(--muted);stroke-width:2;stroke-dasharray:6 5' }, svg);
    const refT = S('text', { class: 'sv-sm', style: 'font-weight:600', text: 'الطبيعي' }, svg);
    const cur = S('path', { style: 'fill:none;stroke:var(--o2);stroke-width:3.4;stroke-linejoin:round' }, svg);
    const arr = S('g', {}, svg);
    const shiftL = S('line', { style: 'stroke:var(--ink);stroke-width:2.2' }, arr);
    const mk = L.arrowDefs(svg, 'bohrA', 'var(--ink)');
    shiftL.setAttribute('marker-end', mk);
    const shiftT = S('text', { 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700' }, arr);
    // نقاط الرئة والنسيج
    const artH = S('line', { style: 'stroke:var(--o2);stroke-width:1.3;stroke-dasharray:3 3' }, svg);
    const tisV = S('line', { style: 'stroke:var(--co2);stroke-width:1.3;stroke-dasharray:3 3' }, svg);
    const rel = S('line', { style: 'stroke:var(--co2);stroke-width:3', 'marker-end': L.arrowDefs(svg, 'bohrB', 'var(--co2)') }, svg);
    const relT = S('text', { class: 'sv-lbl', 'text-anchor': 'start', style: 'font-weight:700;fill:var(--co2)' }, svg);
    const artP = S('circle', { r: 6, style: 'fill:var(--o2);stroke:var(--surface);stroke-width:2' }, svg);
    const tisPt = S('circle', { r: 6, style: 'fill:var(--co2);stroke:var(--surface);stroke-width:2' }, svg);
    S('text', { x: X(100) - 8, y: Y(L.odc(100)) - 10, 'text-anchor': 'end', class: 'sv-sm', style: 'font-weight:700;fill:var(--o2)', text: 'الرئتان' }, svg);
    const tisLbl = S('text', { class: 'sv-sm', style: 'font-weight:700;fill:var(--co2)' }, svg);
    const ro = L.readout($('#bohrRO'), [{ k: 'a', label: 'ألفة الهيموكلوبين للأوكسجين', cls: 'ac' }, { k: 'p50', label: 'P50 (ملم زئبق)' }, { k: 's', label: 'التشبع في النسيج %', cls: 'co2' }, { k: 'r', label: 'O₂ المتحرر (سم³/100 سم³)', cls: 'o2' }]);
    let T = 38, C = 40, H = 7.4, tisP = 40, fig = false;
    const PRE = {
      rest: { T: 38, C: 40, H: 7.4, p: 40 },
      ex: { T: 39, C: 60, H: 7.2, p: 20 },
      cold: { T: 20, C: 40, H: 7.4, p: 40 },
      fig: { T: 38, C: 40, H: 7.4, p: 40 }
    };
    function drawFig() {
      figG.innerHTML = '';
      if (!fig) return;
      [[10, 88], [20, 72], [38, 50], [42, 34]].forEach(([t, s]) => {
        const k = L.bohrK(t, 40, 7.4);
        S('path', { d: curvePath(X, Y, p => L.odcShift(p, k)), style: 'fill:none;stroke:var(--accent);stroke-width:1.8;opacity:.75' }, figG);
        const px = inv(s, k);
        S('text', { x: X(px) + 7, y: Y(s) + 4, class: 'sv-num', style: 'fill:var(--accent);font-weight:700', text: t + '°' }, figG);
      });
    }
    function draw() {
      const k = L.bohrK(T, C, H), fn = p => L.odcShift(p, k);
      cur.setAttribute('d', curvePath(X, Y, fn));
      const sr = inv(70, 1);
      refT.setAttribute('x', (X(sr) + 8).toFixed(1)); refT.setAttribute('y', (Y(70) + 4).toFixed(1));
      refT.style.display = Math.abs(k - 1) < 0.04 ? 'none' : '';
      // سهم الانزياح
      const p50 = L.P50 * k;
      const a = L.clamp(L.P50, 0, 100), b = L.clamp(p50, 0, 100);
      if (Math.abs(k - 1) > 0.05) {
        arr.style.display = '';
        shiftL.setAttribute('x1', X(a)); shiftL.setAttribute('x2', X(b) + (b > a ? -6 : 6)); shiftL.setAttribute('y1', Y(50)); shiftL.setAttribute('y2', Y(50));
        shiftT.setAttribute('x', X((a + b) / 2)); shiftT.setAttribute('y', Y(50) - 10);
        shiftT.textContent = k > 1 ? 'انزياح لليمين' : 'انزياح لليسار';
      } else arr.style.display = 'none';
      // الرئة والنسيج
      const sa = L.odc(100), st = fn(tisP);
      artP.setAttribute('cx', X(100)); artP.setAttribute('cy', Y(sa));
      tisPt.setAttribute('cx', X(tisP)); tisPt.setAttribute('cy', Y(st));
      artH.setAttribute('x1', X(tisP)); artH.setAttribute('x2', X(100)); artH.setAttribute('y1', Y(sa)); artH.setAttribute('y2', Y(sa));
      tisV.setAttribute('x1', X(tisP)); tisV.setAttribute('x2', X(tisP)); tisV.setAttribute('y1', Y(st)); tisV.setAttribute('y2', P.y1);
      const relCm = Math.max(0, ((sa - st) / 100) * CAP);
      rel.setAttribute('x1', X(tisP) - 12); rel.setAttribute('x2', X(tisP) - 12); rel.setAttribute('y1', Y(sa) + 2); rel.setAttribute('y2', Y(st) - 6);
      rel.style.display = sa - st > 4 ? '' : 'none';
      relT.setAttribute('x', X(tisP) + 8); relT.setAttribute('y', Y(sa) + 17);
      L.setText(relT, `يتحرر ≈ ${L.f(relCm, 1)} سم³`);
      tisLbl.setAttribute('x', X(tisP) + 9); tisLbl.setAttribute('y', Math.min(P.y1 - 6, Y(st) + 18));
      L.setText(tisLbl, `النسيج (${tisP})`);
      ro('a', k > 1.05 ? 'أقل ↓' : k < 0.95 ? 'أعلى ↑' : 'طبيعية');
      ro('p50', L.f(p50, 1)); ro('s', L.f(st, 1)); ro('r', L.f(relCm, 1));
      const why = [];
      if (T > 38) why.push('ارتفاع الحرارة'); if (T < 38) why.push('انخفاض الحرارة');
      if (C > 41) why.push('ارتفاع PCO₂'); if (C < 39) why.push('انخفاض PCO₂');
      if (H < 7.39) why.push('انخفاض الأس الهيدروجيني (حامضية أعلى)'); if (H > 7.41) why.push('ارتفاع الأس الهيدروجيني');
      if (k > 1.05) { msg.className = 'status ok'; msg.innerHTML = `<b>انزاح المنحني إلى اليمين</b> بسبب ${why.join(' و')}: قلت ألفة الهيموكلوبين للأوكسجين، فيتحرر للنسيج <mark>${L.f(relCm, 1)} سم³</mark> في كل 100 سم³ دم.` + (tisP === 20 ? ' هذا ما يحصل في العضلة الفاعلة: يبقى في الدم حوالي 4 سم³ فقط وتأخذ العضلة حوالي 15.' : ''); }
      else if (k < 0.95) { msg.className = 'status warn'; msg.innerHTML = `<b>انزاح المنحني إلى اليسار</b> بسبب ${why.join(' و')}: زادت الألفة فيتمسك الهيموكلوبين بالأوكسجين، ولا يتحرر للنسيج إلا <mark>${L.f(relCm, 1)} سم³</mark>.` + (T <= 25 ? ' لهذا قد تموت الأطراف المعرضة للبرد الشديد اختناقاً.' : ''); }
      else { msg.className = 'status'; msg.innerHTML = 'المنحني الطبيعي (38°م، PCO₂ = 40، pH = 7.4). حرّك أي عامل وراقب اتجاه الانزياح. هذه التأثيرات الثلاث معاً تسمى <b>تأثير بور</b>.'; }
    }
    const rT = L.range('bT', v => { T = v; seg('', false); fig = false; drawFig(); draw(); });
    const rC = L.range('bC', v => { C = v; seg('', false); fig = false; drawFig(); draw(); });
    const rH = L.range('bH', v => { H = v; seg('', false); fig = false; drawFig(); draw(); }, v => v.toFixed(2));
    const seg = L.seg($('#bohrPre'), k => {
      const p = PRE[k];
      T = p.T; C = p.C; H = p.H; tisP = p.p; fig = k === 'fig';
      rT.set(T, false); rC.set(C, false); rH.set(H, false);
      drawFig(); draw();
    });
    draw();
  }

  L.ready.push(vqSim, daltonSim, roomSim, odcSim, loopSim, hbCapSim, formsSim, hbGlue, bohrSim);
})();
