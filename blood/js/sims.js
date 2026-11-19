/* أشكال ومحاكاة ثنائية الأبعاد لمحاضرة فسلجة الدم */
(function () {
  'use strict';
  const lab = window.Lab, $ = lab.$, $$ = lab.$$, S = lab.svg;
  const COL = { blood: '#7a0f1c', rbc: '#5e0b16', clot: '#470812', buffy: '#f3ede2', plasma: '#efc85a', serum: '#f4d983', glass: 'var(--ink-2)', water: '#cfe6fb' };
  let uid = 0;
  function defsOf(svg) { return svg.querySelector('defs') || S('defs', {}, svg); }
  function msg(id, html, kind) { const e = document.getElementById(id); if (!e) return; e.innerHTML = html; e.className = 'status' + (kind ? ' ' + kind : ''); }

  /* أنبوب ثنائي الأبعاد: الطبقات من الأسفل للأعلى */
  function tube2d(p, o) {
    const g = S('g', { class: o.cls || '' }, p);
    const r = o.w / 2, x0 = o.x - r, y0 = o.y, y1 = o.y + o.h;
    const body = `M${x0},${y0} V${y1 - r} A${r},${r} 0 0 0 ${x0 + o.w},${y1 - r} V${y0}`;
    const id = 'tc' + ++uid;
    const cp = S('clipPath', { id }, defsOf(p.ownerSVGElement || p)); S('path', { d: body + 'Z' }, cp);
    const cg = S('g', { 'clip-path': `url(#${id})` }, g);
    S('path', { d: body + 'Z', fill: 'var(--surface)', opacity: 0.6 }, cg);
    const H = o.h * (o.fill || 0.8);
    let yy = y1;
    const els = [];
    (o.layers || []).forEach(L => {
      const hh = H * L.f; yy -= hh;
      let el;
      if (L.clot) {
        let d = `M${x0 - 2},${y1 + 2} V${yy + 6}`;
        for (let i = 0; i <= 10; i++) { const x = x0 + (o.w * i) / 10, y = yy + 4 + Math.sin(i * 1.7 + 0.4) * 4 + (i % 3) * 1.2; d += ` L${x.toFixed(1)},${y.toFixed(1)}`; }
        d += ` V${y1 + 2} Z`;
        el = S('path', { d, fill: L.fill }, cg);
      } else el = S('rect', { x: x0 - 1, y: yy, width: o.w + 2, height: hh + 0.6, fill: L.fill, opacity: L.op || 1 }, cg);
      if (L.key) { el.dataset.k = L.key; el.classList.add('hot-l'); }
      els.push({ el, y0: yy, y1: yy + hh, key: L.key });
    });
    S('path', { d: body, fill: 'none', stroke: o.stroke || 'var(--ink-2)', 'stroke-width': o.sw || 1.6 }, g);
    S('rect', { x: x0 + o.w * 0.16, y: y0 + 8, width: Math.max(2, o.w * 0.09), height: o.h - r - 16, rx: 2, fill: '#fff', opacity: 0.35 }, g);
    if (o.cap) {
      const ch = o.capH || 24;
      S('rect', { x: x0 - 4, y: y0 - ch, width: o.w + 8, height: ch, rx: 4, fill: o.cap }, g);
      S('rect', { x: x0 - 4, y: y0 - 6, width: o.w + 8, height: 6, fill: '#000', opacity: 0.15 }, g);
    }
    return { g, els, x0, y0, y1, H };
  }

  /* ---------- الغلاف: ثلاثة أنابيب ---------- */
  function hero() {
    const svg = $('#heroTubes'); if (!svg) return;
    const t = [
      { x: 330, cap: '#8a5bd6', layers: [{ f: 1, fill: COL.blood }], name: 'دم كامل', sub: 'EDTA' },
      { x: 210, cap: '#8a5bd6', layers: [{ f: 0.45, fill: COL.rbc }, { f: 0.025, fill: COL.buffy }, { f: 0.525, fill: COL.plasma }], name: 'بلازما', sub: 'EDTA + طرد مركزي' },
      { x: 90, cap: '#d8343c', layers: [{ f: 0.47, fill: COL.clot, clot: true }, { f: 0.53, fill: COL.serum }], name: 'مصل', sub: 'بلا مانع تخثر' }
    ];
    t.forEach(o => {
      tube2d(svg, { x: o.x, y: 60, w: 58, h: 235, cap: o.cap, capH: 28, layers: o.layers, fill: 0.78 });
      S('text', { x: o.x, y: 324, 'text-anchor': 'middle', class: 'sv-lbl', 'font-weight': 700, 'font-size': 16, text: o.name }, svg);
      S('text', { x: o.x, y: 344, 'text-anchor': 'middle', class: 'sv-sm', text: o.sub }, svg);
    });
    lab.arrowDefs(svg, 'hA', 'var(--muted)');
    S('path', { d: 'M292 170 H250', stroke: 'var(--muted)', 'stroke-width': 1.6, fill: 'none', 'marker-end': 'url(#hA)' }, svg);
    S('text', { x: 271, y: 160, 'text-anchor': 'middle', class: 'sv-sm', text: 'طرد' }, svg);
    // نسب البلازما
    S('text', { x: 210 + 40, y: 128, 'text-anchor': 'end', class: 'sv-num', text: '55%' }, svg);
    S('text', { x: 210 + 40, y: 252, 'text-anchor': 'end', class: 'sv-num', text: '45%' }, svg);
  }

  /* ---------- أماكن الدم الشعيري ---------- */
  function capSites() {
    const el = $('#capSites'); if (!el) return;
    const C = [
      { t: 'طرف الإصبع', d: 'جانب وسادة رأس الإصبع. نختار عادةً الوسطى أو البنصر.', note: true,
        ic: '<path d="M70 82V34a14 14 0 0 1 28 0v48" fill="var(--tissue)" stroke="var(--tissue-2)" stroke-width="2.5"/><path d="M74 46h20M74 62h20" stroke="var(--tissue-2)" stroke-width="1.5" opacity=".6"/><circle cx="92" cy="30" r="5" fill="var(--blood)"/><path d="M110 22l-12 6" stroke="var(--ink-2)" stroke-width="2" stroke-dasharray="3 3"/>' },
      { t: 'شحمة الأذن', d: 'تُستعمل أحياناً عند البالغين.',
        ic: '<path d="M78 12c24-6 44 12 40 36-2 14-12 18-16 28-4 9-10 12-18 6-6-5-2-12-10-18-8-7-14-14-10-30 2-10 7-19 14-22z" fill="var(--tissue)" stroke="var(--tissue-2)" stroke-width="2.5"/><path d="M90 30c10-2 16 6 14 14-2 7-8 8-10 14" fill="none" stroke="var(--tissue-2)" stroke-width="2"/><circle cx="88" cy="76" r="5" fill="var(--blood)"/>' },
      { t: 'كعب القدم', d: 'بصورة خاصة عند الأطفال حديثي الولادة والرضّع.',
        ic: '<path d="M70 14c16-4 30 2 32 18 2 14-4 24-4 36 0 12 8 16 4 22-6 8-26 8-34 0-8-9-4-22-6-36-2-12-6-34 8-40z" fill="var(--tissue)" stroke="var(--tissue-2)" stroke-width="2.5"/><circle cx="72" cy="78" r="5" fill="var(--blood)"/><circle cx="98" cy="80" r="5" fill="var(--blood)"/>' }
    ];
    el.innerHTML = C.map(c => `<div class="card"><svg class="ic" viewBox="0 0 180 96" aria-hidden="true">${c.ic}</svg><h4>${c.t}</h4><p>${c.d}${c.note ? ' <span class="u-note">للفهم</span>' : ''}</p></div>`).join('');
  }

  /* ---------- الشريان الكعبري ---------- */
  function artery() {
    const svg = $('#arteryFig'); if (!svg) return;
    S('path', { d: 'M520 104 L250 112 C222 113 206 104 186 100 C160 94 128 96 104 104 L30 106 C18 106 14 118 26 120 L100 124 L102 136 L22 140 C10 141 10 154 22 155 L100 156 L100 168 L28 174 C16 175 16 188 28 188 L104 186 C112 196 122 202 140 206 C170 212 200 204 226 196 L250 192 L520 196 Z', fill: 'var(--tissue)', stroke: 'var(--tissue-2)', 'stroke-width': 2 }, svg);
    S('path', { d: 'M186 100 C176 80 160 60 132 48 C122 44 112 52 120 60 C136 74 146 84 156 98', fill: 'var(--tissue)', stroke: 'var(--tissue-2)', 'stroke-width': 2 }, svg);
    S('path', { d: 'M250 112 C254 140 254 168 250 192', fill: 'none', stroke: 'var(--tissue-2)', 'stroke-width': 1.2, 'stroke-dasharray': '4 4' }, svg);
    S('path', { d: 'M520 124 C420 124 320 124 262 126', fill: 'none', stroke: 'var(--o2)', 'stroke-width': 5, 'stroke-linecap': 'round' }, svg);
    S('path', { d: 'M520 178 C420 178 320 178 262 176', fill: 'none', stroke: 'var(--o2)', 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0.45 }, svg);
    const p = S('circle', { cx: 272, cy: 126, r: 9, fill: 'none', stroke: 'var(--o2)', 'stroke-width': 2.5, class: 'pulse' }, svg);
    S('circle', { cx: 272, cy: 126, r: 4, fill: 'var(--o2)' }, svg);
    void p;
    S('path', { d: 'M272 116 V64', stroke: 'var(--ink-2)', 'stroke-width': 1 }, svg);
    S('text', { x: 272, y: 52, 'text-anchor': 'middle', class: 'sv-lbl', 'font-weight': 700, text: 'الشريان الكعبري: نتحسس النبض هنا' }, svg);
    S('text', { x: 430, y: 228, 'text-anchor': 'middle', class: 'sv-sm', text: 'الشريان الزندي (جهة الخنصر)' }, svg);
    S('text', { x: 150, y: 36, 'text-anchor': 'middle', class: 'sv-sm', text: 'الإبهام' }, svg);
    S('text', { x: 250, y: 260, 'text-anchor': 'middle', class: 'sv-sm', text: 'الرسغ، والكف للأعلى' }, svg);
  }

  /* ---------- بطاقات العينات الثلاث ---------- */
  function sampleCards() {
    const el = $('#sampleCards'); if (!el) return;
    const C = [
      { t: 'الدم الكامل', en: 'Whole blood', cap: '#8a5bd6', L: [{ f: 1, fill: COL.blood }],
        li: ['يُجمع في أنبوب فيه مانع تخثر <b>EDTA</b>.', 'يُقلب الأنبوب عدة مرات بعد السحب مباشرة.', 'يبقى سائلاً بكل مكوناته: الكريات الحمر والبيض والصفيحات والبلازما.'], chips: ['CBC', 'ESR', 'HbA1c'] },
      { t: 'البلازما', en: 'Plasma', cap: '#8a5bd6', L: [{ f: 0.45, fill: COL.rbc }, { f: 0.03, fill: COL.buffy }, { f: 0.52, fill: COL.plasma }],
        li: ['دم في أنبوب <b>EDTA</b> يُقلب ثم يُوضع في جهاز الطرد المركزي.', 'ثلاث طبقات: كريات حمر ≈ 45% (هيماتوكريت)، طبقة بيضاء، بلازما ≈ 55%.', 'تُسحب البلازما بالماصة الدقيقة إلى أنابيب نظيفة معنونة.'], chips: ['2–8 °C', '−20 °C'] },
      { t: 'المصل', en: 'Serum', cap: '#d8343c', L: [{ f: 0.47, fill: COL.clot, clot: true }, { f: 0.53, fill: COL.serum }],
        li: ['دم وريدي في أنبوب <b>بلا مانع تخثر</b>، دون رجّ (لتجنب تحلل الدم).', 'يُترك 20–30 دقيقة حتى يتجلط، ثم يُوضع في جهاز الطرد.', 'الخثرة في الأسفل والمصل الأصفر الفاتح في الأعلى، ويُسحب بالماصة الدقيقة.'], chips: ['2–8 °C', '−20 °C'] }
    ];
    el.innerHTML = '';
    C.forEach(c => {
      const card = document.createElement('div'); card.className = 'card sample-card';
      card.innerHTML = `<svg class="tube-ic" viewBox="0 0 200 96" aria-hidden="true"></svg><h4>${c.t}<small>${c.en}</small></h4><ul>${c.li.map(x => `<li>${x}</li>`).join('')}</ul><div class="chips">${c.chips.map(x => `<span>${x}</span>`).join('')}</div>`;
      el.appendChild(card);
      const svg = card.querySelector('svg');
      tube2d(svg, { x: 100, y: 16, w: 26, h: 76, cap: c.cap, capH: 12, layers: c.L, fill: 0.8, sw: 1.3 });
    });
  }

  /* ---------- الفرق بين المصل والبلازما ---------- */
  function diff() {
    const svg = $('#diffFig'); if (!svg) return;
    const INFO = {
      serum: '<b>المصل:</b> سائل أصفر فاتح بلا عوامل تخثر. لا يحتوي على الفايبرينوجين والبروثرومبين لأنها استُهلكت في تكوين الخثرة.',
      clot: '<b>الخثرة (الجلطة):</b> ألياف الفايبرين تحبس داخلها كل الخلايا: الكريات الحمر والبيض والصفيحات. لذلك لا تظهر طبقة بيضاء في أنبوب المصل.',
      plasma: '<b>البلازما:</b> الطبقة العليا بلون أصفر باهت (≈ 55%)، وتحتوي على عوامل التخثر مثل الفايبرينوجين والبروثرومبين، لأن مانع التخثر منع تكوّن الخثرة.',
      buffy: '<b>الطبقة البيضاء (Buffy coat):</b> طبقة رقيقة بين البلازما والكريات الحمر، فيها كريات الدم البيض والصفيحات الدموية.',
      rbc: '<b>كريات الدم الحمر:</b> تترسب في الأسفل لأن كثافتها عالية، وتشكل نحو 45% من حجم الدم (الهيماتوكريت).'
    };
    const A = tube2d(svg, { x: 140, y: 70, w: 92, h: 300, cap: '#d8343c', capH: 34, layers: [{ f: 0.47, fill: COL.clot, clot: true, key: 'clot' }, { f: 0.53, fill: COL.serum, key: 'serum' }] });
    const B = tube2d(svg, { x: 380, y: 70, w: 92, h: 300, cap: '#8a5bd6', capH: 34, layers: [{ f: 0.45, fill: COL.rbc, key: 'rbc' }, { f: 0.03, fill: COL.buffy, key: 'buffy' }, { f: 0.52, fill: COL.plasma, key: 'plasma' }] });
    S('text', { x: 140, y: 26, 'text-anchor': 'middle', class: 'sv-lbl', 'font-weight': 700, 'font-size': 16, text: 'بلا مانع تخثر: طبقتان' }, svg);
    S('text', { x: 380, y: 26, 'text-anchor': 'middle', class: 'sv-lbl', 'font-weight': 700, 'font-size': 16, text: 'مع مانع تخثر: ثلاث طبقات' }, svg);
    const lbl = (x, y, tx, side, key) => {
      const g = S('g', { class: 'hot', 'data-k': key }, svg);
      const x2 = side === 'r' ? x + 26 : x - 26;
      S('path', { d: `M${x},${y} H${x2}`, stroke: 'var(--muted)', 'stroke-width': 1, class: 'hl-stroke' }, g);
      S('text', { x: side === 'r' ? x2 + 4 : x2 - 4, y: y + 4, 'text-anchor': side === 'r' ? 'end' : 'start', class: 'sv-lbl', text: tx }, g);
    };
    const mid = (T, i) => (T.els[i].y0 + T.els[i].y1) / 2;
    lbl(140 - 46, mid(A, 1), 'المصل', 'l', 'serum');
    lbl(140 - 46, mid(A, 0), 'الخثرة', 'l', 'clot');
    lbl(380 + 46, mid(B, 2), 'البلازما', 'r', 'plasma');
    lbl(380 + 46, mid(B, 1), 'Buffy coat', 'r', 'buffy');
    lbl(380 + 46, mid(B, 0), 'كريات حمر', 'r', 'rbc');
    svg.addEventListener('click', e => {
      const t = e.target.closest('[data-k]'); if (!t) return;
      const k = t.dataset.k;
      $$('[data-k]', svg).forEach(n => n.classList.toggle('on', n.dataset.k === k));
      msg('diffMsg', INFO[k]);
    });
  }

  /* ---------- الحفظ: أجزاء أم أنبوب واحد ---------- */
  function aliquot() {
    const svg = $('#aliqFig'); if (!svg) return;
    let mode = 'one', uses = 0, q = 100;
    const parts = [1, 1, 1, 1];
    function draw() {
      svg.innerHTML = '';
      if (mode === 'one') {
        const lvl = Math.max(0, 1 - uses * 0.25);
        tube2d(svg, { x: 420, y: 40, w: 48, h: 140, cap: '#cfd7e0', capH: 16, layers: [{ f: lvl, fill: COL.plasma }], fill: 0.85 });
        S('text', { x: 420, y: 202, 'text-anchor': 'middle', class: 'sv-sm', text: 'أنبوب واحد' }, svg);
      } else {
        parts.forEach((p, i) => {
          const x = 470 - i * 46;
          tube2d(svg, { x, y: 70, w: 26, h: 100, cap: p ? '#cfd7e0' : 'var(--line)', capH: 10, layers: p ? [{ f: 1, fill: COL.plasma }] : [], fill: 0.8, sw: 1.2 });
          if (p) S('text', { x, y: 66, 'text-anchor': 'middle', class: 'sv-sm', text: '❄' }, svg);
        });
        S('text', { x: 400, y: 202, 'text-anchor': 'middle', class: 'sv-sm', text: '4 أجزاء صغيرة' }, svg);
      }
      // مقياس سلامة البروتينات
      const x0 = 30, w = 260;
      S('text', { x: x0 + w, y: 56, 'text-anchor': 'start', class: 'sv-lbl', text: 'سلامة البروتينات والإنزيمات في العينة المتبقية' }, svg);
      S('rect', { x: x0, y: 70, width: w, height: 22, rx: 6, fill: 'var(--surface-2)', stroke: 'var(--line)' }, svg);
      const col = q > 80 ? 'var(--ok)' : q > 55 ? '#d8a900' : 'var(--pen)';
      S('rect', { x: x0 + w * (1 - q / 100), y: 70, width: (w * q) / 100, height: 22, rx: 6, fill: col }, svg);
      S('text', { x: x0 + w / 2, y: 86, 'text-anchor': 'middle', class: 'sv-num', 'font-weight': 700, text: Math.round(q) + '%' }, svg);
      S('text', { x: x0 + w, y: 124, 'text-anchor': 'start', class: 'sv-sm', text: 'مرات التجميد والإذابة: ' + (mode === 'one' ? uses : uses ? 1 : 0) }, svg);
      S('text', { x: x0 + w, y: 146, 'text-anchor': 'start', class: 'sv-sm', text: 'الفحوص المنجزة: ' + uses }, svg);
    }
    function use() {
      if (mode === 'one') {
        if (uses >= 4) return msg('aliqMsg', 'نفدت العينة.', '');
        uses++; q = 100 * Math.pow(0.84, uses);
        msg('aliqMsg', uses === 1 ? 'أذبنا الأنبوب كله لنأخذ منه جزءاً، ثم أعدنا تجميد الباقي.' : `أذبنا وجمّدنا <b>العينة نفسها ${uses} مرات</b>: كل تكرار يغيّر خصائص البروتينات والإنزيمات، فتقل دقة الفحوص التالية.`, uses > 1 ? 'warn' : '');
      } else {
        const i = parts.indexOf(1); if (i < 0) return msg('aliqMsg', 'استعملنا الأجزاء الأربعة.', '');
        parts[i] = 0; uses++; q = 100;
        msg('aliqMsg', 'أذبنا <b>جزءاً واحداً فقط</b> واستعملناه كله، وبقيت الأجزاء الأخرى مجمّدة دون أن تُمسّ. البروتينات سليمة في كل فحص.', 'ok');
      }
      draw();
    }
    function reset() { uses = 0; q = 100; parts.fill(1); msg('aliqMsg', 'اضغط «أذب واستعمل» عدة مرات وقارن بين الطريقتين.', ''); draw(); }
    lab.seg($('#aliqMode'), v => { mode = v; reset(); });
    $('#aliqUse').addEventListener('click', use);
    $('#aliqReset').addEventListener('click', reset);
    reset();
  }

  /* ---------- لون المصل ---------- */
  function colors() {
    const svg = $('#colorFig'); if (!svg) return;
    const C = {
      normal: { c: '#f4d983', op: 0.95, name: 'أصفر باهت صافٍ', m: '<b>طبيعي:</b> لون المصل أو البلازما الطبيعي <b>أصفر صافٍ وباهت</b>. أي اختلاف عن هذا اللون قد يؤثر على نتائج التحاليل.' },
      hemo: { c: '#d0485a', op: 0.9, name: 'وردي إلى أحمر', m: '<b>تحلل الدم (Hemolysis):</b> تكسّر كريات الدم الحمر يجعل اللون <b>وردياً إلى أحمر</b> لخروج الهيموكلوبين منها. من أسبابه رجّ الأنبوب بشدة والسحب السريع بالحقنة.' },
      icteric: { c: '#d99a17', op: 0.95, name: 'أصفر غامق', m: '<b>البيليروبين (Bilirubin):</b> زيادة تركيز البيليروبين تجعل اللون <b>أصفر غامقاً</b>، كما في أمراض الكبد واليرقان. <span class="u-note">للفهم</span>' },
      lipemic: { c: '#f3ead6', op: 1, milky: true, name: 'حليبي عكر', m: '<b>عينة دهنية (Lipemic):</b> زيادة تركيز الدهون (Lipid) تجعل اللون <b>حليبياً غائماً</b>، مثلاً بعد وجبة دسمة. <span class="u-note">للفهم</span>' }
    };
    function draw(k) {
      svg.innerHTML = '';
      const c = C[k];
      const T = tube2d(svg, { x: 400, y: 50, w: 96, h: 250, cap: '#d8343c', capH: 30, layers: [{ f: 0.47, fill: COL.clot, clot: true }, { f: 0.53, fill: c.c, op: c.op }] });
      if (c.milky) { const s = T.els[1]; for (let i = 0; i < 26; i++) S('circle', { cx: 360 + ((i * 37) % 80), cy: s.y0 + 8 + ((i * 53) % Math.max(10, s.y1 - s.y0 - 14)), r: 2.2 + (i % 3), fill: '#fff', opacity: 0.7 }, svg); }
      // دليل الألوان
      Object.keys(C).forEach((kk, i) => {
        const y = 70 + i * 62, on = kk === k;
        const g = S('g', { class: 'hot', 'data-v': kk }, svg);
        S('rect', { x: 40, y, width: 240, height: 48, rx: 10, fill: on ? 'var(--accent-soft)' : 'var(--surface-2)', stroke: on ? 'var(--accent)' : 'var(--line)' }, g);
        S('rect', { x: 236, y: y + 10, width: 32, height: 28, rx: 6, fill: C[kk].c, stroke: 'var(--line)' }, g);
        S('text', { x: 224, y: y + 29, 'text-anchor': 'start', class: 'sv-lbl', 'font-weight': on ? 700 : 500, text: C[kk].name }, g);
      });
      msg('colorMsg', c.m, k === 'normal' ? 'ok' : 'warn');
    }
    const set = lab.seg($('#colorSeg'), v => draw(v));
    svg.addEventListener('click', e => { const t = e.target.closest('[data-v]'); if (t) set(t.dataset.v); });
    draw('normal');
  }

  /* ---------- المواد والأدوات ---------- */
  function mats() {
    const el = $('#mats'); if (!el) return;
    const I = {
      sample: '<path d="M24 6C18 16 11 24 11 31a13 13 0 0 0 26 0c0-7-7-15-13-25z" fill="var(--blood)"/>',
      tubes: '<rect x="10" y="6" width="10" height="7" rx="1.5" fill="#d8343c"/><rect x="28" y="6" width="10" height="7" rx="1.5" fill="#8a5bd6"/><path d="M11 13v22a4 4 0 0 0 8 0V13M29 13v22a4 4 0 0 0 8 0V13" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 26h6v9a3 3 0 0 1-6 0zM30 22h6v13a3 3 0 0 1-6 0z" fill="var(--blood)"/>',
      tq: '<path d="M6 26c0-8 8-13 18-13s18 5 18 13-8 13-18 13S6 34 6 26z" fill="none" stroke="#2a6fd8" stroke-width="5"/><path d="M29 13l9-7" stroke="#2a6fd8" stroke-width="4" stroke-linecap="round"/>',
      syringe: '<path d="M5 43l7-7M12 36l5 5M15 33l15-15 6 6-15 15zM27 15l7 7M33 9l6 6M37 5l6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 30l7-7 3 3-7 7z" fill="var(--blood)"/>',
      cotton: '<path d="M10 34a8 8 0 0 1 3-15 10 10 0 0 1 19-1 8 8 0 0 1 4 16z" fill="var(--surface-2)" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
      alcohol: '<rect x="14" y="14" width="20" height="28" rx="4" fill="#dfeefb" stroke="currentColor" stroke-width="2"/><path d="M19 14V8h10v6" fill="none" stroke="currentColor" stroke-width="2"/><rect x="14" y="24" width="20" height="10" fill="#2f6db3"/><text x="24" y="32" text-anchor="middle" font-size="7.5" font-weight="700" fill="#fff" font-family="IBM Plex Mono">70%</text>',
      centrifuge: '<rect x="6" y="18" width="36" height="22" rx="6" fill="var(--surface-2)" stroke="currentColor" stroke-width="2"/><path d="M8 18c2-8 30-8 32 0" fill="none" stroke="currentColor" stroke-width="2"/><rect x="11" y="28" width="14" height="6" rx="1.5" fill="#0d1f1a"/><circle cx="33" cy="31" r="3" fill="#2fbf71"/>',
      pipette: '<path d="M22 4h6v6h-6zM20 10h10l-1 20h-8zM22 30h6l-2 10h-2z" fill="var(--surface-2)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M24 40l1 5" stroke="var(--plasma)" stroke-width="3" stroke-linecap="round"/>'
    };
    const M = [
      ['sample', 'عينة الدم', 'Blood sample', 'الدم المسحوب من الوريد أو الشريان أو الشعيرات الدموية.'],
      ['tubes', 'أنابيب الاختبار', 'Test tubes', 'أنابيب بأغطية ملوّنة: البنفسجي فيه مانع التخثر EDTA (للدم الكامل والبلازما)، والأحمر بلا مانع تخثر (للمصل).'],
      ['tq', 'تورنيكا', 'Tourniquet', 'رباط ضاغط يُربط على العضد ليحبس الدم في الأوردة فتنتفخ وتظهر.'],
      ['syringe', 'حقنة لسحب الدم', 'Syringe', 'لسحب الدم من الوريد ثم نقله إلى الأنابيب.'],
      ['cotton', 'قطن', 'Cotton', 'مع الكحول للتعقيم، وجافاً للضغط على مكان السحب بعد إخراج الإبرة.'],
      ['alcohol', 'كحول', 'Alcohol 70%', 'لتعقيم الجلد قبل الوخز، ويُترك يجف قبل إدخال الإبرة.'],
      ['centrifuge', 'جهاز الطرد المركزي', 'Centrifuge', 'يدور بسرعة عالية فيفصل مكونات الدم حسب كثافتها: الأثقل يترسب في الأسفل.'],
      ['pipette', 'الماصة الدقيقة', 'Micropipette', 'لسحب البلازما أو المصل بحجم دقيق ونقله إلى أنابيب نظيفة معنونة.']
    ];
    el.innerHTML = M.map(([k, n, en], i) => `<button type="button" class="mat" data-i="${i}" aria-pressed="false"><svg viewBox="0 0 48 48" aria-hidden="true">${I[k]}</svg><span>${n}</span><span class="k">${i + 1}</span></button>`).join('');
    el.addEventListener('click', e => {
      const b = e.target.closest('.mat'); if (!b) return;
      $$('.mat', el).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      const m = M[+b.dataset.i];
      msg('matMsg', `<b>${m[1]}</b> <span class="en">${m[2]}</span> ${m[3]}`);
    });
  }

  /* ---------- حجم الدم ---------- */
  function bloodVol() {
    const ro = lab.readout($('#bwRO'), [{ k: 'kg', label: 'وزن الدم (7%)', cls: 'o2' }, { k: 'l', label: 'حجمه تقريباً' }]);
    lab.range('bw', v => { const kg = v * 0.07; ro('kg', lab.f(kg, 1) + ' kg'); ro('l', lab.f(kg / 1.06, 1) + ' L'); });
    const v = +$('#bw').value, kg = v * 0.07; ro('kg', lab.f(kg, 1) + ' kg'); ro('l', lab.f(kg / 1.06, 1) + ' L');
  }

  /* ---------- مكونات الدم ---------- */
  function comp() {
    const svg = $('#compFig'); if (!svg) return;
    const INFO = {
      plasma: '<b>البلازما (≈ 55%):</b> سائل شفاف يميل إلى الاصفرار، 90% منه ماء، وفيه البروتينات والمواد الغذائية والأملاح والهرمونات. ينقل الماء والأملاح والمواد الغذائية إلى كل الجسم.',
      buffy: '<b>الطبقة البيضاء (أقل من 1%):</b> كريات الدم البيض التي تدافع عن الجسم، والصفيحات الدموية التي تساعد على تخثر الدم.',
      rbc: '<b>كريات الدم الحمر (≈ 45%):</b> أكثر خلايا الدم عدداً، تحمل الهيموكلوبين وتنقل الأوكسجين. نسبة حجمها إلى حجم الدم الكلي تسمى <b>الهيماتوكريت</b> (Hematocrit).'
    };
    const T = tube2d(svg, { x: 390, y: 60, w: 110, h: 380, cap: '#8a5bd6', capH: 36, layers: [{ f: 0.45, fill: COL.rbc, key: 'rbc' }, { f: 0.02, fill: COL.buffy, key: 'buffy' }, { f: 0.53, fill: COL.plasma, key: 'plasma' }], fill: 0.86 });
    const mid = i => (T.els[i].y0 + T.els[i].y1) / 2;
    const item = (y, key, title, sub, icon) => {
      const g = S('g', { class: 'hot', 'data-k': key }, svg);
      S('path', { d: `M330,${y} H290`, stroke: 'var(--muted)', 'stroke-width': 1, class: 'hl-stroke' }, g);
      S('text', { x: 280, y: y - 4, 'text-anchor': 'start', class: 'sv-lbl', 'font-weight': 700, 'font-size': 15, text: title }, g);
      S('text', { x: 280, y: y + 16, 'text-anchor': 'start', class: 'sv-sm', text: sub }, g);
      icon(g, 6, y);
    };
    const rbcIc = (g, x, y) => { S('ellipse', { cx: x + 14, cy: y, rx: 14, ry: 9, fill: '#b3202f' }, g); S('ellipse', { cx: x + 14, cy: y, rx: 6, ry: 3.5, fill: '#7a0f1c' }, g); };
    const wbcIc = (g, x, y) => { S('circle', { cx: x + 12, cy: y, r: 12, fill: '#efe6f6', stroke: '#b9a3d6' }, g); S('path', { d: `M${x + 6},${y - 3} q6 -6 12 0 q-6 4 -2 8 q-6 2 -10 -8z`, fill: '#7a4fb3' }, g); S('circle', { cx: x + 36, cy: y + 2, r: 3.4, fill: '#c9a24a' }, g); S('circle', { cx: x + 44, cy: y - 4, r: 2.8, fill: '#c9a24a' }, g); };
    const plIc = (g, x, y) => { S('path', { d: `M${x + 14},${y - 13} c-6 9 -11 13 -11 18 a11 11 0 0 0 22 0 c0 -5 -5 -9 -11 -18z`, fill: COL.plasma }, g); };
    item(mid(2), 'plasma', 'البلازما ≈ 55%', 'ماء وبروتينات وأملاح ومواد غذائية وهرمونات', plIc);
    item(mid(1), 'buffy', 'الطبقة البيضاء', 'كريات بيض وصفيحات دموية (أقل من 1%)', wbcIc);
    item(mid(0), 'rbc', 'كريات الدم الحمر ≈ 45%', 'الهيماتوكريت', rbcIc);
    svg.addEventListener('click', e => {
      const t = e.target.closest('[data-k]'); if (!t) return;
      $$('[data-k]', svg).forEach(n => n.classList.toggle('on', n.dataset.k === t.dataset.k));
      msg('compMsg', INFO[t.dataset.k]);
    });
    msg('compMsg', 'يتكون الدم من <b>البلازما</b>، و<b>كريات الدم الحمر</b>، و<b>كريات الدم البيض</b>، و<b>الصفيحات الدموية</b>. اضغط على أي طبقة.');
  }

  /* ---------- تركيب البلازما ---------- */
  function plasma() {
    const svg = $('#plasmaFig'); if (!svg) return;
    let open = 'prot';
    const PARTS = [
      { k: 'water', f: 90, c: '#7fb8ea', n: 'ماء 90%' },
      { k: 'prot', f: 7, c: '#e0a33a', n: 'بروتينات 7%' },
      { k: 'other', f: 3, c: '#8fcf8a', n: 'أخرى' }
    ];
    const INFO = {
      water: '<b>الماء (90% من البلازما):</b> له دور كبير في المحافظة على درجة حرارة الجسم عند 37 °C، وفي نقل المواد الذائبة.',
      prot: '<b>بروتينات البلازما (7%، أي 7 غم لكل 100 سم³):</b> أهمها الألبومين والكلوبيولين والفايبرينوجين. النسب بينها تقريبية <span class="u-note">للفهم</span>.',
      other: '<b>مواد أخرى:</b> مواد غذائية ممتصة من الأمعاء (الكلوكوز، الأحماض الأمينية، الأحماض الدهنية)، وأملاح غير عضوية (الصوديوم، البوتاسيوم، المغنيسيوم، الكالسيوم)، وإفرازات الغدد الصماء (الهرمونات).'
    };
    function draw() {
      svg.innerHTML = '';
      const x0 = 20, w = 480, y = 46, h = 46;
      let x = x0 + w;
      PARTS.forEach(p => {
        const ww = (w * p.f) / 100; x -= ww;
        const g = S('g', { class: 'hot', 'data-k': p.k }, svg);
        S('rect', { x, y, width: ww, height: h, fill: p.c, stroke: open === p.k ? 'var(--ink)' : 'var(--surface)', 'stroke-width': open === p.k ? 2.5 : 1.5, class: 'hl-stroke' }, g);
        p.x = x; p.w = ww;
      });
      const pw = PARTS[0];
      S('text', { x: pw.x + pw.w / 2, y: y + 29, 'text-anchor': 'middle', class: 'sv-lbl', 'font-weight': 700, fill: '#0b2440', text: 'ماء 90%' }, svg);
      S('text', { x: PARTS[1].x + PARTS[1].w / 2, y: y - 10, 'text-anchor': 'middle', class: 'sv-sm', 'font-weight': 700, text: 'بروتينات 7%' }, svg);
      S('text', { x: PARTS[2].x + PARTS[2].w / 2 - 6, y: y + h + 18, 'text-anchor': 'middle', class: 'sv-sm', text: '3%' }, svg);
      const by = 170;
      if (open === 'prot') {
        const P = [{ n: 'الألبومين', f: 60, c: '#e8b14f' }, { n: 'الكلوبيولين', f: 36, c: '#c98a2a' }, { n: 'الفايبرينوجين', f: 4, c: '#8f5a12' }];
        S('path', { d: `M${PARTS[1].x},${y + h} L${x0},${by} M${PARTS[1].x + PARTS[1].w},${y + h} L${x0 + w},${by}`, stroke: 'var(--muted)', 'stroke-dasharray': '3 3', fill: 'none' }, svg);
        let xx = x0 + w;
        P.forEach(p => {
          const ww = (w * p.f) / 100; xx -= ww;
          S('rect', { x: xx, y: by, width: ww, height: 40, fill: p.c, stroke: 'var(--surface)', 'stroke-width': 1.5 }, svg);
          if (p.f > 10) S('text', { x: xx + ww / 2, y: by + 25, 'text-anchor': 'middle', class: 'sv-lbl', 'font-weight': 700, fill: '#2b1700', text: p.n }, svg);
          else S('text', { x: xx + ww / 2 + 6, y: by + 62, 'text-anchor': 'start', class: 'sv-sm', text: p.n }, svg);
        });
      } else if (open === 'other') {
        const L = [['مواد غذائية', 'كلوكوز، أحماض أمينية ودهنية'], ['أملاح', 'Na · K · Mg · Ca'], ['هرمونات', 'إفرازات الغدد الصماء']];
        S('path', { d: `M${PARTS[2].x + PARTS[2].w / 2},${y + h} V${by - 6}`, stroke: 'var(--muted)', 'stroke-dasharray': '3 3' }, svg);
        L.forEach((l, i) => {
          const bx = x0 + w - (i + 1) * 160 + 6;
          S('rect', { x: bx, y: by, width: 150, height: 62, rx: 10, fill: 'var(--surface-2)', stroke: 'var(--line)' }, svg);
          S('text', { x: bx + 140, y: by + 24, 'text-anchor': 'start', class: 'sv-lbl', 'font-weight': 700, text: l[0] }, svg);
          S('text', { x: bx + 140, y: by + 46, 'text-anchor': 'start', class: 'sv-sm', text: l[1] }, svg);
        });
      } else {
        S('text', { x: x0 + w / 2, y: by + 26, 'text-anchor': 'middle', class: 'sv-sm', text: 'يحافظ على درجة حرارة الجسم عند 37 °C' }, svg);
      }
      msg('plasmaMsg', INFO[open]);
    }
    svg.addEventListener('click', e => { const t = e.target.closest('[data-k]'); if (!t) return; open = t.dataset.k; draw(); });
    draw();
  }

  /* ---------- وظائف بروتينات البلازما ---------- */
  function protCards() {
    const el = $('#protCards'); if (!el) return;
    const C = [
      ['1', 'الألبومين', 'Albumin', 'المسؤول الأول عن <b>الضغط الأزموزي</b> للدم، فيحافظ على حجم الدم ويمنع تسرب سوائله إلى الأنسجة، وبهذا يحفظ مستوى ضغط الدم اللازم ليصل الدم إلى كل أعضاء الجسم.'],
      ['2', 'الكلوبيولين', 'Globulin', 'تتكوّن منه <b>الأجسام المضادة</b> التي تحمي الجسم من الميكروبات وسمومها وتعمل على حصانته ضدها.'],
      ['3', 'الفايبرينوجين', 'Fibrinogen', 'يساعد على تكوين <b>الجلطة الدموية</b> عند الإصابة، وهو المسؤول عن <b>لزوجة الدم</b> اللازمة لتكوين المقاومة الطرفية التي تحافظ على ضغط الدم.'],
      ['4', 'مصدر للغذاء', '', 'يمكن لأنسجة الجسم استعمال بروتينات البلازما في تمثيلها الغذائي عند <b>نقص البروتين في الغذاء</b>.'],
      ['5', 'الأس الهيدروجيني', 'pH', 'تساعد على المحافظة على درجة <b>pH</b> الدم بين <b class="num">7.35</b> و<b class="num">7.45</b>.'],
      ['6', 'حمل المواد الحيوية', '', 'تحمل <b>الحديد واليود والكالسيوم</b>، فتحافظ عليها وتمنع تسربها خارج الدم حتى لا تُفقد من الجسم.']
    ];
    el.innerHTML = C.map(c => `<div class="card prot"><h4><span class="pn">${c[0]}</span> ${c[1]} ${c[2] ? `<span class="en">${c[2]}</span>` : ''}</h4><p>${c[3]}</p></div>`).join('');
  }

  /* ---------- مقياس الأس الهيدروجيني ---------- */
  function ph() {
    const svg = $('#phFig'); if (!svg) return;
    const x0 = 20, w = 480, lo = 6.9, hi = 7.8, X = v => x0 + w - ((v - lo) / (hi - lo)) * w;
    function draw(v) {
      svg.innerHTML = '';
      const zone = (a, b, c) => S('rect', { x: X(b), y: 50, width: X(a) - X(b), height: 26, fill: c }, svg);
      zone(lo, 7.35, '#f0b7b7'); zone(7.35, 7.45, '#9fdcb8'); zone(7.45, hi, '#b7cdf0');
      S('rect', { x: x0, y: 50, width: w, height: 26, fill: 'none', stroke: 'var(--line)', rx: 4 }, svg);
      for (let t = 7.0; t <= 7.8001; t += 0.1) { S('path', { d: `M${X(t)},76 v6`, stroke: 'var(--muted)' }, svg); S('text', { x: X(t), y: 98, 'text-anchor': 'middle', class: 'sv-num', text: t.toFixed(1) }, svg); }
      S('text', { x: (X(7.35) + X(7.45)) / 2 + 40, y: 26, 'text-anchor': 'middle', class: 'sv-sm', 'font-weight': 700, text: '7.35–7.45' }, svg);
      S('text', { x: X(7.1), y: 128, 'text-anchor': 'middle', class: 'sv-sm', text: 'حموضة' }, svg);
      S('text', { x: X(7.62), y: 128, 'text-anchor': 'middle', class: 'sv-sm', text: 'قاعدية' }, svg);
      S('path', { d: `M${X(v)},44 l-7,-12 h14z`, fill: 'var(--ink)' }, svg);
      S('path', { d: `M${X(v)},46 V80`, stroke: 'var(--ink)', 'stroke-width': 2.5 }, svg);
      const ok = v >= 7.35 && v <= 7.45;
      msg('phMsg', ok ? `<b>pH ${v.toFixed(2)} طبيعي.</b> بروتينات البلازما من المواد التي تحافظ على الأس الهيدروجيني للدم ضمن هذا المدى الضيق.`
        : v < 7.35 ? `<b>pH ${v.toFixed(2)} أقل من الطبيعي:</b> الدم أكثر حموضة (Acidosis). <span class="u-note">للفهم</span>`
        : `<b>pH ${v.toFixed(2)} أعلى من الطبيعي:</b> الدم أكثر قاعدية (Alkalosis). <span class="u-note">للفهم</span>`, ok ? 'ok' : 'warn');
    }
    lab.range('ph', v => draw(v), v => v.toFixed(2));
    draw(7.4);
  }

  /* ---------- وظائف الدم ---------- */
  function funcs() {
    const el = $('#funcCards'); if (!el) return;
    const ic = {
      resp: '<path d="M18 8v10c-2-2-6-4-9 0-3 5-4 13-1 17 2 3 6 1 8-1 1-2 2-5 2-9M22 8v10c2-2 6-4 9 0 3 5 4 13 1 17-2 3-6 1-8-1-1-2-2-5-2-9" fill="none" stroke="var(--o2)" stroke-width="2.4" stroke-linecap="round"/>',
      food: '<path d="M20 12c-6-4-14 0-13 9 1 10 7 16 13 13 6 3 12-3 13-13 1-9-7-13-13-9z" fill="#e66a5c"/><path d="M20 12c0-4 2-6 5-7" stroke="#5a8f3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
      excr: '<path d="M14 8c-7 0-9 9-7 16 2 8 8 10 11 6 2-3-2-6-1-10 1-3 4-4 3-8-1-3-3-4-6-4zM26 8c7 0 9 9 7 16-2 8-8 10-11 6-2-3 2-6 1-10-1-3-4-4-3-8 1-3 3-4 6-4z" fill="#b5555c"/>',
      temp: '<rect x="16" y="5" width="8" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="20" cy="30" r="6" fill="var(--o2)"/><path d="M20 30V14" stroke="var(--o2)" stroke-width="3"/>',
      meta: '<circle cx="20" cy="20" r="7" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M20 6v5M20 29v5M6 20h5M29 20h5M10 10l3.5 3.5M26.5 26.5L30 30M10 30l3.5-3.5M26.5 13.5L30 10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
      prot: '<path d="M20 5l12 5v9c0 8-6 13-12 16-6-3-12-8-12-16v-9z" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2.4"/><path d="M14 20l4 4 8-8" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round"/>',
      horm: '<path d="M10 28c0-8 4-18 10-18s10 10 10 18" fill="none" stroke="#8a5bd6" stroke-width="2.4"/><circle cx="12" cy="30" r="3.5" fill="#8a5bd6"/><circle cx="20" cy="33" r="3.5" fill="#8a5bd6"/><circle cx="28" cy="30" r="3.5" fill="#8a5bd6"/>',
      water: '<path d="M20 5C14 15 9 21 9 27a11 11 0 0 0 22 0c0-6-5-12-11-22z" fill="#7fb8ea"/>',
      clot: '<path d="M6 14c8 6 20 6 28 0M6 26c8-6 20-6 28 0M10 8l20 24M30 8L10 32" stroke="#b9934a" stroke-width="1.8" fill="none"/><ellipse cx="16" cy="20" rx="5" ry="3.5" fill="#b3202f"/><ellipse cx="25" cy="16" rx="4.5" ry="3" fill="#b3202f"/>'
    };
    const F = [
      ['resp', 'الوظيفة التنفسية', 'نقل الأوكسجين من الرئتين إلى الأنسجة، وثاني أوكسيد الكاربون من الأنسجة إلى الرئتين.'],
      ['food', 'الوظيفة الغذائية', 'نقل المواد الغذائية الممتصة من الأمعاء إلى خلايا الجسم.'],
      ['excr', 'الوظيفة الإخراجية (الطرح)', 'نقل الفضلات من الخلايا إلى أعضاء الإخراج مثل الكليتين.'],
      ['temp', 'تنظيم حرارة الجسم', 'توزيع الحرارة بين أعضاء الجسم والمحافظة عليها عند 37 °C.'],
      ['meta', 'تنظيم الأيض', 'إيصال المواد اللازمة للتفاعلات الحيوية في الخلايا ونقل نواتجها.'],
      ['prot', 'الحماية', 'كريات الدم البيض والأجسام المضادة تدافع عن الجسم ضد الميكروبات.'],
      ['horm', 'تنظيم إفراز الهرمونات', 'نقل الهرمونات من الغدد الصماء إلى الأعضاء التي تعمل عليها.'],
      ['water', 'توازن الماء', 'تنظيم كمية الماء وتوزيعها بين الدم والأنسجة.'],
      ['clot', 'تخثر الدم', 'منع النزف عند الإصابة بتكوين الخثرة من الصفيحات وألياف الفايبرين.']
    ];
    el.innerHTML = F.map((f, i) => `<div class="fn"><svg viewBox="0 0 40 40" aria-hidden="true">${ic[f[0]]}</svg><b><span class="n">${i + 1}</span> ${f[1]}</b><p>${f[2]}</p></div>`).join('') + '<p class="cap" style="grid-column:1/-1;text-align:right">أسماء الوظائف التسع من المحاضرة، والشرح المختصر تحت كل واحدة <span class="u-note">للفهم</span>.</p>';
  }

  /* ---------- تكوين خلايا الدم ---------- */
  function hemo() {
    const svg = $('#hemoFig'); if (!svg) return;
    lab.arrowDefs(svg, 'hmA', 'var(--muted)');
    const INFO = {
      stem: '<b>الخلايا الجذعية المكوّنة للدم:</b> خلايا غير متمايزة لها القدرة على التجدد والانقسام والتمايز إلى خلايا سلفية، تمر بعدة مراحل من النمو والنضج لتكوّن خلايا الدم المتخصصة.',
      rbc: '<b>كريات الدم الحمر:</b> ينتجها نخاع العظم الأحمر، وهو المسؤول الرئيس عن إنتاجها.',
      wbc: '<b>كريات الدم البيض:</b> ينتج نخاع العظم الأحمر معظمها.',
      mega: '<b>الخلايا العملاقة النواة (Megakaryocytes):</b> خلايا كبيرة يتفتت سيتوبلازمها إلى قطع صغيرة هي الصفيحات الدموية.',
      plt: '<b>الصفيحات الدموية (Platelets):</b> ليست خلايا كاملة، بل أجزاء من سيتوبلازم الخلايا العملاقة النواة، وتساعد على تخثر الدم.'
    };
    const node = (k, x, y, draw, label) => {
      const g = S('g', { class: 'hot', 'data-k': k }, svg);
      S('circle', { cx: x, cy: y, r: 34, fill: 'var(--surface-2)', stroke: 'var(--line)', class: 'hl-stroke', 'stroke-width': 1.5 }, g);
      draw(g, x, y);
      S('text', { x, y: y + 54, 'text-anchor': 'middle', class: 'sv-lbl', 'font-weight': 700, text: label }, g);
    };
    const arrow = (x1, y1, x2, y2) => S('path', { d: `M${x1},${y1} L${x2},${y2}`, stroke: 'var(--muted)', 'stroke-width': 1.6, 'marker-end': 'url(#hmA)' }, svg);
    node('stem', 260, 64, (g, x, y) => { S('circle', { cx: x, cy: y, r: 20, fill: '#e9dcf3', stroke: '#9c7cc9', 'stroke-width': 2 }, g); S('circle', { cx: x, cy: y, r: 10, fill: '#8a5bd6' }, g); }, 'خلية جذعية');
    arrow(236, 128, 124, 186); arrow(260, 130, 260, 184); arrow(284, 128, 396, 186);
    node('rbc', 420, 224, (g, x, y) => { S('ellipse', { cx: x, cy: y, rx: 22, ry: 15, fill: '#c22a3a' }, g); S('ellipse', { cx: x, cy: y, rx: 9, ry: 5.5, fill: '#851321' }, g); }, 'كريات حمر');
    node('wbc', 260, 224, (g, x, y) => { S('circle', { cx: x, cy: y, r: 22, fill: '#f2ebf8', stroke: '#b9a3d6', 'stroke-width': 1.5 }, g); S('path', { d: `M${x - 12},${y - 4} q6 -10 13 -2 q7 -6 11 4 q-6 6 -11 1 q-7 8 -13 -3z`, fill: '#7a4fb3' }, g); }, 'كريات بيض');
    node('mega', 100, 224, (g, x, y) => { S('circle', { cx: x, cy: y, r: 27, fill: '#f5e9d4', stroke: '#c9a24a', 'stroke-width': 1.5 }, g); S('path', { d: `M${x - 12},${y - 6} q8 -12 18 -2 q8 6 0 14 q-10 8 -18 -2 q-6 -6 0 -10z`, fill: '#b58a2e' }, g); }, 'خلية عملاقة النواة');
    arrow(100, 292, 100, 316);
    const pg = S('g', { class: 'hot', 'data-k': 'plt' }, svg);
    [[78, 336], [96, 344], [112, 334], [126, 346], [88, 352]].forEach(([x, y]) => S('ellipse', { cx: x, cy: y, rx: 5, ry: 3.4, fill: '#c9a24a' }, pg));
    S('text', { x: 190, y: 350, 'text-anchor': 'middle', class: 'sv-lbl', 'font-weight': 700, text: 'صفيحات دموية' }, pg);
    S('text', { x: 470, y: 30, 'text-anchor': 'middle', class: 'sv-sm', text: 'نخاع العظم الأحمر' }, svg);
    svg.addEventListener('click', e => {
      const t = e.target.closest('[data-k]'); if (!t) return;
      $$('[data-k]', svg).forEach(n => n.classList.toggle('on', n.dataset.k === t.dataset.k));
      msg('hemoMsg', INFO[t.dataset.k]);
    });
    msg('hemoMsg', INFO.stem);
  }

  lab.ready.push(() => {
    [hero, capSites, artery, sampleCards, diff, aliquot, colors, mats, bloodVol, comp, plasma, protCards, ph, funcs, hemo].forEach(f => { try { f(); } catch (e) { console.error(f.name, e); } });
  });
})();
