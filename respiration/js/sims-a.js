/* المحاكاة: الأقسام 1–4 */
(function () {
  'use strict';
  const L = window.Lab, S = L.svg, $ = L.$;

  /* ============ 1. رحلة الغازين ============ */
  function flowSim() {
    const host = $('#flow'), info = $('#flowInfo'), btnBox = $('#flowBtns');
    const PROC = [
      { k: 'all', label: 'العمليات الثلاث', span: [0, 4], def: '<b>التنفس</b> عملية تبادل الغازات بين المادة الحية ومحيطها الخارجي، وتوصف به ثلاث عمليات متعاقبة. اختر عملية لتراها على المسار.' },
      { k: 'p1', label: '1 التهوية الرئوية', span: [0, 1], def: '<b>التهوية الرئوية</b> <span class="en">Pulmonary Ventilation</span>: حركة الهواء داخل الرئتين وخروجه منهما.' },
      { k: 'p2', label: '2 التنفس الرئوي والداخلي', span: [1, 3], def: '<b>التنفس الرئوي والداخلي</b>: انتقال الغازات بالانتشار بين الأسناخ والدم، ونقل O₂ بالدم إلى الأنسجة والعودة بـ CO₂، ثم انتقالهما بالانتشار بين الدم والخلايا.' },
      { k: 'p3', label: '3 التنفس الخلوي', span: [3, 4], def: '<b>التنفس الخلوي</b> <span class="en">Cellular Respiration</span>: تحرير الطاقة بالهدم الغذائي داخل الخلية، وهو ذروة عملية التنفس بأكملها.' }
    ];
    const NODES = ['هواء الجو', 'الأسناخ', 'الدم', 'خلايا الأنسجة', 'تحرير الطاقة'];
    btnBox.innerHTML = '<div class="seg" id="flowSeg">' + PROC.map((p, i) => `<button type="button" data-v="${p.k}" aria-pressed="${i === 0}">${p.label}</button>`).join('') + '</div>';
    let vertical = null, svg, parts = {}, cur = PROC[0];
    const N = 9, o2 = [], co2 = [];
    for (let i = 0; i < N; i++) { o2.push({ t: i / N }); co2.push({ t: (i + 0.5) / N }); }

    function icon(g, k, x, y) {
      if (k === 0) { S('circle', { cx: x, cy: y, r: 30, style: 'fill:var(--surface-2);stroke:var(--line);stroke-width:2' }, g); for (let i = -1; i <= 1; i++) S('path', { d: `M${x - 16} ${y + i * 9}q8 -6 16 0t16 0`, style: 'fill:none;stroke:var(--co2);stroke-width:2;stroke-linecap:round', opacity: 0.7 }, g); }
      if (k === 1) { [[-10, -6], [9, -8], [0, 9]].forEach(d => S('circle', { cx: x + d[0], cy: y + d[1], r: 15, style: 'fill:var(--tissue);stroke:var(--tissue-2);stroke-width:2' }, g)); }
      if (k === 2) { S('ellipse', { cx: x, cy: y, rx: 28, ry: 18, style: 'fill:var(--o2);stroke:var(--o2);stroke-width:2' }, g); S('ellipse', { cx: x, cy: y, rx: 12, ry: 6, style: 'fill:var(--surface);opacity:.35' }, g); }
      if (k === 3) { S('rect', { x: x - 30, y: y - 22, width: 60, height: 44, rx: 14, style: 'fill:var(--accent-soft);stroke:var(--accent);stroke-width:2' }, g); S('circle', { cx: x + 6, cy: y, r: 9, style: 'fill:var(--accent);opacity:.55' }, g); }
      if (k === 4) { S('circle', { cx: x, cy: y, r: 28, style: 'fill:var(--hl);stroke:#c9a400;stroke-width:2' }, g); S('path', { d: `M${x + 4} ${y - 18}L${x - 9} ${y + 3}h9l-4 15l13-21h-9z`, style: 'fill:var(--ink)' }, g); }
    }
    function build() {
      const w = host.clientWidth || 600;
      const v = w < 460;
      if (v === vertical && svg) return;
      vertical = v;
      host.innerHTML = '';
      const W = v ? 340 : 640, H = v ? 600 : 300;
      svg = S('svg', { class: 'fig', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'مسار الأوكسجين وثاني أوكسيد الكاربون' }, host);
      svg.style.direction = 'ltr';
      const pos = i => (v ? { x: 170, y: 58 + i * 122 } : { x: 580 - i * 129.5, y: 150 });
      parts = { nodes: [], brackets: [], o2: [], co2: [] };
      const lineO2 = v ? { a: [148, 40], b: [148, 560] } : { a: [600, 132], b: [44, 132] };
      const lineCO2 = v ? { a: [192, 560], b: [192, 40] } : { a: [44, 170], b: [600, 170] };
      parts.lineO2 = lineO2; parts.lineCO2 = lineCO2;
      S('line', { x1: lineO2.a[0], y1: lineO2.a[1], x2: lineO2.b[0], y2: lineO2.b[1], style: 'stroke:var(--o2);stroke-width:2;opacity:.35', class: 'flow' }, svg);
      S('line', { x1: lineCO2.a[0], y1: lineCO2.a[1], x2: lineCO2.b[0], y2: lineCO2.b[1], style: 'stroke:var(--co2);stroke-width:2;opacity:.35', class: 'flow' }, svg);
      PROC.slice(1).forEach((p, i) => {
        const a = pos(p.span[0]), b = pos(p.span[1]);
        const g = S('g', {}, svg);
        if (v) {
          const x = 312;
          S('path', { d: `M${x - 8} ${a.y}h8V${b.y}h-8`, style: 'fill:none;stroke:var(--accent);stroke-width:2' }, g);
          const lines = p.k === 'p2' ? ['2 التنفس', 'الرئوي', 'والداخلي'] : [p.label];
          const tx = S('text', { x: x - 14, y: (a.y + b.y) / 2 + 4 - (lines.length - 1) * 8.5, 'text-anchor': 'end', class: 'sv-lbl', style: 'font-weight:700;fill:var(--accent)' }, g);
          lines.forEach((ln, j) => S('tspan', { x: x - 14, dy: j ? 17 : 0, text: ln }, tx));
        } else {
          const y = 62;
          S('path', { d: `M${a.x} ${y + 10}v-10H${b.x}v10`, style: 'fill:none;stroke:var(--accent);stroke-width:2' }, g);
          S('text', { x: (a.x + b.x) / 2, y: y - 10, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700;fill:var(--accent)', text: p.label }, g);
        }
        parts.brackets.push({ g, p });
      });
      NODES.forEach((t, i) => {
        const p = pos(i), g = S('g', {}, svg);
        icon(g, i, p.x, p.y);
        if (v) S('text', { x: p.x - 44, y: p.y + 5, 'text-anchor': 'end', class: 'sv-lbl', style: 'font-weight:600', text: t }, g);
        else S('text', { x: p.x, y: p.y + 56, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:600', text: t }, g);
        parts.nodes.push(g);
      });
      if (!v) {
        S('text', { x: 322, y: 278, 'text-anchor': 'middle', class: 'sv-sm', text: 'O₂ يسير من الجو إلى الخلية، وCO₂ يسير بالاتجاه المضاد' }, svg);
      }
      o2.forEach(q => (q.el = S('circle', { r: 5.5, style: 'fill:var(--o2)' }, svg)));
      co2.forEach(q => (q.el = S('circle', { r: 5.5, style: 'fill:var(--co2)' }, svg)));
      parts.pos = pos;
      apply();
    }
    function apply() {
      const [a, b] = cur.span;
      parts.nodes.forEach((g, i) => g.setAttribute('opacity', i >= a && i <= b ? 1 : 0.28));
      parts.brackets.forEach(x => x.g.setAttribute('opacity', cur.k === 'all' || x.p.k === cur.k ? 1 : 0.2));
      info.innerHTML = cur.def;
    }
    const setSeg = L.seg($('#flowSeg'), k => { cur = PROC.find(p => p.k === k); apply(); });
    function place(q, line, dir) {
      const t = q.t, x = L.lerp(line.a[0], line.b[0], t), y = L.lerp(line.a[1], line.b[1], t);
      q.el.setAttribute('cx', x.toFixed(1)); q.el.setAttribute('cy', y.toFixed(1));
      const idx = (dir > 0 ? t : 1 - t) * 4.25 - 0.1;
      const [a, b] = cur.span;
      q.el.setAttribute('opacity', idx >= a - 0.25 && idx <= b + 0.25 ? 1 : 0.18);
    }
    build();
    if ('ResizeObserver' in window) new ResizeObserver(() => build()).observe(host);
    L.loop(host, dt => {
      o2.forEach(q => { q.t = (q.t + dt * 0.09) % 1; place(q, parts.lineO2, 1); });
      co2.forEach(q => { q.t = (q.t + dt * 0.09) % 1; place(q, parts.lineCO2, -1); });
    });
    setSeg('all', false);
  }

  /* ============ 2. نسبة السطح إلى الحجم ============ */
  function savSim() {
    const host = $('#sav');
    const svg = S('svg', { class: 'fig', viewBox: '0 0 520 250', role: 'img', 'aria-label': 'مكعب ومقطعه يوضحان وصول الأوكسجين بالانتشار' }, host);
    svg.style.direction = 'ltr';
    const defs = S('defs', {}, svg);
    const pat = S('pattern', { id: 'hatch', width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    S('rect', { width: 8, height: 8, style: 'fill:var(--surface-2)' }, pat);
    S('line', { x1: 0, y1: 0, x2: 0, y2: 8, style: 'stroke:var(--line);stroke-width:3' }, pat);
    const cube = S('g', {}, svg), sec = S('g', {}, svg), dots = S('g', {}, svg);
    S('text', { x: 130, y: 244, 'text-anchor': 'middle', class: 'sv-sm', text: 'جسم الحيوان' }, svg);
    S('text', { x: 385, y: 244, 'text-anchor': 'middle', class: 'sv-sm', text: 'مقطع: الوردي يصله O₂ بالانتشار' }, svg);
    const ro = L.readout($('#savRO'), [
      { k: 'sa', label: 'مساحة السطح (6×ض²)' }, { k: 'v', label: 'الحجم (ض³)' },
      { k: 'r', label: 'السطح ÷ الحجم', cls: 'ac' }, { k: 'f', label: 'ما يصله O₂ بالانتشار', cls: 'o2' }]);
    const msg = $('#savMsg');
    let s = 2, q = 0, d = 0;
    const pts = [];
    for (let i = 0; i < 16; i++) pts.push({ side: i % 4, u: (Math.floor(i / 4) + 0.5) / 4, ph: Math.random() * 6 });
    function draw() {
      cube.innerHTML = ''; sec.innerHTML = '';
      const a = 11 * s, cx = 130, cy = 128;
      const P = (x, y) => `${(cx + x).toFixed(1)},${(cy + y).toFixed(1)}`;
      const k = 0.866 * a;
      S('polygon', { points: [P(0, -a * 0.5 - a * 0.5), P(k, -a * 0.5), P(0, a * 0.5 - a * 0.5 + a * 0.0), P(-k, -a * 0.5)].join(' '), style: 'fill:var(--tissue);stroke:var(--tissue-2);stroke-width:1.5' }, cube);
      S('polygon', { points: [P(-k, -a * 0.5), P(0, 0), P(0, a), P(-k, a * 0.5)].join(' '), style: 'fill:var(--tissue-2);stroke:var(--tissue-2);stroke-width:1.5', opacity: 0.85 }, cube);
      S('polygon', { points: [P(0, 0), P(k, -a * 0.5), P(k, a * 0.5), P(0, a)].join(' '), style: 'fill:var(--tissue);stroke:var(--tissue-2);stroke-width:1.5', opacity: 0.75 }, cube);
      q = 13 * s; d = 13;
      const x0 = 385 - q / 2, y0 = 120 - q / 2;
      S('rect', { x: x0, y: y0, width: q, height: q, rx: 3, style: 'fill:var(--o2-soft);stroke:var(--tissue-2);stroke-width:2' }, sec);
      if (q > 2 * d) {
        S('rect', { x: x0 + d, y: y0 + d, width: q - 2 * d, height: q - 2 * d, style: 'fill:url(#hatch);stroke:var(--muted);stroke-width:1;stroke-dasharray:4 3' }, sec);
        if (q - 2 * d > 70) S('text', { x: 385, y: 124, 'text-anchor': 'middle', class: 'sv-sm', style: 'font-weight:600', text: 'لا يصله O₂' }, sec);
      }
      const f = s <= 2 ? 1 : 1 - Math.pow((s - 2) / s, 3);
      ro('sa', L.f(6 * s * s, 1)); ro('v', L.f(s * s * s, 1)); ro('r', L.f(6 / s, 2)); ro('f', Math.round(f * 100) + '%');
      let cls = 'status ok', txt = '<b>الانتشار من سطح الجسم يكفي.</b> مثل الحيوانات الواطئة: نسبة السطح إلى الكتلة عالية فلا تحتاج أعضاء تنفس ولا دماً ولا صبغات.';
      if (f < 0.9) { cls = 'status'; txt = '<b>يصعب وصول O₂ إلى العمق.</b> تحتاج دورة دموية وصبغة تنفسية، مثل الديدان الحلقية.'; }
      if (f < 0.6) { cls = 'status warn'; txt = '<b>الانتشار لا يكفي.</b> نسبة السطح إلى الحجم قليلة، فتحتاج أعضاء خاصة للتنفس (غلاصم أو رئات أو قصيبات) وصبغات تنفسية، مثل الحيوانات الأكثر تطوراً.'; }
      msg.className = cls; msg.innerHTML = txt;
    }
    L.range('savSize', v => { s = v; draw(); });
    draw();
    const dotEls = pts.map(() => S('circle', { r: 3.5, style: 'fill:var(--o2)' }, dots));
    L.loop(host, (dt, t) => {
      const x0 = 385 - q / 2, y0 = 120 - q / 2;
      pts.forEach((p, i) => {
        const depth = (0.5 + 0.5 * Math.sin(t * 1.6 + p.ph)) * (Math.min(d, q / 2) + 14) - 14;
        let x, y;
        const u = p.u * q;
        if (p.side === 0) { x = x0 + u; y = y0 + depth; }
        else if (p.side === 1) { x = x0 + q - depth; y = y0 + u; }
        else if (p.side === 2) { x = x0 + u; y = y0 + q - depth; }
        else { x = x0 + depth; y = y0 + u; }
        dotEls[i].setAttribute('cx', x.toFixed(1)); dotEls[i].setAttribute('cy', y.toFixed(1));
        dotEls[i].setAttribute('opacity', depth < 0 ? 0.35 : 1);
      });
    });
  }

  /* ============ 3. الرئتان وغشاء الجنب ============ */
  function pleuraSim() {
    const svg = $('#pleuraFig'), info = $('#pleuraInfo');
    svg.style.direction = 'ltr';
    const INFO = {
      wall: ['جدار الصدر', 'Thoracic wall', 'يحيط بالتجويف الصدري الذي تقع فيه الرئتان.'],
      parietal: ['غشاء الجنب الجداري', 'Parietal Pleura', 'الغشاء المصلي المبطن لتجويف القفص الصدري.'],
      cavity: ['التجويف الجنبي', 'Pleural Cavity', 'الفسحة الرقيقة بين الغشاءين، يملؤها سائل انزلاقي لمفاوي يفرزه غشاء الجنب ويمنع احتكاك الغشاءين خلال الشهيق.'],
      visceral: ['غشاء الجنب الحشوي', 'Visceral Pleura', 'الغشاء الذي يحيط بالرئتين (يلتصق بسطح الرئة).'],
      rlung: ['الرئة اليمنى', 'Right lung', 'تتكون من ثلاثة فصوص: علوي وأوسط وسفلي، ولكل فص تجهيز هوائي ودموي خاص به.'],
      llung: ['الرئة اليسرى', 'Left lung', 'تتكون من فصين: علوي وسفلي، ولكل فص تجهيز هوائي ودموي خاص به.'],
      trachea: ['القصبة الهوائية', 'Trachea', 'يمر بها الهواء من الحنجرة إلى القصبات.'],
      bronchus: ['القصبة (الشعبة) الهوائية', 'Bronchus', 'تدخل كل رئة وتتفرع إلى فروع أدق تنتهي بالأكياس السنخية.'],
      dia: ['الحجاب الحاجز', 'Diaphragm', 'عضلة تحت الرئتين، تتقلص في الشهيق فتصبح مستوية بعد أن كانت محدبة إلى الأعلى.'],
      med: ['المنصف', 'Mediastinum', 'الفسحة بين الرئتين، ويقع فيها القلب. (للفهم)']
    };
    const h = y => 225 * Math.pow(L.clamp((y - 50) / 450, 0, 1), 0.45);
    const dia = x => 492 - 42 * Math.sin(Math.PI * L.clamp((Math.abs(x - 300) - 24) / 200, 0, 1));
    const ss = (a, b, x) => { const t = L.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    const med = (y, side) => 24 + 46 * ss(250, 400, y) + (side > 0 ? 28 * Math.exp(-Math.pow((y - 410) / 45, 2)) : 0);
    let gap = 9, showLobes = true;
    const root = S('g', {}, svg);
    function lungPts(side, g) {
      const pts = [], X = (y, o) => 300 + side * (h(y) - o);
      let y = 50;
      while (h(y) - g <= med(y, side) + g && y < 200) y += 1;
      const yTop = y;
      for (y = yTop; y < 520; y += 4) {
        const x = X(y, g);
        if (y >= dia(x) - g) break;
        pts.push([x, y]);
      }
      const xl = pts[pts.length - 1][0];
      const xm = 300 + side * (med(dia(300 + side * 70), side) + g);
      const n = 24;
      for (let i = 1; i <= n; i++) { const x = L.lerp(xl, xm, i / n); pts.push([x, dia(x) - g]); }
      const yb = dia(xm) - g;
      for (y = yb; y > yTop; y -= 4) pts.push([300 + side * (med(y, side) + g), y]);
      return pts;
    }
    const pathOf = pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
    const wallSide = (side, off) => { const a = []; for (let y = 64; y <= 506; y += 6) a.push([300 + side * (h(y) + off), y]); return a; };
    function draw() {
      root.innerHTML = '';
      const defs = S('defs', {}, root);
      const lg = S('radialGradient', { id: 'lungG', cx: '50%', cy: '40%', r: '65%' }, defs);
      S('stop', { offset: '0', style: 'stop-color:var(--tissue)' }, lg);
      S('stop', { offset: '1', style: 'stop-color:var(--tissue-2)' }, lg);
      const rib = S('pattern', { id: 'ribP', width: 10, height: 10, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(35)' }, defs);
      S('rect', { width: 10, height: 10, style: 'fill:var(--bone)' }, rib);
      S('line', { x1: 0, y1: 0, x2: 0, y2: 10, style: 'stroke:var(--muted);stroke-width:1.2;opacity:.5' }, rib);
      // fluid region (inside parietal)
      [-1, 1].forEach(side => {
        const inner = wallSide(side, 0), outer = wallSide(side, 15).reverse();
        const band = S('path', { d: pathOf(inner.concat(outer)), style: 'fill:url(#ribP);stroke:var(--muted);stroke-width:1', class: 'hot', 'data-k': 'wall' }, root);
        const par = wallSide(side, -1);
        const cav = S('path', { d: pathOf(par.concat([[300 + side * 20, 506], [300 + side * 20, 64]])), style: 'fill:var(--co2-soft)', class: 'hot', 'data-k': 'cavity' }, root);
      });
      // mediastinum
      const medPts = [];
      for (let y = 60; y <= 500; y += 6) medPts.push([300 - med(y, -1), y]);
      for (let y = 500; y >= 60; y -= 6) medPts.push([300 + med(y, 1), y]);
      S('path', { d: pathOf(medPts), style: 'fill:var(--surface-2)', class: 'hot', 'data-k': 'med' }, root);
      S('ellipse', { cx: 318, cy: 420, rx: 52, ry: 58, transform: 'rotate(-25 318 420)', style: 'fill:var(--o2-soft);stroke:var(--o2);stroke-width:1.5;opacity:.7', class: 'hot', 'data-k': 'med' }, root);
      // parietal line
      [-1, 1].forEach(side => {
        const par = wallSide(side, -1);
        const d = 'M' + par.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
        S('path', { d, style: 'fill:none;stroke:var(--co2);stroke-width:2.5' }, root);
        S('path', { d, style: 'fill:none;stroke:transparent;stroke-width:12', class: 'hot', 'data-k': 'parietal' }, root);
      });
      // lungs
      [-1, 1].forEach(side => {
        const pts = lungPts(side, gap), d = pathOf(pts);
        S('path', { d, style: 'fill:url(#lungG)', class: 'hot', 'data-k': side < 0 ? 'rlung' : 'llung' }, root);
        // bronchial tree hint
        const hx = 300 + side * 60, g = S('g', { style: 'pointer-events:none', opacity: 0.55 }, root);
        [[side * 40, -70], [side * 85, -10], [side * 70, 60], [side * 30, 110]].forEach(dd => S('path', { d: `M${hx} 250Q${hx + dd[0] * 0.5} ${250 + dd[1] * 0.3} ${hx + dd[0]} ${250 + dd[1]}`, style: 'fill:none;stroke:var(--bone);stroke-width:4;stroke-linecap:round' }, g));
        S('path', { d, style: 'fill:none;stroke:var(--pen-blue);stroke-width:2.2' }, root);
        S('path', { d, style: 'fill:none;stroke:transparent;stroke-width:10', class: 'hot', 'data-k': 'visceral' }, root);
      });
      // fissures + lobe labels
      if (showLobes) {
        const R = (y, o) => 300 - (h(y) - o);
        const fis = (d) => S('path', { d, style: 'fill:none;stroke:var(--tissue-2);stroke-width:2.5;stroke-dasharray:6 4', opacity: 0.9 }, root);
        fis(`M${R(245, gap) + 2} 245Q200 238 ${300 - med(245, -1) - gap - 2} 236`);
        fis(`M${R(305, gap) + 2} 305Q190 380 ${300 - med(455, -1) - gap - 6} 455`);
        fis(`M${600 - R(280, gap) - 2} 280Q410 360 ${300 + med(440, 1) + gap + 6} 440`);
        const lt = (x, y, t) => S('text', { x, y, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700;pointer-events:none', text: t }, root);
        lt(222, 205, 'علوي'); lt(206, 300, 'أوسط'); lt(156, 420, 'سفلي');
        lt(388, 230, 'علوي'); lt(440, 410, 'سفلي');
      }
      // trachea + bronchi
      const tr = S('g', { class: 'hot', 'data-k': 'trachea' }, root);
      S('rect', { x: 287, y: 0, width: 26, height: 212, rx: 6, style: 'fill:var(--bone);stroke:var(--muted);stroke-width:1' }, tr);
      for (let y = 8; y < 205; y += 14) S('line', { x1: 288, y1: y, x2: 312, y2: y, style: 'stroke:var(--muted);stroke-width:2;opacity:.45' }, tr);
      const br = S('g', { class: 'hot', 'data-k': 'bronchus' }, root);
      [-1, 1].forEach(side => {
        const d = `M300 206Q${300 + side * 22} 222 ${300 + side * 62} 252`;
        S('path', { d, style: 'fill:none;stroke:var(--muted);stroke-width:19;stroke-linecap:round' }, br);
        S('path', { d, style: 'fill:none;stroke:var(--bone);stroke-width:16;stroke-linecap:round' }, br);
      });
      // diaphragm
      const dTop = [], dBot = [];
      for (let x = 70; x <= 530; x += 6) { dTop.push([x, dia(x) + 2]); dBot.unshift([x, dia(x) + 20]); }
      S('path', { d: pathOf(dTop.concat(dBot)), style: 'fill:var(--tissue-2);stroke:var(--o2);stroke-width:1', class: 'hot', 'data-k': 'dia' }, root);
      // labels with leaders
      const lab = (x, y, anchor, t, lx, ly) => {
        S('line', { x1: lx, y1: ly, x2: anchor === 'end' ? x + 4 : x - 4, y2: y - 4, style: 'stroke:var(--muted);stroke-width:1' }, root);
        S('circle', { cx: lx, cy: ly, r: 2.5, style: 'fill:var(--ink)' }, root);
        S('text', { x, y, 'text-anchor': anchor, class: 'sv-lbl', style: 'font-size:12.5px;font-weight:600', text: t }, root);
      };
      lab(596, 34, 'end', 'القصبة الهوائية', 313, 60);
      lab(596, 160, 'end', 'الشعبة الهوائية', 352, 245);
      lab(596, 280, 'end', 'جدار الصدر', 300 + h(300) + 9, 300);
      lab(4, 128, 'start', 'غشاء الجنب الجداري', 300 - h(178) + 1, 178);
      lab(4, 178, 'start', 'التجويف الجنبي', 300 - h(218) + gap / 2, 218);
      lab(4, 228, 'start', 'غشاء الجنب الحشوي', 300 - h(262) + gap, 262);
      S('text', { x: 300, y: 538, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700', text: 'الحجاب الحاجز' }, root);
      S('text', { x: 150, y: 538, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700;fill:var(--tissue-2)', text: 'الرئة اليمنى' }, root);
      S('text', { x: 450, y: 538, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700;fill:var(--tissue-2)', text: 'الرئة اليسرى' }, root);
      S('text', { x: 300, y: 556, 'text-anchor': 'middle', class: 'sv-sm', text: 'الرسم من الأمام: يمين الشخص على يسارك' }, root);
    }
    draw();
    svg.addEventListener('click', e => {
      const t = e.target.closest('[data-k]');
      if (!t) return;
      const x = INFO[t.dataset.k];
      info.innerHTML = `<b>${x[0]}</b> <span class="en">${x[1]}</span><br>${x[2]}`;
    });
    const gapBtn = $('#pleuraGap'), lobeBtn = $('#pleuraLobes');
    gapBtn.addEventListener('click', () => {
      const on = gapBtn.getAttribute('aria-pressed') !== 'true';
      gapBtn.setAttribute('aria-pressed', String(on)); gap = on ? 22 : 9; draw();
      info.innerHTML = on ? '<b>التجويف الجنبي مكبَّر للتوضيح.</b> في الحقيقة هو فسحة رقيقة جداً يملؤها السائل الجنبي.' : 'اضغط على أي جزء من الرسم لمعرفة اسمه ووظيفته.';
    });
    lobeBtn.addEventListener('click', () => {
      const on = lobeBtn.getAttribute('aria-pressed') !== 'true';
      lobeBtn.setAttribute('aria-pressed', String(on)); showLobes = on; draw();
    });
  }

  /* احتكاك غشاءي الجنب */
  function frictionSim() {
    const svg = $('#friction'), msg = $('#fricMsg');
    svg.style.direction = 'ltr';
    let mode = 'fluid', pain = 0, gapNow = 26;
    const g = S('g', {}, svg);
    S('rect', { x: 20, y: 22, width: 400, height: 34, rx: 6, style: 'fill:var(--co2-soft);stroke:var(--co2);stroke-width:2' }, g);
    for (let i = 0; i < 8; i++) S('ellipse', { cx: 45 + i * 50, cy: 39, rx: 18, ry: 6, style: 'fill:var(--co2);opacity:.25' }, g);
    S('text', { x: 220, y: 16, 'text-anchor': 'middle', class: 'sv-sm', style: 'font-weight:600', text: 'غشاء الجنب الجداري (ثابت مع جدار الصدر)' }, g);
    const fluid = S('rect', { x: 20, y: 56, width: 400, height: 26, style: 'fill:var(--co2-soft);opacity:.55' }, g);
    const mols = [];
    for (let i = 0; i < 18; i++) mols.push({ el: S('circle', { r: 2.6, style: 'fill:var(--co2);opacity:.6' }, g), x: 25 + Math.random() * 390, y: Math.random(), v: (Math.random() - 0.5) * 30 });
    const visc = S('g', {}, g);
    const vRect = S('rect', { x: 0, y: 0, width: 400, height: 34, rx: 6, style: 'fill:var(--o2-soft);stroke:var(--tissue-2);stroke-width:2' }, visc);
    for (let i = 0; i < 8; i++) S('ellipse', { cx: 25 + i * 50, cy: 17, rx: 18, ry: 6, style: 'fill:var(--tissue-2);opacity:.3' }, visc);
    const vLbl = S('text', { x: 220, y: 0, 'text-anchor': 'middle', class: 'sv-sm', style: 'font-weight:600', text: 'غشاء الجنب الحشوي (يتحرك مع الرئة)' }, g);
    const fLbl = S('text', { x: 430, y: 74, 'text-anchor': 'start', class: 'sv-sm', text: 'السائل الجنبي' }, g);
    const sparks = S('g', {}, g);
    S('text', { x: 470, y: 120, 'text-anchor': 'middle', class: 'sv-sm', text: 'الألم' }, g);
    S('rect', { x: 456, y: 128, width: 28, height: 52, rx: 6, style: 'fill:var(--surface-2);stroke:var(--line)' }, g);
    const painBar = S('rect', { x: 459, y: 177, width: 22, height: 0, rx: 4, style: 'fill:var(--pen)' }, g);
    function setMsg() {
      msg.className = 'status' + (mode === 'dry' ? ' warn' : ' ok');
      msg.innerHTML = mode === 'fluid' ? '<b>مع السائل الجنبي:</b> ينزلق الغشاءان على بعضهما بسهولة في كل شهيق دون احتكاك.' : '<b>بدون السائل:</b> يحتك الغشاءان مع كل شهيق تتمدد فيه الرئة، وهذا يشبه ما يحدث في <b>ذات الجنب</b> (Pleurisy): آلام جنبية خلال الشهيق.';
    }
    L.seg($('#fricSeg'), v => { mode = v; setMsg(); });
    setMsg();
    let last = 0;
    L.loop(svg, (dt, t) => {
      const off = 22 * Math.sin(t * 1.6), vel = Math.abs(Math.cos(t * 1.6));
      gapNow += ((mode === 'fluid' ? 26 : 0) - gapNow) * Math.min(1, dt * 4);
      const y = 56 + gapNow;
      visc.setAttribute('transform', `translate(${(20 + off).toFixed(1)} ${y.toFixed(1)})`);
      vLbl.setAttribute('y', (y + 52).toFixed(1));
      fluid.setAttribute('height', Math.max(0, gapNow).toFixed(1));
      fLbl.setAttribute('opacity', gapNow > 8 ? 1 : 0);
      mols.forEach(m => {
        m.x += m.v * dt; if (m.x < 24 || m.x > 416) m.v *= -1;
        m.el.setAttribute('cx', m.x.toFixed(1)); m.el.setAttribute('cy', (58 + m.y * Math.max(0, gapNow - 4)).toFixed(1));
        m.el.setAttribute('opacity', gapNow > 6 ? 0.6 : 0);
      });
      if (mode === 'dry' && gapNow < 3) {
        pain = Math.min(1, pain + dt * 0.25 * vel);
        if (t - last > 0.12 && vel > 0.4) {
          last = t;
          const x = 30 + Math.random() * 380, sp = S('path', { d: `M${x} 56l5 -6l3 7l5 -6`, style: 'fill:none;stroke:var(--pen);stroke-width:2;stroke-linecap:round' }, sparks);
          setTimeout(() => sp.remove(), 350);
        }
      } else pain = Math.max(0, pain - dt * 0.4);
      painBar.setAttribute('height', (pain * 46).toFixed(1));
      painBar.setAttribute('y', (177 - pain * 46).toFixed(1));
    });
  }

  /* ============ 4. مسار الهواء ============ */
  function airwaySim() {
    const svg = $('#airway'), info = $('#stationInfo'), box = $('#stations');
    svg.style.direction = 'ltr';
    const ST = [
      { n: 'المنخران', p: [150, 46], d: 'يدخل الهواء من فتحتي المنخرين اللذين يعملان على <b>تصفية وترطيب وتعديل درجة حرارة</b> الهواء الداخل.' },
      { n: 'البلعوم', p: [150, 104], d: 'يمر الهواء بعد تجويف الأنف إلى البلعوم.' },
      { n: 'الحنجرة', p: [150, 158], d: 'ثم يمر الهواء بالحنجرة متجهاً إلى القصبة الهوائية.' },
      { n: 'القصبة الهوائية', p: [150, 214], d: 'تحمل الهواء إلى الصدر ثم تتفرع إلى قصبتين.' },
      { n: 'القصبات', p: [222, 300], d: 'تدخل الرئتين وتنتهي بفروع أدق.' },
      { n: 'القصيبات', p: [262, 356], d: 'فروع أدق تشكّل في نهاياتها جيوباً تسمى الأكياس السنخية.' },
      { n: 'الأكياس السنخية', p: [292, 410], d: '<b>Alveolar sacs</b>: تتسع جدرانها مكوّنة الأسناخ.' },
      { n: 'الأسناخ', p: [420, 300], d: '<b>Alveoli</b>: عددها <mark>300 مليون</mark>، قطر الواحدة حوالي <b>0.2 ملم</b>، جدارها صف واحد من الخلايا الطلائية المسطحة يغطيه فلم سائل رطب، وتحيط بها شبكة شعيرات، ومساحتها المتاحة للشعيرات <b>70 م²</b>.' }
    ];
    const path = [ST[0].p, ST[1].p, ST[2].p, ST[3].p, [150, 250], ST[4].p, ST[5].p, ST[6].p, ST[7].p];
    const stIdx = [0, 1, 2, 3, 5, 6, 7, 8];
    const g = S('g', {}, svg);
    const tube = (d, w) => { S('path', { d, style: `fill:none;stroke:var(--muted);stroke-width:${w + 3};stroke-linecap:round;stroke-linejoin:round;opacity:.5` }, g); S('path', { d, style: `fill:none;stroke:var(--bone);stroke-width:${w};stroke-linecap:round;stroke-linejoin:round` }, g); };
    // nose
    S('path', { d: 'M150 18c-14 0-20 10-24 22c-3 9 4 14 12 12c4 6 20 6 24 0c8 2 15-3 12-12c-4-12-10-22-24-22z', style: 'fill:var(--tissue);stroke:var(--tissue-2);stroke-width:2' }, g);
    S('ellipse', { cx: 141, cy: 45, rx: 4.5, ry: 3, style: 'fill:var(--tissue-2)' }, g); S('ellipse', { cx: 159, cy: 45, rx: 4.5, ry: 3, style: 'fill:var(--tissue-2)' }, g);
    ['تصفية', 'ترطيب', 'تدفئة'].forEach((t, i) => {
      const x = 205 + i * 58;
      S('rect', { x: x - 25, y: 28, width: 50, height: 22, rx: 11, style: 'fill:var(--accent-soft);stroke:var(--accent)' }, g);
      S('text', { x, y: 43, 'text-anchor': 'middle', class: 'sv-sm', style: 'fill:var(--accent);font-weight:700', text: t }, g);
    });
    tube('M150 56V250', 14);
    for (let y = 176; y < 248; y += 10) S('line', { x1: 143, y1: y, x2: 157, y2: y, style: 'stroke:var(--muted);stroke-width:2;opacity:.5' }, g);
    S('rect', { x: 139, y: 146, width: 22, height: 22, rx: 5, style: 'fill:var(--bone);stroke:var(--muted);stroke-width:1.5' }, g);
    [-1, 1].forEach(sd => {
      const bx = 150 + sd * 72;
      tube(`M150 250Q${150 + sd * 30} 262 ${bx} 300`, 10);
      tube(`M${bx} 300L${bx - 40 * 1} 356M${bx} 300L${bx + 40} 356`, 6);
      [[bx - 40, 356], [bx + 40, 356]].forEach(b => {
        tube(`M${b[0]} 356L${b[0] - 20} 410M${b[0]} 356L${b[0] + 30} 410`, 4);
        [[b[0] - 20, 410], [b[0] + 30, 410]].forEach(c => {
          for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; S('circle', { cx: c[0] + Math.cos(a) * 9, cy: c[1] + 8 + Math.sin(a) * 9, r: 7, style: 'fill:var(--tissue);stroke:var(--tissue-2);stroke-width:1.2' }, g); }
        });
      });
    });
    // zoom lens
    const zx = 420, zy = 300, zr = 84;
    S('line', { x1: 300, y1: 412, x2: zx - 60, y2: zy + 58, style: 'stroke:var(--muted);stroke-dasharray:4 4' }, g);
    S('line', { x1: 300, y1: 400, x2: zx - 70, y2: zy - 40, style: 'stroke:var(--muted);stroke-dasharray:4 4' }, g);
    const defs = S('defs', {}, svg);
    const cp = S('clipPath', { id: 'zoomClip' }, defs); S('circle', { cx: zx, cy: zy, r: zr }, cp);
    S('circle', { cx: zx, cy: zy, r: zr, style: 'fill:var(--surface);stroke:var(--ink-2);stroke-width:2.5' }, g);
    const zg = S('g', { 'clip-path': 'url(#zoomClip)' }, g);
    S('path', { d: `M${zx} ${zy - 90}V${zy - 30}`, style: 'stroke:var(--bone);stroke-width:18;stroke-linecap:round' }, zg);
    const alv = [[0, -10, 30], [-38, 8, 26], [36, 6, 27], [-14, 40, 26], [22, 42, 25], [-46, 44, 20], [52, 40, 18]];
    alv.forEach(a => S('circle', { cx: zx + a[0], cy: zy + a[1], r: a[2], style: 'fill:var(--tissue);stroke:var(--tissue-2);stroke-width:2' }, zg));
    alv.forEach((a, i) => {
      S('path', { d: `M${zx + a[0] - a[2]} ${zy + a[1]}a${a[2]} ${a[2] * 0.8} 0 0 1 ${a[2] * 2} 0`, style: 'fill:none;stroke:var(--co2);stroke-width:1.6;opacity:.75' }, zg);
      S('path', { d: `M${zx + a[0] - a[2] * 0.9} ${zy + a[1] + 6}a${a[2] * 0.9} ${a[2] * 0.7} 0 0 0 ${a[2] * 1.8} 0`, style: 'fill:none;stroke:var(--o2);stroke-width:1.6;opacity:.75' }, zg);
    });
    S('text', { x: zx, y: zy + zr + 18, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700', text: 'سنخ: قطره 0.2 ملم' }, g);
    // station dots
    const dots = ST.map((s, i) => {
      const c = S('circle', { cx: s.p[0], cy: s.p[1], r: 7, style: 'fill:var(--surface);stroke:var(--accent);stroke-width:3', class: 'hot' }, g);
      c.addEventListener('click', () => go(i));
      return c;
    });
    const lblPos = [[124, 50, 'end'], [124, 108, 'end'], [124, 162, 'end'], [124, 218, 'end'], [238, 296, 'start'], [278, 352, 'start'], [292, 448, 'middle']];
    lblPos.forEach((p, i) => S('text', { x: p[0], y: p[1], 'text-anchor': p[2], class: 'sv-lbl', style: 'font-weight:600', text: ST[i].n }, g));
    const air = S('circle', { r: 8, style: 'fill:var(--co2);stroke:var(--surface);stroke-width:2' }, g);
    // path lengths
    const segs = [];
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) { const l = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]); segs.push(l); total += l; }
    const at = s => { let d = s * total; for (let i = 0; i < segs.length; i++) { if (d <= segs[i]) { const k = d / segs[i]; return [L.lerp(path[i][0], path[i + 1][0], k), L.lerp(path[i][1], path[i + 1][1], k)]; } d -= segs[i]; } return path[path.length - 1]; };
    const sOf = i => { let d = 0; for (let k = 0; k < stIdx[i]; k++) d += segs[k]; return d / total; };
    box.innerHTML = ST.map((s, i) => `<button type="button" aria-pressed="false" data-i="${i}">${s.n}</button>`).join('') + '<button type="button" data-i="play" aria-pressed="true">▶ تشغيل الرحلة</button>';
    const btns = L.$$('button', box);
    let s = 0, playing = !L.reduce, target = null, curSt = -1;
    function setSt(i) {
      if (i === curSt) return;
      curSt = i;
      btns.forEach(b => { if (b.dataset.i !== 'play') b.setAttribute('aria-pressed', String(+b.dataset.i === i)); });
      dots.forEach((d, k) => d.style.fill = k === i ? 'var(--accent)' : 'var(--surface)');
      info.innerHTML = `<b>${ST[i].n}:</b> ${ST[i].d}`;
    }
    function go(i) { playing = false; btns[btns.length - 1].setAttribute('aria-pressed', 'false'); target = sOf(i); setSt(i); }
    btns.forEach(b => b.addEventListener('click', () => {
      if (b.dataset.i === 'play') { playing = !playing; b.setAttribute('aria-pressed', String(playing)); target = null; if (playing && s > 0.99) s = 0; }
      else go(+b.dataset.i);
    }));
    setSt(0);
    L.loop(svg, dt => {
      if (playing) { s += dt * 0.07; if (s > 1.12) s = 0; }
      else if (target !== null) { s += (target - s) * Math.min(1, dt * 4); }
      const p = at(Math.min(1, s));
      air.setAttribute('cx', p[0].toFixed(1)); air.setAttribute('cy', p[1].toFixed(1));
      if (playing) { let k = 0; for (let i = 0; i < ST.length; i++) if (s >= sOf(i) - 0.005) k = i; setSt(k); }
    });
  }

  /* ============ 4. مقطع جدار الحويصلة (شكل 3-3) ============ */
  function wallSim() {
    const svg = $('#wall'), info = $('#wallInfo');
    svg.style.direction = 'ltr';
    const INFO = {
      t1: '<b>الخلايا الطلائية المسطحة (النوع الأول):</b> صف واحد مفروش السايتوبلازم يكوّن جدار السنخ الرقيق، فيسهل انتشار الغازات خلاله.',
      t2: '<b>الخلايا الأكثر سمكاً (النوع الثاني):</b> تحتوي على عدد من الصفائح، وتفرز <mark class="g">البروتينات الفوسفاتية</mark> التي تنظم انتفاخ الرئتين وتبقي القنوات والأسناخ مفتوحة.',
      mac: '<b>خلية لفاوية (بلعمية) كبيرة:</b> من الخلايا التي تحتويها الرئتان. (وفيها أيضاً خلايا حلمية تحتوي الهيبارين، وهستامين ومركبات تشترك في تفاعلات الحساسية.)',
      film: '<b>فلم رقيق من سائل خاص:</b> يغطي الخلايا الطلائية ويجعل سطح السنخ رطباً دائماً.',
      endo: '<b>جدار الوعاء الشعري الرئوي:</b> شبكة الأوعية الشعرية التي تغذي جدار السنخ من الخارج.',
      rbc: '<b>كرية دم حمراء:</b> تأخذ O₂ وتتحد به عن طريق الهيموكلوبين، فيتغير لونها من الداكن إلى الأحمر الزاهي، وتطلق CO₂ إلى السنخ.',
      space: '<b>فراغ الحويصلة (السنخ):</b> يحتوي هواء الأسناخ الغني بالأوكسجين (ضغطه الجزئي حوالي 104 ملم زئبق).'
    };
    const g = S('g', {}, svg);
    S('rect', { x: 0, y: 0, width: 455, height: 118, style: 'fill:var(--surface-2)', class: 'hot', 'data-k': 'space' }, g);
    S('rect', { x: 0, y: 118, width: 455, height: 7, style: 'fill:var(--co2-soft)', class: 'hot', 'data-k': 'film' }, g);
    const t1 = S('g', { class: 'hot', 'data-k': 't1' }, g);
    [55, 160, 265].forEach(x => {
      S('path', { d: `M${x - 56} 132q56 -12 112 0q-56 12 -112 0z`, style: 'fill:var(--tissue);stroke:var(--tissue-2);stroke-width:1.5' }, t1);
      S('ellipse', { cx: x, cy: 132, rx: 13, ry: 4, style: 'fill:var(--tissue-2)' }, t1);
    });
    S('path', { d: 'M315 132q30 -10 55 0q-30 10 -55 0z', style: 'fill:var(--tissue);stroke:var(--tissue-2);stroke-width:1.5' }, t1);
    const t2 = S('g', { class: 'hot', 'data-k': 't2' }, g);
    S('path', { d: 'M372 140q-4 -40 40 -42q44 2 40 42z', style: 'fill:var(--tissue);stroke:var(--tissue-2);stroke-width:1.8' }, t2);
    S('ellipse', { cx: 412, cy: 128, rx: 11, ry: 8, style: 'fill:var(--tissue-2)' }, t2);
    [[392, 116], [430, 114], [400, 132]].forEach(p => { S('circle', { cx: p[0], cy: p[1], r: 5, style: 'fill:none;stroke:var(--ink-2);stroke-width:1.2' }, t2); S('circle', { cx: p[0], cy: p[1], r: 2.2, style: 'fill:none;stroke:var(--ink-2);stroke-width:1' }, t2); });
    S('rect', { x: 0, y: 140, width: 455, height: 8, style: 'fill:var(--line)' }, g);
    const endo = S('g', { class: 'hot', 'data-k': 'endo' }, g);
    [60, 175, 290, 400].forEach(x => { S('path', { d: `M${x - 58} 155q58 -10 116 0q-58 10 -116 0z`, style: 'fill:var(--o2-soft);stroke:var(--o2);stroke-width:1.2' }, endo); S('ellipse', { cx: x, cy: 155, rx: 11, ry: 3.5, style: 'fill:var(--o2);opacity:.7' }, endo); });
    S('rect', { x: 0, y: 162, width: 455, height: 156, style: 'fill:var(--o2-soft);opacity:.45' }, g);
    [60, 175, 290, 400].forEach(x => { S('path', { d: `M${x - 58} 325q58 -10 116 0q-58 10 -116 0z`, style: 'fill:var(--o2);stroke:var(--o2);stroke-width:1.2;opacity:.75' }, endo); S('ellipse', { cx: x, cy: 325, rx: 11, ry: 3.5, style: 'fill:var(--ink);opacity:.55' }, endo); });
    // macrophage
    const mac = S('g', { class: 'hot', 'data-k': 'mac' }, g);
    S('path', { d: 'M70 50c10-22 40-22 46-4c14-4 22 10 12 20c8 12-6 24-20 18c-8 12-32 10-36-4c-14 0-18-20-2-30z', style: 'fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.8' }, mac);
    S('ellipse', { cx: 96, cy: 64, rx: 11, ry: 9, style: 'fill:var(--accent);opacity:.5' }, mac);
    // RBCs
    const rbcs = [];
    for (let i = 0; i < 6; i++) {
      const e = S('ellipse', { rx: 27, ry: 17, class: 'hot', 'data-k': 'rbc' }, g);
      const inner = S('ellipse', { rx: 11, ry: 5, style: 'fill:var(--surface);opacity:.3;pointer-events:none' }, g);
      rbcs.push({ e, inner, x: i * 82, y: 200 + (i % 2) * 70 });
    }
    // labels right
    const lbl = (y, t, ly) => { S('line', { x1: 458, y1: ly, x2: 470, y2: y - 4, style: 'stroke:var(--muted)' }, g); S('text', { x: 474, y, class: 'sv-lbl', style: 'font-size:12.5px;font-weight:600', text: t }, g); };
    lbl(60, 'فراغ الحويصلة', 60); lbl(138, 'جدار الحويصلة', 135); lbl(232, 'وعاء شعري دموي', 236); lbl(290, 'كرية دم حمراء', 290);
    S('line', { x1: 0, y1: 118, x2: 455, y2: 118, style: 'stroke:var(--line)' }, g);
    // gas particles
    const gas = [];
    for (let i = 0; i < 14; i++) gas.push({ k: 'o2', el: S('circle', { r: 4.5, style: 'fill:var(--o2);pointer-events:none' }, g) });
    for (let i = 0; i < 12; i++) gas.push({ k: 'co2', el: S('circle', { r: 4.5, style: 'fill:var(--co2);pointer-events:none' }, g) });
    const rs = L.rnd(4);
    const spawn = (q, first) => {
      q.x = 15 + rs() * 425;
      if (q.k === 'o2') { q.y = first ? rs() * 230 : 6 + rs() * 30; q.vy = 34 + rs() * 16; }
      else { q.y = first ? 120 + rs() * 180 : 230 + rs() * 70; q.vy = -(30 + rs() * 16); }
      q.a = 1;
    };
    gas.forEach(q => spawn(q, true));
    S('text', { x: 20, y: 22, class: 'sv-sm', style: 'font-weight:700;fill:var(--o2)', text: 'O₂ ↓' }, g);
    S('text', { x: 60, y: 22, class: 'sv-sm', style: 'font-weight:700;fill:var(--co2)', text: 'CO₂ ↑' }, g);
    let playing = !L.reduce, show = 'all';
    const playBtn = $('#wallPlay');
    playBtn.textContent = playing ? 'إيقاف مؤقت' : 'تشغيل';
    playBtn.addEventListener('click', () => { playing = !playing; playBtn.textContent = playing ? 'إيقاف مؤقت' : 'تشغيل'; playBtn.setAttribute('aria-pressed', String(playing)); });
    L.seg($('#wallSeg'), v => (show = v));
    svg.addEventListener('click', e => { const t = e.target.closest('[data-k]'); if (t) info.innerHTML = INFO[t.dataset.k]; });
    const mix = x => { const k = L.clamp(x / 455, 0, 1); return k; };
    let t0 = 0;
    function frame(dt) {
      rbcs.forEach(r => {
        r.x += dt * 34; if (r.x > 490) r.x -= 492;
        const k = mix(r.x);
        r.e.setAttribute('cx', r.x.toFixed(1)); r.e.setAttribute('cy', r.y);
        r.inner.setAttribute('cx', r.x.toFixed(1)); r.inner.setAttribute('cy', r.y);
        r.e.style.fill = `color-mix(in srgb, var(--o2) ${Math.round(35 + k * 65)}%, var(--co2))`;
      });
      gas.forEach(q => {
        q.y += q.vy * dt;
        q.x += Math.sin((q.y + q.x) * 0.05) * dt * 8;
        if (q.k === 'o2' && q.y > 250) q.a -= dt * 2.5;
        if (q.k === 'co2' && q.y < 70) q.a -= dt * 1.6;
        if (q.a <= 0) spawn(q, false);
        const vis = show === 'all' || show === q.k;
        q.el.setAttribute('cx', q.x.toFixed(1)); q.el.setAttribute('cy', q.y.toFixed(1));
        q.el.setAttribute('opacity', vis ? Math.max(0, q.a).toFixed(2) : 0);
      });
    }
    frame(0);
    L.loop(svg, dt => { if (playing) frame(dt); });
  }
  L.ready.push(flowSim, savSim, pleuraSim, frictionSim, airwaySim, wallSim);
})();
