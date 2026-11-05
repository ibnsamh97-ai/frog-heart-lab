/* المحاكاة: الأقسام 5–8 */
(function () {
  'use strict';
  const L = window.Lab, S = L.svg, $ = L.$;

  /* ============ 5. الشد السطحي ============ */
  function laplaceSim() {
    const svg = $('#laplace'), msg = $('#lapMsg');
    svg.style.direction = 'ltr';
    const K = 92, A = [170, 150], B = [430, 150], J = [300, 268];
    const defs = S('defs', {}, svg);
    const rg = S('radialGradient', { id: 'alvG', cx: '40%', cy: '35%', r: '70%' }, defs);
    S('stop', { offset: '0', style: 'stop-color:var(--o2-soft)' }, rg);
    S('stop', { offset: '1', style: 'stop-color:var(--tissue)' }, rg);
    const mk = L.arrowDefs(svg, 'lapArrow', 'var(--co2)');
    S('text', { x: 300, y: 28, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-family:var(--f-mono);font-weight:600;font-size:16px', text: 'P = 2T / r' }, svg);
    const duct = S('path', { style: 'fill:none;stroke:var(--bone);stroke-width:24;stroke-linecap:round;stroke-linejoin:round' }, svg);
    const ductO = S('path', { style: 'fill:none;stroke:var(--muted);stroke-width:27;stroke-linecap:round;stroke-linejoin:round;opacity:.45' }, svg);
    svg.insertBefore(ductO, duct);
    const flow = S('path', { style: 'fill:none;stroke:var(--co2);stroke-width:3;stroke-dasharray:8 8', 'marker-end': mk }, svg);
    const c1 = S('circle', { cx: A[0], cy: A[1], style: 'fill:url(#alvG);stroke:var(--tissue-2);stroke-width:2.5' }, svg);
    const c2 = S('circle', { cx: B[0], cy: B[1], style: 'fill:url(#alvG);stroke:var(--tissue-2);stroke-width:2.5' }, svg);
    const surfG = S('g', {}, svg);
    const t1 = S('text', { x: A[0], y: A[1] + 5, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700' }, svg);
    const t2 = S('text', { x: B[0], y: B[1] + 5, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700' }, svg);
    S('text', { x: A[0], y: 384, 'text-anchor': 'middle', class: 'sv-sm', text: 'سنخ صغير' }, svg);
    S('text', { x: B[0], y: 384, 'text-anchor': 'middle', class: 'sv-sm', text: 'سنخ كبير' }, svg);
    S('text', { x: 300, y: 384, 'text-anchor': 'middle', class: 'sv-sm', text: 'قصيبة مشتركة' }, svg);
    const ro = L.readout($('#lapRO'), [{ k: 'r1', label: 'نصف قطر الصغير' }, { k: 'r2', label: 'نصف قطر الكبير' }, { k: 'p1', label: 'ضغط الصغير (2T/r)', cls: 'o2' }, { k: 'p2', label: 'ضغط الكبير (2T/r)', cls: 'co2' }]);
    let surf = false, running = false, r1 = 0.6, r2 = 1.0, collapsed = false, dash = 0, Q = 0;
    const T = r => (surf ? r / 1.0 : 1);
    function reset() { r1 = rSl.get(); r2 = 1.0; collapsed = false; running = false; runBtn.textContent = 'ابدأ'; draw(); setMsg(); }
    function setMsg() {
      if (collapsed) { msg.className = 'status warn'; msg.innerHTML = '<b>ضمر السنخ الصغير</b> ودفع هواءه إلى السنخ الكبير الذي انتفخ، كما في شكل 3‑4. السبب: ضغطه كان أعلى بسبب الشد السطحي.'; return; }
      if (surf) { msg.className = 'status ok'; msg.innerHTML = '<b>مع البروتينات الفوسفاتية:</b> يقل الشد السطحي في السنخ الصغير بقدر صغر حجمه، فيتساوى الضغطان ولا ينتقل الهواء، ويبقى السنخان مفتوحين.'; return; }
      msg.className = 'status'; msg.innerHTML = running ? '<b>الضغط في السنخ الصغير أعلى</b> لأن نصف قطره أصغر، فيندفع الهواء منه إلى السنخ الكبير…' : 'الشد السطحي ثابت في السنخين، فالأصغر نصف قطراً يكون ضغطه أعلى. اضغط «ابدأ» وراقب.';
    }
    function draw() {
      const R1 = Math.max(4, r1 * K), R2 = r2 * K;
      c1.setAttribute('r', R1.toFixed(1)); c2.setAttribute('r', R2.toFixed(1));
      const a = [A[0], A[1] + R1 - 6], b = [B[0], B[1] + R2 - 6];
      const d = `M${a[0]} ${a[1]}Q${a[0]} ${J[1]} ${J[0]} ${J[1]}Q${b[0]} ${J[1]} ${b[0]} ${b[1]}M${J[0]} ${J[1]}V392`;
      duct.setAttribute('d', d); ductO.setAttribute('d', d);
      const p1 = (2 * T(r1)) / r1, p2 = (2 * T(r2)) / r2;
      Q = collapsed ? 0 : 0.35 * (p1 - p2);
      const fd = Q >= 0 ? `M${a[0]} ${a[1] + 18}Q${a[0]} ${J[1] - 4} ${J[0]} ${J[1] - 4}Q${b[0]} ${J[1] - 4} ${b[0]} ${b[1] + 20}` : `M${b[0]} ${b[1] + 20}Q${b[0]} ${J[1] - 4} ${J[0]} ${J[1] - 4}Q${a[0]} ${J[1] - 4} ${a[0]} ${a[1] + 18}`;
      flow.setAttribute('d', fd);
      flow.setAttribute('opacity', Math.abs(Q) > 0.01 && running ? 1 : 0);
      t1.textContent = collapsed ? 'ضامر' : 'P=' + L.f(p1, 2); t1.setAttribute('y', A[1] + 5);
      t2.textContent = 'P=' + L.f(p2, 2);
      ro('r1', L.f(r1, 2)); ro('r2', L.f(r2, 2)); ro('p1', collapsed ? '—' : L.f(p1, 2)); ro('p2', L.f(p2, 2));
      surfG.innerHTML = '';
      if (surf) [[A, R1, 22], [B, R2, 30]].forEach(([c, R, n]) => { for (let i = 0; i < n; i++) { const an = (i / n) * Math.PI * 2; S('circle', { cx: c[0] + Math.cos(an) * (R - 6), cy: c[1] + Math.sin(an) * (R - 6), r: 2.6, style: 'fill:var(--accent)' }, surfG); } });
    }
    const runBtn = $('#lapRun');
    const rSl = L.range('lapR', v => { if (!running) reset(); }, v => v.toFixed(2));
    runBtn.addEventListener('click', () => { if (collapsed) reset(); running = !running; runBtn.textContent = running ? 'إيقاف' : 'ابدأ'; setMsg(); });
    $('#lapReset').addEventListener('click', reset);
    L.seg($('#lapSeg'), v => { surf = v === '1'; reset(); });
    reset();
    L.loop(svg, dt => {
      dash = (dash + dt * 40 * Math.min(3, Math.abs(Q) * 3 + 0.3)) % 16;
      flow.setAttribute('stroke-dashoffset', (-dash).toFixed(1));
      if (!running || collapsed) return;
      const p1 = (2 * T(r1)) / r1, p2 = (2 * T(r2)) / r2;
      const q = 0.35 * (p1 - p2) * dt;
      let v1 = Math.pow(r1, 3) - q, v2 = Math.pow(r2, 3) + q;
      if (v1 < Math.pow(0.12, 3)) { v2 += v1 - Math.pow(0.1, 3); v1 = Math.pow(0.1, 3); collapsed = true; running = false; runBtn.textContent = 'ابدأ'; setMsg(); }
      r1 = Math.cbrt(v1); r2 = Math.cbrt(v2);
      draw();
    });
  }

  /* ============ 6. الشهيق والزفير ============ */
  function mechSim() {
    const svg = $('#mech'), msg = $('#mechMsg');
    svg.style.direction = 'ltr';
    const ro = L.readout($('#mechRO'), [{ k: 'ph', label: 'الحالة' }, { k: 'mus', label: 'العضلات بين الأضلاع' }, { k: 'dia', label: 'الحجاب الحاجز' }, { k: 'p', label: 'ضغط الأسناخ (ملم زئبق)', cls: 'co2' }, { k: 'v', label: 'حجم الرئتين (لتر، تقريبي)', cls: 'ac' }]);
    const SP = 472, Y0 = 96, DY = 33;
    const LEN = [150, 198, 232, 252, 260, 256, 242, 222];
    const abd = S('path', { style: 'fill:var(--surface-2);stroke:none' }, svg);
    const abdT = S('text', { x: 300, y: 458, 'text-anchor': 'middle', class: 'sv-sm', text: 'المحتويات البطنية' }, svg);
    const lung = S('path', { style: 'fill:var(--tissue);stroke:var(--tissue-2);stroke-width:2;stroke-linejoin:round' }, svg);
    const trach = S('path', { d: 'M362 0V100', style: 'stroke:var(--bone);stroke-width:18;stroke-linecap:round' }, svg);
    const mkIn = L.arrowDefs(svg, 'mechA', 'var(--co2)');
    const airA = S('path', { style: 'fill:none;stroke:var(--co2);stroke-width:4', 'marker-end': mkIn }, svg);
    const spine = S('g', {}, svg);
    for (let i = 0; i < 12; i++) S('rect', { x: SP - 4, y: 70 + i * 32, width: 24, height: 27, rx: 5, style: 'fill:var(--bone);stroke:var(--muted);stroke-width:1' }, spine);
    const ribs = LEN.map(() => S('path', { style: 'fill:none;stroke:var(--bone);stroke-width:9;stroke-linecap:round' }, svg));
    const ribO = LEN.map(() => S('path', { style: 'fill:none;stroke:var(--muted);stroke-width:1.2;opacity:.6' }, svg));
    const mus = [];
    for (let i = 0; i < 7; i++) for (let k = 0; k < 3; k++) mus.push({ i, f: 0.35 + k * 0.2, el: S('line', { style: 'stroke:var(--o2);stroke-width:3;stroke-linecap:round' }, svg) });
    const stern = S('path', { style: 'fill:none;stroke:var(--bone);stroke-width:13;stroke-linecap:round' }, svg);
    const diaP = S('path', { style: 'fill:none;stroke:var(--tissue-2);stroke-width:11;stroke-linecap:round' }, svg);
    const lbl = (t) => S('text', { class: 'sv-lbl', style: 'font-weight:700;font-size:12.5px', text: t }, svg);
    const lSp = lbl('العمود الفقري'), lSt = lbl('القص'), lRib = lbl('الأضلاع'), lDia = lbl('الحجاب الحاجز'), lLung = lbl('الرئة');
    lSp.setAttribute('x', SP + 10); lSp.setAttribute('y', 60); lSp.setAttribute('text-anchor', 'middle');
    let mode = 'auto', hold = false, b = 0, t = 0, prevB = 0;
    const holdBtn = $('#mechHold');
    L.seg($('#mechMode'), v => { mode = v; holdBtn.hidden = v !== 'hold'; });
    const press = on => e => { if (e) e.preventDefault(); hold = on; };
    holdBtn.addEventListener('pointerdown', press(true));
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => holdBtn.addEventListener(ev, press(false)));
    holdBtn.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); hold = true; } });
    holdBtn.addEventListener('keyup', () => (hold = false));
    function geo(bb) {
      const th = L.lerp(31, 15, bb) * Math.PI / 180;
      return LEN.map((l, i) => { const y = Y0 + i * DY; return { a: [SP, y], e: [SP - l * Math.cos(th), y + l * Math.sin(th)] }; });
    }
    function quad(a, c, e, t) { const u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * e[0], u * u * a[1] + 2 * u * t * c[1] + t * t * e[1]]; }
    function draw(bb, rate) {
      const R = geo(bb);
      R.forEach((r, i) => {
        const mx = (r.a[0] + r.e[0]) / 2, my = (r.a[1] + r.e[1]) / 2 - 14;
        const d = `M${r.a[0]} ${r.a[1]}Q${mx.toFixed(1)} ${my.toFixed(1)} ${r.e[0].toFixed(1)} ${r.e[1].toFixed(1)}`;
        ribs[i].setAttribute('d', d); ribO[i].setAttribute('d', d);
      });
      const act = mode === 'hold' ? (hold ? 1 : 0) : rate > 0.02 ? 1 : 0;
      mus.forEach(m => {
        const r1 = R[m.i], r2 = R[m.i + 1];
        const p1 = [L.lerp(r1.a[0], r1.e[0], m.f), L.lerp(r1.a[1], r1.e[1], m.f) - 6], p2 = [L.lerp(r2.a[0], r2.e[0], m.f + 0.06), L.lerp(r2.a[1], r2.e[1], m.f + 0.06) - 10];
        m.el.setAttribute('x1', p1[0].toFixed(1)); m.el.setAttribute('y1', p1[1].toFixed(1)); m.el.setAttribute('x2', p2[0].toFixed(1)); m.el.setAttribute('y2', p2[1].toFixed(1));
        m.el.setAttribute('opacity', (0.15 + 0.8 * act).toFixed(2));
      });
      const st = R.slice(0, 7).map(r => [r.e[0] - 2, r.e[1]]);
      stern.setAttribute('d', 'M' + st.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'));
      const A = R[7].e, Bp = [SP - 10, 420];
      const dome = L.lerp(205, 62, bb);
      const C = [(A[0] + Bp[0]) / 2, Math.min(A[1], Bp[1]) - dome];
      diaP.setAttribute('d', `M${A[0].toFixed(1)} ${A[1].toFixed(1)}Q${C[0].toFixed(1)} ${C[1].toFixed(1)} ${Bp[0]} ${Bp[1]}`);
      abd.setAttribute('d', `M${A[0].toFixed(1)} ${A[1].toFixed(1)}Q${C[0].toFixed(1)} ${C[1].toFixed(1)} ${Bp[0]} ${Bp[1]}L${Bp[0]} 470L${A[0].toFixed(1)} 470Z`);
      // lung outline
      const pts = [[362, 102]];
      for (let y = 120; y <= 400; y += 20) pts.push([SP - 16, y]);
      for (let k = 0; k <= 16; k++) { const q = quad(Bp, C, A, k / 16); pts.push([q[0] + (k === 16 ? 14 : 0), q[1] - 12]); }
      for (let i = 6; i >= 0; i--) pts.push([st[i][0] + 18, st[i][1] - (i === 0 ? 6 : 0)]);
      lung.setAttribute('d', 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z');
      lSt.setAttribute('x', (st[3][0] - 14).toFixed(1)); lSt.setAttribute('y', st[3][1].toFixed(1)); lSt.setAttribute('text-anchor', 'end');
      lRib.setAttribute('x', (R[1].e[0] + 70).toFixed(1)); lRib.setAttribute('y', (R[1].e[1] - 6).toFixed(1));
      const dm = quad(A, C, Bp, 0.5);
      lDia.setAttribute('x', dm[0].toFixed(1)); lDia.setAttribute('y', (dm[1] + 30).toFixed(1)); lDia.setAttribute('text-anchor', 'middle');
      lLung.setAttribute('x', '395'); lLung.setAttribute('y', '250'); lLung.setAttribute('text-anchor', 'middle');
      const f = L.clamp(Math.abs(rate) / 0.6, 0, 1);
      airA.setAttribute('d', rate >= 0 ? 'M362 8V70' : 'M362 70V8');
      airA.setAttribute('opacity', f.toFixed(2));
    }
    let lastPh = '';
    L.loop(svg, dt => {
      t += dt;
      if (mode === 'auto') { const p = (t % 5) / 5; b = p < 0.4 ? L.ease(p / 0.4) : 1 - L.ease((p - 0.4) / 0.6); }
      else b += (hold ? (1 - b) * 1.8 : -b * 1.3) * dt;
      const rate = dt > 0 ? (b - prevB) / dt : 0;
      prevB = b;
      draw(b, rate);
      const insp = mode === 'hold' ? hold : rate > 0.02;
      const exp = !insp && rate < -0.02;
      const ph = insp ? 'شهيق' : exp ? 'زفير' : 'راحة';
      ro('ph', ph);
      ro('mus', insp ? 'تتقلص' : 'ترتخي');
      ro('dia', insp ? 'يتقلص ويستوي' : exp ? 'يرتخي ويتحدب' : (b > 0.5 ? 'مستوٍ' : 'محدب'));
      const P = L.clamp(-rate / 0.75, -1, 1);
      ro('p', (P > 0.02 ? '+' : P < -0.02 ? '−' : '') + L.f(Math.abs(P), 1));
      ro('v', L.f(2.4 + 0.5 * b, 2));
      if (ph !== lastPh) {
        lastPh = ph;
        if (ph === 'شهيق') { msg.className = 'status ok'; msg.innerHTML = '<b>شهيق (عملية إيجابية تحتاج طاقة):</b> تتقلص العضلات بين الأضلاع فتصبح الأضلاع أفقية وتتقدم نهاياتها للأمام، ويتقلص الحجاب فيستوي. يتوسع الصدر فينخفض الضغط داخل الأسناخ ويدخل الهواء.'; }
        else if (ph === 'زفير') { msg.className = 'status'; msg.innerHTML = '<b>زفير (عملية سلبية):</b> ترتخي العضلات التنفسية وترجع الأضلاع والحجاب الحاجز إلى وضعها الطبيعي، فيقل حجم الصدر والرئتين ويرتفع الضغط ويخرج الهواء.'; }
        else { msg.className = 'status'; msg.innerHTML = mode === 'hold' ? 'اضغط مطولاً على الزر لتقلّص العضلات وتبدأ الشهيق، ثم اتركه ليحدث الزفير وحده.' : 'نهاية الزفير: العضلات مرتخية والضغط داخل الأسناخ مساوٍ للضغط الجوي.'; }
      }
    });
  }

  /* ============ 7. جهاز قياس التنفس ============ */
  function spiroSim() {
    const dev = $('#spiroDev'), cv = $('#spiroCv'), msg = $('#spiroMsg');
    dev.style.direction = 'ltr';
    const VOL = { m: { tv: 0.5, irv: 3.3, erv: 1.0, rv: 1.2 }, f: { tv: 0.5, irv: 1.9, erv: 0.7, rv: 1.1 } };
    let sex = 'm', v = VOL.m, FRC = v.rv + v.erv, V = FRC, queue = [], seg = null, samples = [], time = 0, hover = null, mark = null;
    const lv = () => ({ tlc: FRC + v.tv + v.irv, top: FRC + v.tv, frc: FRC, rv: v.rv });
    // ---- device drawing
    const g = S('g', {}, dev);
    S('rect', { x: 60, y: 210, width: 240, height: 190, rx: 6, style: 'fill:var(--surface-2);stroke:var(--ink-2);stroke-width:2.5' }, g);
    S('rect', { x: 62, y: 250, width: 236, height: 148, style: 'fill:var(--co2-soft)' }, g);
    for (let i = 0; i < 6; i++) S('path', { d: `M${70 + i * 38} 254q9 -4 18 0`, style: 'fill:none;stroke:var(--co2);stroke-width:1.5;opacity:.5' }, g);
    const bell = S('g', {}, g);
    S('rect', { x: 95, y: 0, width: 170, height: 190, rx: 4, style: 'fill:var(--surface);stroke:var(--ink-2);stroke-width:2.5;opacity:.95' }, bell);
    S('text', { x: 180, y: 70, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-weight:700', text: '2' }, bell);
    S('text', { x: 180, y: 90, 'text-anchor': 'middle', class: 'sv-sm', text: 'خزان الهواء' }, bell);
    const bellWater = S('rect', { x: 62, y: 250, width: 236, height: 6, style: 'fill:var(--co2-soft);opacity:.85' }, g);
    S('path', { d: 'M178 404V232M186 404V232', style: 'fill:none;stroke:var(--ink-2);stroke-width:2.5' }, g);
    S('path', { d: 'M182 404V416H342V346', style: 'fill:none;stroke:var(--ink-2);stroke-width:9;stroke-linejoin:round;opacity:.85' }, g);
    S('path', { d: 'M182 404V416H342V346', style: 'fill:none;stroke:var(--surface-2);stroke-width:5;stroke-linejoin:round' }, g);
    S('text', { x: 346, y: 430, class: 'sv-sm', style: 'font-weight:700', 'text-anchor': 'start', text: '1 أنبوبة التنفس' }, g);
    // person
    S('path', { d: 'M372 286c-22 0-34 18-34 38c0 8 -8 14 -6 20l10 2c0 10 2 20 14 22l2 26h40l-2-40c14-10 18-26 14-40c-4-18-18-28-38-28z', style: 'fill:var(--tissue);stroke:var(--tissue-2);stroke-width:2' }, g);
    // pulley & pen
    S('circle', { cx: 180, cy: 36, r: 24, style: 'fill:var(--surface);stroke:var(--ink-2);stroke-width:2.5' }, g);
    S('circle', { cx: 180, cy: 36, r: 5, style: 'fill:var(--ink-2)' }, g);
    const string1 = S('line', { x1: 180, y1: 36, x2: 180, y2: 120, style: 'stroke:var(--ink-2);stroke-width:1.6' }, g);
    const string2 = S('line', { x1: 156, y1: 36, x2: 40, y2: 36, style: 'stroke:var(--ink-2);stroke-width:1.6' }, g);
    S('path', { d: 'M156 36H40', style: 'stroke:var(--ink-2);stroke-width:1.6' }, g);
    const pen = S('g', {}, g);
    S('rect', { x: 30, y: 0, width: 20, height: 30, rx: 3, style: 'fill:var(--ink-2)' }, pen);
    S('path', { d: 'M40 30l-6 10h12z', style: 'fill:var(--o2)' }, pen);
    for (let i = 0; i <= 10; i++) S('line', { x1: 8, y1: 70 + i * 22, x2: i % 5 ? 16 : 22, y2: 70 + i * 22, style: 'stroke:var(--muted);stroke-width:1.5' }, g);
    S('line', { x1: 8, y1: 70, x2: 8, y2: 290, style: 'stroke:var(--muted);stroke-width:1.5' }, g);
    S('text', { x: 6, y: 312, class: 'sv-sm', style: 'font-weight:700', text: '3 لوحة التدرج' }, g);
    function devUpdate() {
      const d = (V - FRC) * 26;
      const bellTop = 96 + d;
      bell.setAttribute('transform', `translate(0 ${bellTop.toFixed(1)})`);
      string1.setAttribute('y2', bellTop.toFixed(1));
      const penY = 150 - d;
      pen.setAttribute('transform', `translate(0 ${(penY - 36).toFixed(1)})`);
      string2.setAttribute('x2', 40);
    }
    // ---- canvas
    const cs = L.canvas(cv, () => drawCv());
    const ZONES = [['irv', 'الاحتياطي للشهيق'], ['tv', 'الحجم المدّي'], ['erv', 'الاحتياطي للزفير'], ['rv', 'الحجم الثالي']];
    function yOf(val, top, bot, vmax) { return bot - (val / vmax) * (bot - top); }
    function drawCv() {
      const { ctx, w, h } = cs, C = L.C;
      ctx.clearRect(0, 0, w, h);
      const right = w < 420 ? 92 : 128, left = 34, top = 14, bot = h - 22;
      const vmax = sex === 'm' ? 6.5 : 4.7, l = lv();
      ctx.fillStyle = C['surface-2']; ctx.fillRect(left, top, w - left - right, bot - top);
      // RV hatch
      const yRV = yOf(l.rv, top, bot, vmax);
      ctx.save(); ctx.beginPath(); ctx.rect(left, yRV, w - left - right, bot - yRV); ctx.clip();
      ctx.strokeStyle = C.line; ctx.lineWidth = 1;
      for (let x = left - 200; x < w; x += 8) { ctx.beginPath(); ctx.moveTo(x, bot); ctx.lineTo(x + (bot - yRV), yRV); ctx.stroke(); }
      ctx.restore();
      // grid + axis
      ctx.font = '11px "IBM Plex Mono", monospace'; ctx.fillStyle = C.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (let k = 0; k <= Math.floor(vmax); k++) { const y = yOf(k, top, bot, vmax); ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(w - right, y); ctx.stroke(); ctx.fillText(k + 'L', left - 4, y); }
      // levels
      const lvl = [[l.tlc, C.accent], [l.top, C.ink], [l.frc, C.ink], [l.rv, C.muted]];
      ctx.setLineDash([5, 4]);
      lvl.forEach(([val, col]) => { const y = yOf(val, top, bot, vmax); ctx.strokeStyle = col; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(w - right + 6, y); ctx.stroke(); });
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      // zone highlight
      const zb = { irv: [l.top, l.tlc], tv: [l.frc, l.top], erv: [l.rv, l.frc], rv: [0, l.rv], vc: [l.rv, l.tlc], tlc: [0, l.tlc] };
      const hz = hover || mark;
      if (hz && zb[hz]) { const [a, b2] = zb[hz]; const y1 = yOf(b2, top, bot, vmax), y2 = yOf(a, top, bot, vmax); ctx.fillStyle = C.hl; ctx.globalAlpha = 0.55; ctx.fillRect(left, y1, w - left - right, y2 - y1); ctx.globalAlpha = 1; }
      // trace
      ctx.save(); ctx.beginPath(); ctx.rect(left, top - 4, w - left - right, bot - top + 8); ctx.clip();
      const win = 26, x0 = left, x1 = w - right;
      ctx.strokeStyle = C.o2; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.beginPath();
      let first = true;
      samples.forEach(s => { const x = x1 - ((time - s[0]) / win) * (x1 - x0); if (x < x0 - 5) return; const y = yOf(s[1], top, bot, vmax); if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y); });
      ctx.stroke(); ctx.restore();
      ctx.fillStyle = C.o2; ctx.beginPath(); ctx.arc(x1, yOf(V, top, bot, vmax), 4, 0, Math.PI * 2); ctx.fill();
      // brackets
      const bx = w - right + 14, bx2 = w - right + (right > 100 ? 70 : 56);
      ctx.lineWidth = 2; ctx.font = '600 11px "IBM Plex Mono", monospace'; ctx.textAlign = 'left';
      const br = (x, a, b2, txt, col, k) => {
        const y1 = yOf(b2, top, bot, vmax) + 1.5, y2 = yOf(a, top, bot, vmax) - 1.5;
        ctx.strokeStyle = col; ctx.globalAlpha = hz && hz !== k ? 0.35 : 1;
        ctx.beginPath(); ctx.moveTo(x - 4, y1); ctx.lineTo(x, y1); ctx.lineTo(x, y2); ctx.lineTo(x - 4, y2); ctx.stroke();
        ctx.fillStyle = col; ctx.textBaseline = 'middle';
        const lines = txt.split('|');
        lines.forEach((tx, i) => ctx.fillText(tx, x + 4, (y1 + y2) / 2 + (i - (lines.length - 1) / 2) * 12));
        ctx.globalAlpha = 1;
      };
      br(bx, l.top, l.tlc, 'IRV|' + v.irv, C.ink, 'irv');
      br(bx, l.frc, l.top, 'TV ' + v.tv, C.ink, 'tv');
      br(bx, l.rv, l.frc, 'ERV|' + v.erv, C.ink, 'erv');
      br(bx, 0, l.rv, 'RV|' + v.rv, C.muted, 'rv');
      br(bx2, l.rv, l.tlc, 'VC|' + L.f(v.tv + v.irv + v.erv, 1), C.accent, 'vc');
      if (right > 100) br(bx2 + 34, 0, l.tlc, 'TLC|' + L.f(l.tlc, 1), C.co2, 'tlc');
      ctx.fillStyle = C.muted; ctx.font = '11px "Cairo", "Almarai", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('الزمن ←', (left + w - right) / 2, h - 8);
    }
    L.onTheme.push(drawCv);
    // hover zones → table rows
    const rows = L.$$('#volTable tbody tr');
    function setRow(k) { rows.forEach(r => r.classList.toggle('on', r.dataset.k === k)); }
    cv.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect(), y = e.clientY - r.top;
      const top = 14, bot = cs.h - 22, vmax = sex === 'm' ? 6.5 : 4.7, val = ((bot - y) / (bot - top)) * vmax, l = lv();
      hover = val > l.tlc || val < 0 ? null : val > l.top ? 'irv' : val > l.frc ? 'tv' : val > l.rv ? 'erv' : 'rv';
      setRow(hover || mark);
    });
    cv.addEventListener('pointerleave', () => { hover = null; setRow(mark); });
    L.$$('#volTable tbody tr').forEach(r => { r.addEventListener('mouseenter', () => { hover = r.dataset.k; setRow(hover); }); r.addEventListener('mouseleave', () => { hover = null; setRow(mark); }); });
    // ---- maneuvers
    const push = (to, dur, extra) => queue.push(Object.assign({ to, dur }, extra || {}));
    function normal() { const l = lv(); push(l.top, 1.7); push(l.frc, 2.3); }
    const MSG = {
      irv: () => `<b>أعمق شهيق:</b> صعد المؤشر <b>${v.irv} لتر</b> فوق نهاية الشهيق الاعتيادي. هذا هو <mark>الحجم الاحتياطي للشهيق</mark> (IRV).`,
      erv: () => `<b>أعمق زفير:</b> نزل المؤشر <b>${v.erv} لتر</b> تحت نهاية الزفير الاعتيادي. هذا هو <mark>الحجم الاحتياطي للزفير</mark> (ERV). ويبقى في الرئتين <b>${v.rv} لتر</b> لا يخرج أبداً، وهو الحجم الثالي.`,
      vc: () => `<b>السعة الحيوية:</b> من أعمق شهيق إلى أعمق زفير = ${v.irv} + ${v.tv} + ${v.erv} = <mark>${L.f(v.tv + v.irv + v.erv, 1)} لتر</mark>. ومع الحجم الثالي (${v.rv}) تصبح السعة الكلية ${L.f(lv().tlc, 1)} لتر.`
    };
    function act(a) {
      const l = lv();
      queue = []; seg = null;
      if (a === 'normal') { mark = 'tv'; setRow('tv'); msg.innerHTML = `<b>تنفس اعتيادي:</b> يتجدد في كل حركة <mark>${v.tv * 1000} سم³</mark>، وهو الحجم المدّي.`; return; }
      if (a === 'in') { push(l.frc, 0.9); push(l.top, 1.4); push(l.tlc, 2.4, { m: 'irv' }); push(l.tlc, 0.6); push(l.frc, 2.6); }
      if (a === 'out') { push(l.frc, 1); push(l.rv, 2.4, { m: 'erv' }); push(l.rv, 0.6); push(l.frc, 1.8); }
      if (a === 'vc') { push(l.frc, 0.9); push(l.tlc, 2.8); push(l.tlc, 0.4); push(l.rv, 3.6, { m: 'vc' }); push(l.rv, 0.4); push(l.frc, 2); }
      msg.innerHTML = 'جارٍ القياس… راقب المؤشر على المخطط.';
    }
    L.$$('#spiroBtns button').forEach(b => b.addEventListener('click', () => act(b.dataset.a)));
    L.seg($('#spiroSex'), s => { sex = s; v = VOL[s]; FRC = v.rv + v.erv; V = FRC; samples = []; queue = []; seg = null; mark = null; setRow(null); drawCv(); msg.innerHTML = s === 'm' ? 'رجل بالغ: السعة الحيوية 4.8 لتر والسعة الكلية 6 لتر.' : 'امرأة بالغة: السعة الحيوية 3.1 لتر والسعة الكلية 4.2 لتر.'; });
    let acc = 0;
    L.loop(cv, dt => {
      time += dt;
      if (!seg) { if (!queue.length) normal(); seg = queue.shift(); seg.from = V; seg.t = 0; }
      seg.t += dt / seg.dur;
      V = L.lerp(seg.from, seg.to, L.ease(Math.min(1, seg.t)));
      if (seg.t >= 1) { if (seg.m) { mark = seg.m; setRow(mark); msg.innerHTML = MSG[seg.m](); } seg = null; }
      acc += dt;
      if (acc > 1 / 30) { acc = 0; samples.push([time, V]); if (samples.length > 1200) samples.splice(0, 200); }
      devUpdate();
      drawCv();
    });
    devUpdate();
    // dead space bar
    const dsv = $('#dead'); dsv.style.direction = 'ltr';
    const W0 = 20, W1 = 500, xs = W0 + (W1 - W0) * 0.3;
    S('rect', { x: W0, y: 30, width: xs - W0, height: 34, rx: 6, style: 'fill:var(--surface-2);stroke:var(--muted)' }, dsv);
    S('rect', { x: xs, y: 30, width: W1 - xs, height: 34, rx: 6, style: 'fill:var(--o2-soft);stroke:var(--o2)' }, dsv);
    S('text', { x: (W0 + xs) / 2, y: 52, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-family:var(--f-mono);font-weight:700', text: '150' }, dsv);
    S('text', { x: (xs + W1) / 2, y: 52, 'text-anchor': 'middle', class: 'sv-lbl', style: 'font-family:var(--f-mono);font-weight:700;fill:var(--o2)', text: '350' }, dsv);
    S('text', { x: (W0 + xs) / 2, y: 86, 'text-anchor': 'middle', class: 'sv-sm', text: 'الحيز الميت: الأنف والرغامي والقصبات' }, dsv);
    S('text', { x: (xs + W1) / 2, y: 86, 'text-anchor': 'middle', class: 'sv-sm', text: 'يصل إلى الأسناخ ويحدث فيه التبادل الغازي' }, dsv);
    S('text', { x: 260, y: 18, 'text-anchor': 'middle', class: 'sv-sm', style: 'font-weight:700', text: 'الحجم المدّي 500 سم³' }, dsv);
    S('text', { x: 260, y: 110, 'text-anchor': 'middle', class: 'sv-sm', text: 'لذلك تهوية الأسناخ (4.2 لتر/د) أقل من حجم الدقيقة (6 لتر/د)' }, dsv);
    // VC by body surface
    const bro = L.readout($('#bsaRO'), [{ k: 'm', label: 'السعة الحيوية للرجل (2.64 لتر/م²)', cls: 'co2' }, { k: 'f', label: 'السعة الحيوية للمرأة (2.09 لتر/م²)', cls: 'o2' }]);
    const bsa = x => { bro('m', L.f(2.64 * x, 2) + ' L'); bro('f', L.f(2.09 * x, 2) + ' L'); };
    L.range('bsa', bsa, x => x.toFixed(2)); bsa(1.8);
  }

  /* ============ 8. معدل التنفس ============ */
  function rateSim() {
    const G = [
      { k: 'nb', t: 'حديث الولادة', r: 55, rg: '40–70', sex: false, d: 0.7 },
      { k: 'c5', t: '5 سنوات', r: 25, rg: '25', sex: false, d: 0.8 },
      { k: 'c15', t: '15 سنة', r: 20, rg: '20', sex: false, d: 0.9 },
      { k: 'm30', t: 'بعمر 30', r: 16, rg: '16', sex: true, d: 1 },
      { k: 'ad', t: 'بالغ', r: 15, rg: '12–18', sex: true, d: 1 },
      { k: 'old', t: 'كبير السن', r: 16, rg: 'غير منتظم', sex: true, d: 0.9, irr: true },
      { k: 'sl', t: 'نائم', r: 12, rg: 'أقل من اليقظة', sex: true, d: 0.9 },
      { k: 'ex', t: 'رياضة', r: 100, rg: 'قد يصل إلى 100', sex: true, d: 1.4 }
    ];
    $('#rateSeg').innerHTML = G.map((g, i) => `<button type="button" data-v="${g.k}" aria-pressed="${g.k === 'ad'}">${g.t}</button>`).join('');
    const cs = L.canvas($('#rateCv'));
    const ro = L.readout($('#rateRO'), [{ k: 'r', label: 'المعدل في المحاكاة (حركة/د)', cls: 'ac' }, { k: 'rg', label: 'حسب الكتاب' }, { k: 'p', label: 'زمن الحركة الواحدة (ثانية)' }]);
    let cur = G[4], fem = false, phase = 0, t = 0, samples = [];
    const rateNow = () => cur.r + (fem && cur.sex ? 3 : 0);
    function upd() {
      const r = rateNow();
      ro('r', cur.irr ? '≈ ' + r : r);
      ro('rg', cur.rg + (fem && cur.sex ? ' (+2–4 للأنثى)' : ''));
      ro('p', L.f(60 / r, 1));
    }
    L.seg($('#rateSeg'), k => { cur = G.find(g => g.k === k); upd(); });
    L.seg($('#rateSex'), s => { fem = s === 'f'; upd(); });
    upd();
    L.loop($('#rateCv'), dt => {
      t += dt;
      let r = rateNow(), amp = cur.d;
      if (cur.irr) { r *= 1 + 0.35 * Math.sin(t * 0.7) + 0.2 * Math.sin(t * 1.9); amp *= 0.75 + 0.35 * Math.sin(t * 0.43 + 1); if (Math.sin(t * 0.31) > 0.93) r *= 0.1; }
      phase += dt * r / 60;
      samples.push([t, amp * (1 - Math.cos(phase * Math.PI * 2)) / 2]);
      if (samples.length > 900) samples.splice(0, 100);
      const { ctx, w, h } = cs, C = L.C;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C['surface-2']; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = C.line; ctx.lineWidth = 1;
      const win = 12;
      for (let s = Math.ceil(t - win); s <= t; s++) { const x = w - ((t - s) / win) * w; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      ctx.strokeStyle = C.co2; ctx.lineWidth = 2.4; ctx.beginPath();
      samples.forEach((s, i) => { const x = w - ((t - s[0]) / win) * w, y = h - 18 - s[1] * (h - 40) / 1.5; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
      ctx.fillStyle = C.muted; ctx.font = '11px "Cairo", "Almarai", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('كل خط رأسي = ثانية', 8, 14);
      // breathing chest icon
      const last = samples[samples.length - 1][1];
      ctx.fillStyle = C.tissue; ctx.strokeStyle = C['tissue-2'];
      const cx = w - 34, cy = 40, rr = 14 + last * 9;
      ctx.beginPath(); ctx.ellipse(cx - 9, cy, rr * 0.6, rr, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx + 9, cy, rr * 0.6, rr, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
    // minute volume
    const mv = $('#mvBar'); mv.style.direction = 'ltr';
    const mro = L.readout($('#mvRO'), [{ k: 'mv', label: 'حجم الدقيقة التنفسي (لتر/د)', cls: 'co2' }, { k: 'av', label: 'تهوية الأسناخ (لتر/د)', cls: 'o2' }, { k: 'ds', label: 'يضيع في الحيز الميت (لتر/د)' }]);
    const bars = S('g', {}, mv);
    let R = 12, TV = 500;
    function calc() {
      const MV = R * TV / 1000, AV = R * Math.max(0, TV - 150) / 1000;
      mro('mv', L.f(MV, 2)); mro('av', L.f(AV, 2)); mro('ds', L.f(MV - AV, 2));
      bars.innerHTML = '';
      const max = Math.max(12, MV * 1.08), X = x => 130 + (x / max) * 370;
      [[MV, 'حجم الدقيقة', 'var(--co2)', 20], [AV, 'تهوية الأسناخ', 'var(--o2)', 56]].forEach(([val, t, c, y]) => {
        S('rect', { x: 130, y, width: Math.max(1, X(val) - 130), height: 22, rx: 5, style: `fill:${c};opacity:.85` }, bars);
        S('text', { x: 122, y: y + 16, 'text-anchor': 'end', class: 'sv-lbl', style: 'font-weight:600', text: t }, bars);
      });
      [[6, 20, 'الكتاب: 6'], [4.2, 56, 'الكتاب: 4.2']].forEach(([val, y, t]) => {
        S('line', { x1: X(val), y1: y - 4, x2: X(val), y2: y + 26, style: 'stroke:var(--ink);stroke-width:2;stroke-dasharray:3 2' }, bars);
        S('text', { x: X(val) + 4, y: y - 6, class: 'sv-sm', text: t }, bars);
      });
    }
    L.range('mvRate', x => { R = x; calc(); });
    L.range('mvTv', x => { TV = x; calc(); });
    calc();
  }

  /* مصطلحات وصف التنفس */
  function patternSim() {
    const P = [
      { k: 'eu', n: 'يسر التنفس', en: 'Eupnea', say: 'يوبنيا', d: 'التنفس الاعتيادي المادي.', f: t => wave(t, 14, 1) },
      { k: 'hyper', n: 'عسر التنفس', en: 'Hyperpnea', say: 'هايبربنيا', d: 'ازدياد معدل الحركات التنفسية أو عمقها، كالذي يحصل عند إجراء التمارين الرياضية.', f: t => wave(t, 22, 1.8) },
      { k: 'dys', n: 'عسر التنفس الشديد', en: 'Dyspnea', say: 'ديسبنيا', d: 'التنفس الذي يتم بصعوبة، مصحوباً بألم ومشقة شديدين.', f: t => wave(t, 24 + 6 * Math.sin(t * 0.9), 0.9 + 0.5 * Math.sin(t * 0.6)) + 0.12 * Math.sin(t * 31) * (0.5 + 0.5 * Math.sin(t * 1.3)) },
      { k: 'ap', n: 'الاختناق (انقطاع النفس)', en: 'Apnea', say: 'أبنيا', d: 'توقف التنفس المؤقت.', f: t => ((t % 16) > 8.5 && (t % 16) < 15 ? 0 : wave(t, 14, 1)) },
      { k: 'poly', n: 'البهر', en: 'Polypnea', say: 'بوليبنيا', d: 'سرعة وسطحية التنفس، أي تتابعه وتقطعه.', f: t => wave(t, 50, 0.42) }
    ];
    function wave(t, r, a) { return a * (1 - Math.cos((t * r / 60) * Math.PI * 2)) / 2; }
    $('#patSeg').innerHTML = P.map((p, i) => `<button type="button" data-v="${p.k}" aria-pressed="${i === 0}">${p.n}</button>`).join('');
    const info = $('#patInfo'), cs = L.canvas($('#patCv'));
    let cur = P[0], t = 0;
    const show = () => (info.innerHTML = `<b>${cur.n}</b> <span class="en">${cur.en}</span> <span style="color:var(--muted)">(تُلفظ: ${cur.say})</span><br>${cur.d}`);
    L.seg($('#patSeg'), k => { cur = P.find(p => p.k === k); show(); });
    show();
    L.loop($('#patCv'), dt => {
      t += dt;
      const { ctx, w, h } = cs, C = L.C, win = 16;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C['surface-2']; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = C.line; ctx.setLineDash([4, 4]);
      const base = h - 20, sc = (h - 40) / 1.9;
      ctx.beginPath(); ctx.moveTo(0, base - sc); ctx.lineTo(w, base - sc); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.muted; ctx.font = '11px "Cairo", "Almarai", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('مستوى التنفس الاعتيادي', 8, base - sc - 6);
      ctx.strokeStyle = C.o2; ctx.lineWidth = 2.4; ctx.beginPath();
      for (let x = 0; x <= w; x += 2) { const tt = t - ((w - x) / w) * win, y = base - cur.f(tt) * sc; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    });
  }

  L.ready.push(laplaceSim, mechSim, spiroSim, rateSim, patternSim);
})();
