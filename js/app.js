/* مختبر قلب الضفدع — منطق المحاكاة
   القيم القابلة للتعديل موجودة في js/config.js */
(() => {
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const $ = s => document.querySelector(s);
const f1 = v => Math.round(v * 10) / 10;
const lerp = (a, b, t) => a + (b - a) * t;
const lp = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const dist = (p, q) => Math.hypot(p.x - q[0], p.y - q[1]);
const ease = { out: t => 1 - Math.pow(1 - t, 3), inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 };
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function E(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }
  if (parent) parent.appendChild(e);
  return e;
}
function rnd(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* ---------- geometry helpers ---------- */
function cr(pts, closed = true) {
  const n = pts.length;
  const P = i => closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f1(c1[0])},${f1(c1[1])} ${f1(c2[0])},${f1(c2[1])} ${f1(p2[0])},${f1(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}
function limb(c, w) {
  const L = [], R = [], n = c.length;
  for (let i = 0; i < n; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
    const h = w[i] / 2;
    L.push([c[i][0] - dy * h, c[i][1] + dx * h]); R.push([c[i][0] + dy * h, c[i][1] - dx * h]);
  }
  let a = c[n - 2], b = c[n - 1], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
  const tip = [b[0] + dx / len * w[n - 1] * .45, b[1] + dy / len * w[n - 1] * .45];
  a = c[1]; b = c[0]; dx = b[0] - a[0]; dy = b[1] - a[1]; len = Math.hypot(dx, dy) || 1;
  const tail = [b[0] + dx / len * w[0] * .3, b[1] + dy / len * w[0] * .3];
  return cr([tail, ...L, tip, ...R.reverse()], true);
}
const mir = pts => pts.map(([x, y]) => [800 - x, y]);
const sym = half => half.concat(mir(half.slice(1, -1)).reverse());
function winPath(cx, top, bottom, rx, taper) {
  if (rx <= .5) return 'M0 0';
  const cy = (top + bottom) / 2, ry = (bottom - top) / 2, N = 40, e = 2 / 2.3, pts = [];
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const y = cy + ry * Math.sign(s) * Math.pow(Math.abs(s), e);
    const k = taper + (1 - taper) * ((y - top) / (bottom - top));
    pts.push([cx + rx * k * Math.sign(c) * Math.pow(Math.abs(c), e), y]);
  }
  return cr(pts, true);
}

/* ---------- frog geometry ---------- */
const BODY_HALF = [[400,178],[430,181],[458,192],[482,212],[497,238],[504,266],[503,294],[508,324],[518,356],[529,398],[535,446],[535,500],[529,550],[517,594],[498,628],[470,652],[436,666],[400,671]];
const BODY_PTS = sym(BODY_HALF);
const BODY_D = cr(BODY_PTS);
const bellyMap = (sx, sy, sh) => ([x, y]) => { const lip = y < 300 ? (300 - y) / 120 : 0; return [400 + (x - 400) * (sx - .05 * lip), 425 + (y - 425) * sy + sh * lip]; };
const BELLY_D = cr(BODY_PTS.map(bellyMap(.9, .972, 7)));
const BELLY_MID_D = cr(BODY_PTS.map(bellyMap(.95, .985, 3)));
const PINS = [[630,350],[170,350],[596,902],[204,902]];
const CUTS = {
  skin:   { a: [400,642], b: [400,292], lift: [400,642] },
  muscle: { a: [421,632], b: [421,462], lift: [421,632] },
  girdle: { a: [400,452], b: [400,306] }
};
const HEART = [400, 368];
const VB_FULL = [0, 0, 800, 1000], VB_ZOOM = [250, 180, 300, 375];

/* ---------- configuration ---------- */
const CFG = window.LAB_CONFIG || {};
const DEF_RATES = Object.assign({ base: 70, adr: 80, ach: 50 }, CFG.rates || {});
// تغيير القيم في config.js يُلغي القيم القديمة المحفوظة في المتصفح
const STORE_KEY = 'frogLabRates:' + [DEF_RATES.base, DEF_RATES.adr, DEF_RATES.ach].join('-');
let RATES = { ...DEF_RATES };
try { const s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); if (s && s.base && s.adr && s.ach) RATES = { base: +s.base, adr: +s.adr, ach: +s.ach }; } catch (e) {}
const rateFor = d => d === 'adr' ? RATES.adr : d === 'ach' ? RATES.ach : RATES.base;
const AMP = Object.assign({ adr: 1.3, ach: .62 }, CFG.contraction || {});
const ampFor = d => d === 'adr' ? AMP.adr : d === 'ach' ? AMP.ach : 1;

const TOOLS = {
  anest:    { label: 'قطن + مخدّر', icon: 'ic-anest', hot: [16, 36], group: 'kit' },
  pins:     { label: 'دبابيس', icon: 'ic-pins', hot: [13, 45], group: 'kit' },
  alcohol:  { label: 'قطن + كحول', icon: 'ic-alcohol', hot: [14, 36], group: 'kit' },
  forceps:  { label: 'ملقط', icon: 'ic-forceps', hot: [6, 43], group: 'kit' },
  scissors: { label: 'مقص', icon: 'ic-scissors', hot: [6, 43], group: 'kit' },
  scalpel:  { label: 'مشرط', icon: 'ic-scalpel', hot: [5, 44], group: 'kit' },
  ringer:   { label: 'رنكر', icon: 'ic-ringer', hot: [24, 46], group: 'sol', sol: true, color: '--ringer', name: 'رنكر' },
  adr:      { label: 'رنكر + أدرينالين', icon: 'ic-adr', hot: [24, 46], group: 'sol', sol: true, color: '--adr', name: 'أدرينالين' },
  ach:      { label: 'رنكر + أستيل كولين', icon: 'ic-ach', hot: [24, 46], group: 'sol', sol: true, color: '--ach', name: 'أستيل كولين' }
};
const SOL_TINT = { ringer: '#d9ecf4', adr: '#f3e2c6', ach: '#cdeee9' };

const STEPS = [
  { id: 'anest',  title: 'تخدير الضفدع' },
  { id: 'pin',    title: 'التثبيت على لوح التشريح' },
  { id: 'clean',  title: 'تنظيف منطقة الشق' },
  { id: 'skin',   title: 'شق الجلد' },
  { id: 'muscle', title: 'شق جدار البطن' },
  { id: 'girdle', title: 'قص الحزام الصدري' },
  { id: 'peri',   title: 'إزالة غشاء التامور' },
  { id: 'base',   title: 'عدّ النبض الطبيعي' },
  { id: 'adr',    title: 'إضافة رنكر + أدرينالين' },
  { id: 'wash',   title: 'الغسل بمحلول رنكر' },
  { id: 'ach',    title: 'إضافة رنكر + أستيل كولين' },
  { id: 'done',   title: 'النتائج والاستنتاج' }
];
const MEAS_KEY = { base: 'normal', adr: 'adr', wash: 'wash', ach: 'ach' };

/* ---------- state ---------- */
let S = null;
function freshState() {
  return {
    step: 0, stepDone: false, tool: null, speed: S ? S.speed : 1, sound: S ? S.sound : false,
    simT: 0, rate: RATES.base, target: RATES.base, amp: 1, ampT: 1, phase: .4, stable: true,
    drug: 'none', drugApplied: false,
    an: { running: false, p: 0, done: false }, moved: false,
    pins: [false, false, false, false], cleaned: false,
    cut: null, liftPlaced: false,
    heartExposed: false, periRemoved: false, zoom: false, kymoOn: false,
    meas: { running: false, t: 0, p: 0, count: 0, mine: 0, result: null, mineResult: null, recorded: false },
    results: { normal: null, adr: null, wash: null, ach: null }, extra: [], fresh: null,
    free: false, vb: VB_FULL.slice(), ptr: null, pressing: false, lastWarn: 0, bleeds: 0
  };
}
S = freshState();
const R = {};
const cur = () => STEPS[S.step];

/* ---------- textures ---------- */
function tex(size, draw) { const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); return c.toDataURL('image/png'); }
function blobs(x, s, n, col, rmin, rmax, seed, stretch) {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    const cx = r() * s, cy = r() * s, rad = rmin + r() * (rmax - rmin), rot = r() * 3;
    for (const ox of [-s, 0, s]) for (const oy of [-s, 0, s]) {
      const g = x.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, rad * stretch);
      g.addColorStop(0, col(1)); g.addColorStop(.55, col(.75)); g.addColorStop(1, col(0));
      x.fillStyle = g; x.beginPath(); x.ellipse(cx + ox, cy + oy, rad * stretch, rad, rot, 0, Math.PI * 2); x.fill();
    }
  }
}
function buildDefs() {
  const d = $('#defs'); d.innerHTML = '';
  const grad = (tag, id, stops, a) => { const g = E(tag, { id, ...(a || {}) }, d); stops.forEach(s => E('stop', { offset: s[0], 'stop-color': s[1], 'stop-opacity': s[2] == null ? 1 : s[2] }, g)); };
  const lg = (id, s, a) => grad('linearGradient', id, s, a), rg = (id, s, a) => grad('radialGradient', id, s, a);
  lg('gBench', [[0, '#2c3339'], [1, '#1a1f23']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  lg('gBoard', [[0, '#f4f5f1'], [1, '#e0e3dc']], { x1: 0, y1: 0, x2: .3, y2: 1 });
  lg('gDorsal', [[0, '#8b9b4e'], [.55, '#66762f'], [1, '#495726']], { x1: 0, y1: 0, x2: 1, y2: 1 });
  rg('gBelly', [[0, '#f8f3e4'], [.55, '#ede4c9'], [1, '#d3c59a']], { cx: .5, cy: .42, r: .62 });
  rg('gLimbV', [[0, '#f0e9d2'], [1, '#cfc298']], { cx: .5, cy: .5, r: .62 });
  rg('gMuscle', [[0, '#d4837a'], [.6, '#b55d55'], [1, '#84373a']], { cx: .5, cy: .5, r: .62 });
  rg('gCavity', [[0, '#5d2624'], [.7, '#3a1312'], [1, '#230a0a']], { cx: .5, cy: .5, r: .56 });
  rg('gLiver', [[0, '#bb5b46'], [.5, '#83322b'], [1, '#55191a']], { cx: .36, cy: .3, r: .78 });
  rg('gLung', [[0, '#f5c6bc'], [1, '#c77c77']], { cx: .4, cy: .35, r: .7 });
  rg('gVent', [[0, '#c4434a'], [.55, '#921f27'], [1, '#5a0e16']], { cx: .42, cy: .36, r: .72 });
  rg('gAtr', [[0, '#8f2d45'], [1, '#3c0b1b']], { cx: .4, cy: .35, r: .72 });
  lg('gTrunc', [[0, '#f6d7cc'], [1, '#cf9083']], { x1: 0, y1: 0, x2: 1, y2: 0 });
  rg('gFat', [[0, '#fae38f'], [1, '#d6982b']], { cx: .4, cy: .35, r: .72 });
  rg('gGut', [[0, '#f0c9bc'], [1, '#cf9486']], { cx: .4, cy: .35, r: .8 });
  rg('gDorsalD', [[0, '#93ae52'], [.6, '#62802f'], [1, '#3d511c']], { cx: .5, cy: .42, r: .62 });
  rg('gEye', [[0, '#e9c867'], [.7, '#a87a28'], [1, '#5a3f12']], { cx: .45, cy: .4, r: .62 });
  rg('gShadow', [[0, '#000', .34], [1, '#000', 0]]);
  rg('gThroat', [[0, '#ffffff', .55], [1, '#ffffff', 0]]);
  rg('gSheen', [[0, '#ffffff', .55], [1, '#ffffff', 0]]);
  rg('gCotton', [[0, '#ffffff'], [1, '#dde2e6']], { cx: .4, cy: .35, r: .72 });
  rg('gDrop', [[0, '#ffffff', .95], [1, '#cfe6f0', .7]], { cx: .35, cy: .3, r: .8 });
  const pat = (id, size, url, extra) => { const p = E('pattern', { id, width: size, height: size, patternUnits: 'userSpaceOnUse', ...(extra || {}) }, d); E('image', { href: url, width: size, height: size }, p); };
  pat('pFoam', 200, tex(200, (x, s) => { const r = rnd(7); for (let i = 0; i < 2200; i++) { const a = r() * .075; x.fillStyle = r() < .55 ? `rgba(80,88,84,${a})` : `rgba(255,255,255,${a * 2})`; const z = r() * 1.8 + .4; x.fillRect(r() * s, r() * s, z, z); } }));
  pat('pBench', 160, tex(160, (x, s) => { const r = rnd(3); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(255,255,255,${r() * .06})`; x.fillRect(r() * s, r() * s, 1.3, 1.3); } }));
  pat('pSpots', 220, tex(220, (x, s) => blobs(x, s, 20, a => `rgba(28,36,12,${.62 * a})`, 6, 15, 11, 1.45)));
  pat('pMottle', 180, tex(180, (x, s) => blobs(x, s, 60, a => `rgba(120,108,74,${.12 * a})`, 3, 9, 5, 1.2)));
  const pf = E('pattern', { id: 'pFiberV', width: 5, height: 5, patternUnits: 'userSpaceOnUse' }, d);
  E('path', { d: 'M2.5 0V5', stroke: '#ffe3da', 'stroke-opacity': .3, 'stroke-width': 1.1 }, pf);
  const pd = E('pattern', { id: 'pFiberD', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(58)' }, d);
  E('path', { d: 'M0 3H6', stroke: '#ffe3da', 'stroke-opacity': .2, 'stroke-width': 1.1 }, pd);
  const pa = E('pattern', { id: 'pAlv', width: 7, height: 7, patternUnits: 'userSpaceOnUse' }, d);
  E('circle', { cx: 3.5, cy: 3.5, r: 1.7, fill: 'none', stroke: '#9e4f4f', 'stroke-opacity': .16, 'stroke-width': .7 }, pa);
  R.skinClip = E('path', { d: 'M0 0' }, E('clipPath', { id: 'cpSkin' }, d));
  R.orgClip = E('path', { d: 'M0 0' }, E('clipPath', { id: 'cpOrg' }, d));
}

/* ---------- scene ---------- */
function part(g, c, w, vs, sh) {
  const dd = limb(c, w);
  E('path', { d: dd, fill: 'url(#gDorsal)' }, g);
  E('path', { d: dd, fill: 'url(#pSpots)' }, g);
  if (vs) {
    const ci = sh ? c.map(([x, y], i) => [x + sh * (i < c.length - 1 ? 1 : .4), y]) : c;
    E('path', { d: limb(ci, w.map(x => x * (1 + vs) / 2)), fill: '#aaa56d', opacity: .7 }, g);
    E('path', { d: limb(ci, w.map(x => x * vs)), fill: 'url(#gLimbV)' }, g);
  }
}
function digit(g, b, t, w, vs, pad) {
  const m = [lerp(b[0], t[0], .52) + (t[1] - b[1]) * .04, lerp(b[1], t[1], .52) - (t[0] - b[0]) * .04];
  part(g, [b, m, t], w, vs);
  if (pad) E('circle', { cx: t[0], cy: t[1], r: pad, fill: '#e8dfc2', stroke: '#8f8a5c', 'stroke-opacity': .4, 'stroke-width': 1 }, g);
}
function webbing(g, toes) {
  const bc = [toes.reduce((s, t) => s + t[0][0], 0) / toes.length, toes.reduce((s, t) => s + t[0][1], 0) / toes.length];
  const pts = toes.map(([b, t]) => lp(b, t, .8));
  let d = `M${f1(bc[0])},${f1(bc[1])} L${f1(pts[0][0])},${f1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], m = lp(a, b, .5), c = lp(m, bc, .45);
    d += ` Q${f1(c[0])},${f1(c[1])} ${f1(b[0])},${f1(b[1])}`;
  }
  E('path', { d: d + 'Z', fill: '#cdbf93', 'fill-opacity': .62, stroke: '#8f875a', 'stroke-opacity': .4, 'stroke-width': 1 }, g);
}
function buildFrogV(g) {
  E('ellipse', { cx: 406, cy: 548, rx: 210, ry: 380, fill: 'url(#gShadow)' }, g);
  for (const side of [1, -1]) {
    const T = side === 1 ? (p => p) : mir;
    const toes = [[[582,884],[556,942]],[[586,888],[581,958]],[[591,890],[611,955]],[[596,887],[639,937]],[[600,882],[652,906]]].map(t => T(t));
    webbing(g, toes);
    toes.forEach(([b, t]) => digit(g, b, t, [8.5, 6.5, 5], .5, 3.6));
    const sh = -5 * side;
    part(g, T([[548,812],[562,846],[578,872],[590,886]]), [26, 23, 20, 17], .62, sh * .6);
    part(g, T([[592,704],[582,750],[568,786],[548,815]]), [50, 44, 36, 28], .66, sh);
    part(g, T([[446,622],[504,658],[558,690],[594,708]]), [98, 88, 72, 50], .74, sh * 1.4);
    const fing = [[[624,349],[648,322]],[[627,351],[664,336]],[[627,354],[668,357]],[[624,357],[657,375]]].map(t => T(t));
    fing.forEach(([b, t]) => digit(g, b, t, [7.5, 6, 4.6], .45, 3.4));
    part(g, T([[496,356],[556,381],[597,372],[624,352]]), [48, 36, 27, 18], .66, -4 * side);
  }
  E('path', { d: BODY_D, fill: 'url(#gDorsal)' }, g);
  E('path', { d: BODY_D, fill: 'url(#pSpots)' }, g);
  E('path', { d: BELLY_MID_D, fill: '#a9a46c', opacity: .7 }, g);
  E('path', { d: BELLY_D, fill: 'url(#gBelly)' }, g);
  E('path', { d: BELLY_D, fill: 'url(#pMottle)', opacity: .7 }, g);
  R.throat = E('ellipse', { cx: 400, cy: 256, rx: 66, ry: 48, fill: 'url(#gThroat)' }, g);
  E('path', { d: 'M344,250 C352,214 376,200 400,198 C424,200 448,214 456,250', fill: 'none', stroke: '#857a52', 'stroke-opacity': .32, 'stroke-width': 2 }, g);
  E('path', { d: 'M352,338 Q400,356 448,338', fill: 'none', stroke: '#9b8f62', 'stroke-opacity': .16, 'stroke-width': 3 }, g);
  E('ellipse', { cx: 438, cy: 470, rx: 26, ry: 96, fill: 'url(#gThroat)', opacity: .5, transform: 'rotate(-6 438 470)' }, g);
  E('ellipse', { cx: 520, cy: 670, rx: 12, ry: 34, fill: '#fff', opacity: .16, transform: 'rotate(-55 520 670)' }, g);
  E('ellipse', { cx: 280, cy: 670, rx: 12, ry: 34, fill: '#fff', opacity: .16, transform: 'rotate(55 280 670)' }, g);
  R.sheen = E('ellipse', { cx: 400, cy: 476, rx: 116, ry: 186, fill: 'url(#gSheen)', opacity: 0 }, g);

  R.inner = E('g', { 'clip-path': 'url(#cpSkin)' }, g);
  buildMuscle(R.inner);
  R.org = E('g', { 'clip-path': 'url(#cpOrg)' }, R.inner);
  buildOrgans(R.org);
  R.orgRimShadow = E('path', { d: 'M0 0', fill: 'none', stroke: '#000', 'stroke-opacity': .42, 'stroke-width': 20 }, R.org);
  R.orgRim = E('path', { d: 'M0 0', fill: 'none', stroke: '#9b4640', 'stroke-width': 9 }, R.org);
  R.skinRimShadow = E('path', { d: 'M0 0', fill: 'none', stroke: '#000', 'stroke-opacity': .26, 'stroke-width': 16 }, R.inner);
  R.skinRimOuter = E('path', { d: 'M0 0', fill: 'none', stroke: '#6e6340', 'stroke-opacity': .45, 'stroke-width': 9 }, g);
  R.skinRim = E('path', { d: 'M0 0', fill: 'none', stroke: '#f1e9d0', 'stroke-width': 5 }, g);
  R.cuts = E('g', {}, g);
  R.lift = E('g', {}, g);
  R.pins = E('g', {}, g);
}
function buildMuscle(g) {
  E('path', { d: BELLY_D, fill: 'url(#gMuscle)' }, g);
  E('path', { d: BELLY_D, fill: 'url(#pFiberD)' }, g);
  const fan = E('g', { stroke: '#ffdcd2', 'stroke-opacity': .22, 'stroke-width': 1.4, fill: 'none' }, g);
  for (let i = 0; i <= 18; i++) {
    const t = i / 18, x = 296 + t * 208, y = 338 - Math.sin(t * Math.PI) * 26;
    E('path', { d: `M400,412 Q${f1((400 + x) / 2)},${f1((412 + y) / 2 + 12)} ${f1(x)},${f1(y)}` }, fan);
  }
  E('path', { d: 'M318,338 Q400,358 482,338', fill: 'none', stroke: '#f0e9d9', 'stroke-opacity': .78, 'stroke-width': 13, 'stroke-linecap': 'round' }, g);
  E('rect', { x: 390, y: 300, width: 20, height: 150, rx: 9, fill: '#eee8d8', 'fill-opacity': .88 }, g);
  E('path', { d: 'M392,300 V450', stroke: '#fff', 'stroke-opacity': .45, 'stroke-width': 2 }, g);
  E('ellipse', { cx: 400, cy: 453, rx: 17, ry: 12, fill: '#ede7d8', stroke: '#cfc6ad', 'stroke-width': 1 }, g);
  for (const x0 of [364, 402]) {
    E('rect', { x: x0, y: 460, width: 34, height: 204, rx: 10, fill: '#c56d65' }, g);
    E('rect', { x: x0, y: 460, width: 34, height: 204, rx: 10, fill: 'url(#pFiberV)' }, g);
  }
  for (const y of [506, 553, 601]) E('path', { d: `M366,${y} Q383,${y + 4} 398,${y} M402,${y} Q419,${y + 4} 434,${y}`, stroke: '#f2dbcf', 'stroke-width': 2.4, fill: 'none', 'stroke-opacity': .85 }, g);
  E('line', { x1: 400, y1: 460, x2: 400, y2: 664, stroke: '#ecd2c6', 'stroke-width': 2.5 }, g);
  E('path', { d: 'M401,664 C398,622 403,586 400,546 C397,506 403,480 398,458', fill: 'none', stroke: '#3b3870', 'stroke-width': 6.5, 'stroke-linecap': 'round' }, g);
  E('path', { d: 'M399.4,662 C396.4,622 401.4,586 398.4,546 C395.4,506 401.4,480 396.4,460', fill: 'none', stroke: '#8784c4', 'stroke-width': 1.6, 'stroke-opacity': .7 }, g);
  E('ellipse', { cx: 432, cy: 522, rx: 16, ry: 72, fill: '#fff', opacity: .12 }, g);
}
function buildOrgans(g) {
  E('path', { d: winPath(400, 294, 656, 104, .82), fill: 'url(#gCavity)' }, g);
  for (const [cx, rot] of [[342, -16], [458, 16]]) {
    E('ellipse', { cx, cy: 396, rx: 25, ry: 42, fill: 'url(#gLung)', transform: `rotate(${rot} ${cx} 396)` }, g);
    E('ellipse', { cx, cy: 396, rx: 25, ry: 42, fill: 'url(#pAlv)', transform: `rotate(${rot} ${cx} 396)` }, g);
    E('ellipse', { cx: cx - 6, cy: 382, rx: 6, ry: 14, fill: '#fff', opacity: .22, transform: `rotate(${rot} ${cx} 396)` }, g);
  }
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const cx = 400 + s * (58 + i * 8), cy = 594 + i * 10;
    E('ellipse', { cx, cy, rx: 7.5, ry: 21, fill: 'url(#gFat)', transform: `rotate(${s * (18 + i * 6)} ${cx} ${cy})` }, g);
  }
  E('ellipse', { cx: 384, cy: 636, rx: 17, ry: 12, fill: '#efd9c9', opacity: .55 }, g);
  E('ellipse', { cx: 416, cy: 636, rx: 17, ry: 12, fill: '#efd9c9', opacity: .55 }, g);
  const gutPaths = [
    'M362,522 C336,534 336,572 362,576 C388,580 396,552 378,543 C362,536 354,560 370,566',
    'M424,546 C452,538 472,566 452,590 C436,608 406,602 406,580 C406,562 428,563 432,577',
    'M352,594 C372,622 420,630 448,612',
    'M392,524 C404,546 392,566 404,582',
    'M346,600 C338,620 352,640 376,632'
  ];
  for (const d of gutPaths) {
    E('path', { d, fill: 'none', stroke: '#b97e72', 'stroke-width': 17, 'stroke-linecap': 'round' }, g);
    E('path', { d, fill: 'none', stroke: '#e3b4a6', 'stroke-width': 11, 'stroke-linecap': 'round' }, g);
    E('path', { d, fill: 'none', stroke: '#fff', 'stroke-opacity': .28, 'stroke-width': 3, 'stroke-linecap': 'round', transform: 'translate(-2 -2)' }, g);
  }
  E('path', { d: 'M358,530 C352,548 360,560 372,562 M430,556 C446,560 452,576 444,588', fill: 'none', stroke: '#a8323b', 'stroke-opacity': .55, 'stroke-width': 1.2 }, g);
  const st = 'M448,468 C474,488 478,530 458,554 C446,568 428,570 418,562';
  E('path', { d: st, fill: 'none', stroke: '#c48f82', 'stroke-width': 26, 'stroke-linecap': 'round' }, g);
  E('path', { d: st, fill: 'none', stroke: '#ecc8bb', 'stroke-width': 17, 'stroke-linecap': 'round' }, g);
  E('path', { d: st, fill: 'none', stroke: '#fff', 'stroke-opacity': .3, 'stroke-width': 4, 'stroke-linecap': 'round', transform: 'translate(-3 -2)' }, g);
  const lobe = pts => { const d = cr(pts); E('path', { d, fill: 'url(#gLiver)' }, g); };
  lobe([[386,478],[400,470],[414,478],[413,503],[400,514],[387,503]]);
  E('circle', { cx: 401, cy: 480, r: 7.5, fill: '#738f36' }, g);
  E('circle', { cx: 399, cy: 478, r: 2.5, fill: '#d4e59a', opacity: .7 }, g);
  lobe([[336,410],[362,398],[390,410],[398,440],[392,476],[372,500],[346,498],[328,472],[324,438]]);
  lobe([[404,412],[434,398],[464,404],[480,436],[476,476],[456,504],[426,506],[408,486],[402,450]]);
  E('ellipse', { cx: 350, cy: 432, rx: 7, ry: 20, fill: '#fff', opacity: .11, transform: 'rotate(20 350 432)' }, g);
  E('ellipse', { cx: 446, cy: 428, rx: 8, ry: 22, fill: '#fff', opacity: .11, transform: 'rotate(-18 446 428)' }, g);
  for (const pts of [[[336,410],[362,398],[390,410],[398,440],[392,476],[372,500],[346,498],[328,472],[324,438]], [[404,412],[434,398],[464,404],[480,436],[476,476],[456,504],[426,506],[408,486],[402,450]]]) E('path', { d: cr(pts), fill: 'url(#pMottle)', opacity: .9 }, g);

  // heart
  const H = R.heart = E('g', {}, g);
  R.atr = E('g', {}, H);
  E('path', { d: cr([[345,346],[348,324],[363,308],[385,305],[400,313],[415,305],[437,307],[452,323],[455,346],[441,358],[400,353],[359,358]]), fill: 'url(#gAtr)' }, R.atr);
  E('path', { d: 'M400,314 C398,326 399,340 400,352', fill: 'none', stroke: '#2a0611', 'stroke-opacity': .5, 'stroke-width': 2 }, R.atr);
  E('path', { d: 'M356,322 C366,311 380,308 392,311', fill: 'none', stroke: '#fff', 'stroke-opacity': .16, 'stroke-width': 3, 'stroke-linecap': 'round' }, R.atr);
  E('path', { d: 'M412,311 C426,307 440,311 448,322', fill: 'none', stroke: '#fff', 'stroke-opacity': .13, 'stroke-width': 3, 'stroke-linecap': 'round' }, R.atr);
  R.vent = E('g', {}, H);
  const vd = 'M363,352 C359,384 384,415 402,426 C421,414 443,385 438,350 C421,342 381,342 363,352Z';
  E('path', { d: vd, fill: 'url(#gVent)' }, R.vent);
  R.blanch = E('path', { d: vd, fill: '#eaa99a', opacity: 0 }, R.vent);
  E('path', { d: 'M372,360 C374,384 388,404 401,414', fill: 'none', stroke: '#5c0f16', 'stroke-opacity': .35, 'stroke-width': 1.5 }, R.vent);
  E('ellipse', { cx: 386, cy: 372, rx: 8, ry: 19, fill: '#fff', opacity: .26, transform: 'rotate(18 386 372)' }, R.vent);
  E('ellipse', { cx: 422, cy: 362, rx: 4, ry: 8, fill: '#fff', opacity: .18 }, R.vent);
  R.trunc = E('g', {}, H);
  E('path', { d: limb([[399,328],[380,318],[354,312]], [11, 10, 8.5]), fill: 'url(#gTrunc)' }, R.trunc);
  E('path', { d: limb([[401,328],[421,318],[447,312]], [11, 10, 8.5]), fill: 'url(#gTrunc)' }, R.trunc);
  E('path', { d: limb([[383,358],[389,342],[400,328]], [15, 13, 12]), fill: 'url(#gTrunc)' }, R.trunc);
  E('path', { d: 'M383,352 C385,342 391,334 398,329', fill: 'none', stroke: '#fff', 'stroke-opacity': .4, 'stroke-width': 2, 'stroke-linecap': 'round' }, R.trunc);
  R.film = E('ellipse', { cx: 400, cy: 372, rx: 46, ry: 54, fill: '#dff1f8', opacity: 0 }, H);
  R.peri = E('g', {}, g);
  E('ellipse', { cx: 400, cy: 366, rx: 60, ry: 68, fill: '#efe7e2', 'fill-opacity': .34, stroke: '#ffffff', 'stroke-opacity': .62, 'stroke-width': 1.6 }, R.peri);
  E('path', { d: 'M356,340 C362,318 380,304 400,302', fill: 'none', stroke: '#fff', 'stroke-opacity': .6, 'stroke-width': 3, 'stroke-linecap': 'round' }, R.peri);
  E('path', { d: 'M440,396 C436,414 424,426 410,431', fill: 'none', stroke: '#fff', 'stroke-opacity': .35, 'stroke-width': 2, 'stroke-linecap': 'round' }, R.peri);
}
function cottonAt(g, x, y, wet) {
  const cs = [[0,0,22],[20,-6,18],[-18,6,17],[8,14,18],[-4,-16,15],[26,12,14]];
  cs.forEach(([dx, dy, r]) => E('circle', { cx: x + dx, cy: y + dy, r: r + 2, fill: '#c5ccd2' }, g));
  cs.forEach(([dx, dy, r]) => E('circle', { cx: x + dx, cy: y + dy, r, fill: 'url(#gCotton)' }, g));
  if (wet) E('ellipse', { cx: x + 4, cy: y + 3, rx: 28, ry: 18, fill: wet, opacity: .35 }, g);
}
function dpart(g, c, w) { const dd = limb(c, w); E('path', { d: dd, fill: 'url(#gDorsalD)' }, g); E('path', { d: dd, fill: 'url(#pSpots)' }, g); }
function eye(g, x, y) {
  E('ellipse', { cx: x, cy: y, rx: 19, ry: 17, fill: '#55702a' }, g);
  E('circle', { cx: x, cy: y, r: 12.5, fill: 'url(#gEye)' }, g);
  E('ellipse', { cx: x, cy: y, rx: 7.5, ry: 3.6, fill: '#120d05' }, g);
  E('circle', { cx: x - 4, cy: y - 5, r: 2.6, fill: '#fff', opacity: .85 }, g);
}
function buildJar(g) {
  E('ellipse', { cx: 414, cy: 518, rx: 252, ry: 248, fill: '#000', 'fill-opacity': .16 }, g);
  E('circle', { cx: 400, cy: 500, r: 244, fill: '#cfe6ee', 'fill-opacity': .28, stroke: '#7d9fae', 'stroke-opacity': .6, 'stroke-width': 5 }, g);
  E('circle', { cx: 400, cy: 500, r: 230, fill: 'none', stroke: '#ffffff', 'stroke-opacity': .5, 'stroke-width': 2 }, g);
  R.cotton = E('g', { opacity: 0 }, g); cottonAt(R.cotton, 292, 650, '#a9c9dd');
  R.frogD = E('g', {}, g);
  const b = R.frogDBody = E('g', {}, R.frogD);
  E('ellipse', { cx: 404, cy: 514, rx: 118, ry: 156, fill: 'url(#gShadow)' }, b);
  const half = [[400,362],[420,366],[438,378],[452,398],[462,424],[468,452],[476,486],[482,522],[480,560],[468,592],[446,616],[422,628],[400,631]];
  for (const T of [p => p, mir]) {
    const toes = [[[574,642],[606,622]],[[576,644],[617,639]],[[575,647],[615,661]],[[572,649],[600,674]]].map(t => T(t));
    toes.forEach(([a, t]) => dpart(b, [a, lp(a, t, .5), t], [7, 5.5, 4]));
    dpart(b, T([[528,544],[537,590],[520,636]]), [30, 26, 20]);
    dpart(b, T([[520,634],[547,647],[576,643]]), [18, 15, 12]);
    dpart(b, T([[456,590],[496,580],[528,546]]), [50, 43, 32]);
    const fing = [[[497,430],[503,404]],[[498,431],[516,411]],[[498,433],[523,428]]].map(t => T(t));
    fing.forEach(([a, t]) => dpart(b, [a, lp(a, t, .5), t], [6, 5, 3.6]));
    dpart(b, T([[452,470],[484,463],[497,433]]), [22, 17, 13]);
  }
  const body = cr(sym(half));
  E('path', { d: body, fill: 'url(#gDorsalD)' }, b);
  E('path', { d: body, fill: 'url(#pSpots)' }, b);
  for (const T of [p => p, mir]) {
    E('path', { d: cr(T([[440,432],[457,486],[463,540],[452,598]]), false), fill: 'none', stroke: '#b9c87a', 'stroke-opacity': .55, 'stroke-width': 4, 'stroke-linecap': 'round' }, b);
    const [ex, ey] = T([[437,404]])[0]; eye(b, ex, ey);
    const [tx, ty] = T([[459,445]])[0]; E('circle', { cx: tx, cy: ty, r: 10, fill: '#6c5a2f', stroke: '#3e3418', 'stroke-opacity': .35, 'stroke-width': 1.5 }, b);
  }
  E('circle', { cx: 393, cy: 374, r: 2.2, fill: '#2b3316' }, b);
  E('circle', { cx: 407, cy: 374, r: 2.2, fill: '#2b3316' }, b);
  E('ellipse', { cx: 422, cy: 506, rx: 18, ry: 66, fill: '#fff', opacity: .12 }, b);
  R.lid = E('g', { opacity: 0 }, g);
  E('circle', { cx: 400, cy: 500, r: 252, fill: '#dff0f6', 'fill-opacity': .16, stroke: '#ffffff', 'stroke-opacity': .78, 'stroke-width': 7 }, R.lid);
  E('path', { d: 'M236,360 A220,220 0 0 1 420,282', fill: 'none', stroke: '#fff', 'stroke-opacity': .55, 'stroke-width': 10, 'stroke-linecap': 'round' }, R.lid);
  E('circle', { cx: 400, cy: 500, r: 26, fill: '#fff', 'fill-opacity': .16, stroke: '#fff', 'stroke-opacity': .6, 'stroke-width': 3 }, R.lid);
  E('path', { d: 'M560,690 A230,230 0 0 1 470,722', fill: 'none', stroke: '#fff', 'stroke-opacity': .35, 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
  const C = 2 * Math.PI * 266;
  R.anC = C;
  R.anRing = E('circle', { cx: 400, cy: 500, r: 266, fill: 'none', stroke: '#8aa5f4', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-dasharray': `${C} ${C}`, 'stroke-dashoffset': C, transform: 'rotate(-90 400 500)', opacity: 0 }, g);
}
function buildScene() {
  const w = $('#world'); w.innerHTML = '';
  E('rect', { x: -200, y: -200, width: 1200, height: 1400, fill: 'url(#gBench)' }, w);
  E('rect', { x: -200, y: -200, width: 1200, height: 1400, fill: 'url(#pBench)' }, w);
  for (let i = 0; i < 4; i++) E('rect', { x: 58 + i * 2, y: 40 + i * 4, width: 686, height: 944, rx: 30, fill: '#000', 'fill-opacity': .09 }, w);
  E('rect', { x: 56, y: 32, width: 688, height: 946, rx: 28, fill: 'url(#gBoard)' }, w);
  E('rect', { x: 56, y: 32, width: 688, height: 946, rx: 28, fill: 'url(#pFoam)' }, w);
  E('rect', { x: 92, y: 68, width: 616, height: 874, rx: 18, fill: 'none', stroke: '#d0d4cd', 'stroke-width': 9 }, w);
  E('rect', { x: 97, y: 73, width: 606, height: 864, rx: 14, fill: 'none', stroke: '#fbfcf9', 'stroke-width': 2 }, w);
  R.blood = E('g', {}, w);
  R.frogV = E('g', { opacity: 0, visibility: 'hidden' }, w);
  buildFrogV(R.frogV);
  R.jar = E('g', {}, w);
  buildJar(R.jar);
  R.guides = E('g', {}, w);
  R.fx = E('g', {}, w);
  R.ghost = E('g', { 'pointer-events': 'none', opacity: 0 }, w);
  R.ghostUse = E('use', { href: '#ic-scissors', width: 48, height: 48 }, R.ghost);
  setSkin(0); setOrg(0, 452);
}

/* ---------- windows (openings) ---------- */
function setSkin(rx) {
  const d = winPath(400, 284, 662, rx, .75);
  R.skinClip.setAttribute('d', d);
  [R.skinRim, R.skinRimOuter, R.skinRimShadow].forEach(p => p.setAttribute('d', d));
}
function setOrg(rx, top) {
  const d = winPath(400, top, 652, rx, .82);
  R.orgClip.setAttribute('d', d);
  [R.orgRim, R.orgRimShadow].forEach(p => p.setAttribute('d', d));
}

/* ---------- tweens ---------- */
const tweens = [];
function tween(dur, fn, done) { tweens.push({ t0: performance.now(), dur: Math.max(1, reduceMotion ? dur * .35 : dur), fn, done }); }
function runTweens(now) {
  const list = tweens.splice(0, tweens.length), keep = [];
  for (const tw of list) {
    const k = Math.min(1, (now - tw.t0) / tw.dur);
    tw.fn(k);
    if (k >= 1) { if (tw.done) tw.done(); } else keep.push(tw);
  }
  tweens.push(...keep);
}

/* ---------- UI helpers ---------- */
let toastTimer = 0;
function toast(msg, kind) {
  const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.className = 'toast'; }, 2800);
}
function warnOnce(msg) { const now = performance.now(); if (now - S.lastWarn > 1800) { S.lastWarn = now; toast(msg, 'warn'); } }
function wrongTool(need) { toast(`هذه الخطوة تحتاج «${TOOLS[need].label}» — اخترها من صينية الأدوات`, 'warn'); }
function setVB(v) { S.vb = v; $('#stage').setAttribute('viewBox', v.map(f1).join(' ')); }
function zoomTo(on) {
  S.zoom = on; const from = S.vb.slice(), to = on ? VB_ZOOM : VB_FULL;
  tween(900, k => { const e = ease.inOut(k); setVB(from.map((a, i) => lerp(a, to[i], e))); });
  updateStageCtl();
}
function updateStageCtl() {
  const z = $('#zoomBtn'); z.disabled = !S.heartExposed; z.setAttribute('aria-pressed', String(S.zoom));
  z.setAttribute('aria-label', S.zoom ? 'عرض الضفدع كاملاً' : 'تكبير على القلب'); z.title = z.getAttribute('aria-label');
  $('#soundBtn').setAttribute('aria-pressed', String(S.sound));
  $('#sw').hidden = !S.periRemoved;
}
function bloodDot(x, y, r, parent) { E('circle', { cx: f1(x), cy: f1(y), r: f1(r), fill: '#8f1d26', opacity: .5 + Math.random() * .35 }, parent || R.blood); }
function splatter(cx, cy, n, spread) {
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, d = Math.random() * spread; bloodDot(cx + Math.cos(a) * d, cy + Math.sin(a) * d, .8 + Math.random() * 2.4); }
}

/* ---------- tray ---------- */
function renderTray() {
  const tray = $('#tray'); tray.innerHTML = '';
  const groups = [['kit', 'عدّة التشريح'], ['sol', 'المحاليل']];
  for (const [gid, name] of groups) {
    const g = document.createElement('div'); g.className = 'tgroup';
    g.innerHTML = `<h3>${name}</h3><div class="tools"></div>`;
    const box = g.querySelector('.tools');
    for (const id in TOOLS) {
      if (TOOLS[id].group !== gid) continue;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tool'; b.dataset.tool = id; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true"><use href="#${TOOLS[id].icon}"/></svg><span>${TOOLS[id].label}</span>`;
      b.addEventListener('click', () => selectTool(id));
      box.appendChild(b);
    }
    tray.appendChild(g);
  }
  updateTray();
}
function expectedTool() {
  const id = cur().id;
  if (S.free) return null;
  switch (id) {
    case 'anest': return (S.an.running || S.an.done) ? null : 'anest';
    case 'pin': return S.pins.every(Boolean) ? null : 'pins';
    case 'clean': return S.cleaned ? null : 'alcohol';
    case 'skin': case 'muscle': return S.stepDone ? null : (S.liftPlaced ? 'scissors' : 'forceps');
    case 'girdle': return S.stepDone ? null : 'scissors';
    case 'peri': return S.periRemoved ? null : 'forceps';
    case 'adr': return S.drugApplied ? null : 'adr';
    case 'wash': return S.drugApplied ? null : 'ringer';
    case 'ach': return S.drugApplied ? null : 'ach';
  }
  return null;
}
function updateChip() {
  const id = cur().id, exp = expectedTool();
  let hint;
  if (exp) hint = `الأداة: ${TOOLS[exp].label}`;
  else if (id === 'anest' && S.an.running) hint = 'التخدير جارٍ…';
  else if (S.meas.running) hint = 'جارٍ العدّ…';
  else if (id === 'done') hint = 'جرّب أي محلول بحرية';
  else if (MEAS_KEY[id] && !S.stable) hint = 'انتظر استقرار النبض';
  else if (MEAS_KEY[id] && !(id === 'wash' ? true : S.stepDone)) hint = 'ابدأ العدّ من البطاقة';
  else if (S.stepDone) hint = 'اكتملت الخطوة';
  else hint = '';
  $('#stageChip').innerHTML = `<b>${S.step + 1} من ${STEPS.length} · ${cur().title}</b>${hint ? `<span>${hint}</span>` : ''}`;
}
function updateTray() {
  const exp = expectedTool();
  document.querySelectorAll('.tool').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.tool === S.tool));
    b.classList.toggle('hint', b.dataset.tool === exp && S.tool !== exp);
  });
  $('#stageWrap').classList.toggle('armed', !!S.tool);
  if (S.tool) R.ghostUse.setAttribute('href', '#' + TOOLS[S.tool].icon);
  updateChip();
}
function selectTool(id) {
  S.tool = S.tool === id ? null : id;
  updateTray();
  if (S.tool) toast(`اخترت: ${TOOLS[S.tool].label}`);
}

/* ---------- actions ---------- */
function startAnesthesia() {
  S.an.running = true;
  tween(450, k => R.cotton.setAttribute('opacity', k));
  setTimeout(() => tween(500, k => R.lid.setAttribute('opacity', k)), 350);
  R.anRing.setAttribute('opacity', 1);
  setGuides(); renderCard(); updateTray();
  toast('وُضعت القطنة المبللة بالمخدّر وأُغلق الوعاء');
}
function onAnesthDone() {
  S.an.done = true; S.an.running = false; S.stepDone = true;
  tween(500, k => R.anRing.setAttribute('opacity', 1 - k));
  renderCard(); updateTray();
  toast('اكتمل التخدير — لم يعد الضفدع يتحرك', 'ok');
}
function moveToBoard() {
  if (S.moved) return; S.moved = true;
  R.frogV.setAttribute('visibility', 'visible');
  tween(650, k => R.jar.setAttribute('opacity', 1 - k), () => R.jar.setAttribute('visibility', 'hidden'));
  tween(900, k => { const e = ease.out(k); R.frogV.setAttribute('opacity', e); R.frogV.setAttribute('transform', `translate(400 500) scale(${(.94 + .06 * e).toFixed(4)}) translate(-400 -500)`); });
}
function placePin(i) {
  if (S.pins[i]) return;
  S.pins[i] = true;
  const [x, y] = PINS[i];
  const g = E('g', { opacity: 0 }, R.pins);
  E('ellipse', { cx: x + 6, cy: y + 3, rx: 10, ry: 4, fill: '#000', opacity: .22 }, g);
  const pin = E('g', {}, g);
  E('line', { x1: x, y1: y, x2: x + 9, y2: y - 26, stroke: '#9aa3ab', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, pin);
  E('circle', { cx: x + 10, cy: y - 29, r: 8.5, fill: i % 2 ? 'url(#gPinHead2)' : 'url(#gPinHead)' }, pin);
  E('circle', { cx: x + 7.5, cy: y - 32, r: 2.5, fill: '#fff', opacity: .8 }, pin);
  tween(320, k => { const e = ease.out(k); g.setAttribute('opacity', Math.min(1, k * 2)); pin.setAttribute('transform', `translate(0 ${f1((1 - e) * -40)})`); });
  const n = S.pins.filter(Boolean).length;
  if (n === 4) { S.stepDone = true; toast('ثُبّت الضفدع من أطرافه الأربعة', 'ok'); }
  setGuides(); renderCard(); updateTray();
}
function doClean() {
  if (S.cleaned) return; S.cleaned = true; S.stepDone = true;
  const g = E('g', {}, R.fx);
  cottonAt(g, 0, 0, '#9fc3dd');
  tween(900, k => {
    const x = 400 + Math.sin(k * Math.PI * 3) * 60, y = 560 - k * 200;
    g.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) scale(.9)`);
    R.sheen.setAttribute('opacity', f1(Math.min(.9, k * 1.2) * 100) / 100);
  }, () => { g.remove(); tween(1600, k => R.sheen.setAttribute('opacity', f1((.9 - .55 * k) * 100) / 100)); });
  setGuides(); renderCard(); updateTray();
  toast('نُظّف جلد البطن بالكحول', 'ok');
}
function placeLift(key) {
  S.liftPlaced = true;
  const [x, y] = CUTS[key].lift;
  R.lift.innerHTML = '';
  E('ellipse', { cx: x + 3, cy: y + 4, rx: 16, ry: 7, fill: '#000', opacity: .18 }, R.lift);
  E('ellipse', { cx: x, cy: y, rx: 13, ry: 7, fill: key === 'skin' ? '#fbf6e8' : '#d98a80', opacity: .9 }, R.lift);
  E('path', { d: `M${x - 13},${y} Q${x},${y - 12} ${x + 13},${y}`, fill: 'none', stroke: '#6b5f3e', 'stroke-opacity': .35, 'stroke-width': 1.5 }, R.lift);
  const k = 2.1;
  E('use', { href: '#ic-forceps', width: 48, height: 48, transform: `translate(${x} ${y}) rotate(-28) scale(${k}) translate(-6 -43)` }, R.lift);
  startCut(key);
  setGuides(); renderCard(); updateTray();
  toast(key === 'skin' ? 'رُفع الجلد بالملقط — الآن اختر المقص' : 'رُفع جدار البطن — الآن اختر المقص');
}
function startCut(key) {
  const c = CUTS[key], N = 34, pts = [];
  for (let i = 0; i <= N; i++) pts.push(lp(c.a, c.b, i / N));
  S.cut = { key, pts, hit: new Array(N + 1).fill(false), done: false };
  R.cuts.innerHTML = '';
  R.cutPath = E('path', { d: 'M0 0', fill: 'none', stroke: '#6a1118', 'stroke-width': 3.2, 'stroke-linecap': 'round' }, R.cuts);
}
function drawCut() {
  const c = S.cut; let d = '';
  for (let i = 0; i < c.pts.length - 1; i++) if (c.hit[i] && c.hit[i + 1]) {
    const j = k => Math.sin(k * 2.3) * 1.3;
    d += `M${f1(c.pts[i][0] + j(i))},${f1(c.pts[i][1])}L${f1(c.pts[i + 1][0] + j(i + 1))},${f1(c.pts[i + 1][1])}`;
  }
  R.cutPath.setAttribute('d', d || 'M0 0');
}
function cutFrac() { return S.cut ? S.cut.hit.filter(Boolean).length / S.cut.hit.length : 0; }
function cutAt(p) {
  const c = S.cut; if (!c || c.done) return;
  let any = false;
  c.pts.forEach((q, i) => {
    if (!c.hit[i] && dist(p, q) < 22) {
      c.hit[i] = true; any = true;
      if (Math.random() < .3) bloodDot(q[0] + (Math.random() - .5) * 9, q[1] + (Math.random() - .5) * 9, 1.2 + Math.random() * 1.8, R.cuts);
    }
  });
  if (any) {
    drawCut();
    const fr = cutFrac(), el = $('#cutBar'); if (el) el.style.width = Math.round(fr * 100) + '%';
    const pc = $('#cutPct'); if (pc) pc.textContent = Math.round(fr * 100);
    if (fr >= .86) finishCut();
  }
}
function checkCutPath(p) {
  const c = S.cut; if (!c || c.done) return;
  const a = c.pts[0], b = c.pts[c.pts.length - 1];
  const t = Math.max(0, Math.min(1, ((p.x - a[0]) * (b[0] - a[0]) + (p.y - a[1]) * (b[1] - a[1])) / ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2)));
  const q = lp(a, b, t), dd = Math.hypot(p.x - q[0], p.y - q[1]);
  if (c.key === 'muscle' && Math.abs(p.x - 400) < 6 && p.y > 458 && p.y < 664) {
    if (S.bleeds < 4 && performance.now() - S.lastWarn > 1800) { S.bleeds++; splatter(p.x, p.y, 7, 7); }
    warnOnce('احذر! المقص على الوريد البطني — ابقَ على الخط المنقّط بجانبه');
  } else if (dd > 60) warnOnce('اتبع الخط المنقّط');
}
function finishCut() {
  const c = S.cut; if (!c || c.done) return;
  c.done = true; c.hit.fill(true); drawCut();
  const key = c.key;
  setGuides(); updateTray();
  setTimeout(() => {
    R.lift.innerHTML = '';
    tween(400, k => R.cuts.setAttribute('opacity', 1 - k), () => { R.cuts.innerHTML = ''; R.cuts.setAttribute('opacity', 1); });
    if (key === 'skin') {
      tween(1150, k => setSkin(2 + 118 * ease.out(k)), () => { S.stepDone = true; renderCard(); updateTray(); toast('انفتح الجلد وظهرت عضلات جدار البطن', 'ok'); });
      splatter(258, 226, 10, 36);
    } else if (key === 'muscle') {
      tween(1150, k => setOrg(2 + 98 * ease.out(k), 452), () => { S.stepDone = true; renderCard(); updateTray(); toast('انكشف تجويف الجسم', 'ok'); });
      splatter(566, 598, 8, 26);
    } else {
      S.heartExposed = true;
      tween(1300, k => setOrg(100, 452 - 162 * ease.inOut(k)), () => { S.stepDone = true; updateStageCtl(); renderCard(); updateTray(); toast('ظهر القلب نابضاً داخل غشاء التامور', 'ok'); });
      splatter(246, 300, 9, 26);
    }
  }, 260);
}
function removePeri() {
  if (S.periRemoved) return;
  S.periRemoved = true; S.kymoOn = true; S.stepDone = true;
  tween(900, k => { const e = ease.out(k); R.peri.setAttribute('opacity', 1 - e); R.peri.setAttribute('transform', `translate(${f1(e * 30)} ${f1(-e * 46)}) rotate(${f1(e * 14)} 400 366)`); }, () => R.peri.setAttribute('visibility', 'hidden'));
  setTimeout(() => { if (!S.zoom) zoomTo(true); }, 500);
  updateStageCtl(); setGuides(); renderCard(); updateTray();
  toast('أُزيل غشاء التامور — القلب مكشوف', 'ok');
}
function dropSolution(t) {
  const tint = SOL_TINT[t];
  const g = E('g', { opacity: 0 }, R.fx);
  const tx = 408, ty = 318;
  const pip = E('g', { transform: `rotate(12 ${tx} ${ty})` }, g);
  E('rect', { x: tx - 4, y: ty - 78, width: 8, height: 78, rx: 3, fill: '#e8f3f7', 'fill-opacity': .75, stroke: '#9fbccb', 'stroke-width': 1.2 }, pip);
  E('rect', { x: tx - 2.5, y: ty - 40, width: 5, height: 38, fill: tint, 'fill-opacity': .9 }, pip);
  E('path', { d: `M${tx - 4},${ty} L${tx},${ty + 8} L${tx + 4},${ty} Z`, fill: '#e8f3f7', stroke: '#9fbccb', 'stroke-width': 1 }, pip);
  E('rect', { x: tx - 8, y: ty - 108, width: 16, height: 32, rx: 8, fill: getComputedStyle(document.documentElement).getPropertyValue(TOOLS[t].color).trim() || '#557a97' }, pip);
  tween(260, k => g.setAttribute('opacity', k));
  const tip = [tx + Math.sin(12 * Math.PI / 180) * 8, ty + 8];
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const d = E('ellipse', { cx: tip[0], cy: tip[1], rx: 4, ry: 5, fill: 'url(#gDrop)', stroke: '#fff', 'stroke-opacity': .8, 'stroke-width': .8 }, R.fx);
      const tgt = [396 + i * 6, 360 + i * 9];
      tween(380, k => { const e = k * k; d.setAttribute('cx', f1(lerp(tip[0], tgt[0], k))); d.setAttribute('cy', f1(lerp(tip[1], tgt[1], e))); }, () => {
        d.remove();
        const ring = E('ellipse', { cx: tgt[0], cy: tgt[1], rx: 3, ry: 2, fill: 'none', stroke: '#fff', 'stroke-opacity': .8, 'stroke-width': 1.2 }, R.fx);
        tween(500, k => { ring.setAttribute('rx', f1(3 + k * 16)); ring.setAttribute('ry', f1(2 + k * 10)); ring.setAttribute('stroke-opacity', f1((1 - k) * 80) / 100); }, () => ring.remove());
        R.film.setAttribute('fill', tint);
        tween(300, k => R.film.setAttribute('opacity', f1(k * 40) / 100));
      });
    }, 320 + i * 330);
  }
  setTimeout(() => {
    tween(400, k => g.setAttribute('opacity', 1 - k), () => g.remove());
    tween(3500, k => R.film.setAttribute('opacity', f1((1 - k) * 40) / 100));
    setDrug(t);
  }, 1450);
  S.drugApplied = true; S.stable = false;
  setGuides(); renderCard(); updateTray();
}
function setDrug(t) {
  S.drug = t; S.target = rateFor(t); S.ampT = ampFor(t);
  S.stable = Math.abs(S.rate - S.target) < .01 && Math.abs(S.amp - S.ampT) < .01;
  K.markers.push({ t: S.simT, label: TOOLS[t].name, color: TOOLS[t].color });
  renderCard();
  toast(t === 'ringer' ? 'أُضيف محلول رنكر — يُغسل القلب' : `أُضيف ${TOOLS[t].label} على القلب`);
}
function applySolution(t, p) {
  if (!S.periRemoved) return toast('اكشف القلب وأزل غشاء التامور أولاً', 'warn');
  if (Math.hypot(p.x - HEART[0], p.y - HEART[1]) > 100) return toast('ضع القطرات على القلب مباشرة');
  if (S.meas.running) return toast('انتظر انتهاء دقيقة العدّ قبل إضافة أي محلول', 'warn');
  if (!S.free) {
    const id = cur().id, need = { adr: 'adr', wash: 'ringer', ach: 'ach' }[id];
    if (id === 'base') return toast('عُدّ النبض الطبيعي أولاً من غير أي إضافة', 'warn');
    if (!need) return toast('لم يحن وقت المحاليل بعد', 'warn');
    if (S.drugApplied) return toast('أُضيف المحلول — راقب القلب الآن');
    if (t !== need) return toast(`حسب طريقة العمل نضيف الآن «${TOOLS[need].label}»`, 'warn');
  }
  dropSolution(t);
}

/* ---------- measurement ---------- */
function needsDrug() { return !S.free && ['adr', 'wash', 'ach'].includes(cur().id) && !S.drugApplied; }
function canMeasure() { return S.periRemoved && S.stable && !S.meas.running && !needsDrug(); }
function startMeas() {
  if (!canMeasure()) { if (!S.stable) toast('انتظر حتى يستقر النبض'); return; }
  Object.assign(S.meas, { running: true, t: 0, p: 0, count: 0, mine: 0, result: null, mineResult: null, recorded: false });
  K.bands.push({ t0: S.simT, t1: null });
  ensureAudio();
  renderCard();
}
function finishMeas() {
  const m = S.meas; m.running = false;
  m.result = Math.round(m.p); m.count = m.result; m.mineResult = m.mine;
  const b = K.bands[K.bands.length - 1]; if (b) b.t1 = S.simT;
  beep();
  $('#swCount').textContent = m.result;
  renderCard();
  toast(`انتهت الدقيقة: ${m.result} ضربة`, 'ok');
}
function record() {
  const m = S.meas; if (m.result == null || m.recorded) return;
  const key = MEAS_KEY[cur().id];
  if (key) { S.results[key] = m.result; S.fresh = key; if (key !== 'wash') S.stepDone = true; }
  else { S.extra.push({ drug: S.drug, val: m.result }); S.fresh = 'x' + (S.extra.length - 1); }
  m.recorded = true;
  renderNotebook(); renderCard();
  toast('سُجّلت النتيجة في دفتر المختبر', 'ok');
}

/* ---------- audio ---------- */
let AC = null;
function ensureAudio() {
  if (!S.sound) return;
  try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; }
}
function thump() {
  if (!S.sound || !AC || !S.heartExposed) return;
  const t = AC.currentTime;
  [[0, 64, .42], [.12, 54, .22]].forEach(([d, fq, v]) => {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(fq, t + d); o.frequency.exponentialRampToValueAtTime(34, t + d + .14);
    g.gain.setValueAtTime(.0001, t + d); g.gain.exponentialRampToValueAtTime(v, t + d + .012); g.gain.exponentialRampToValueAtTime(.0001, t + d + .17);
    o.connect(g); g.connect(AC.destination); o.start(t + d); o.stop(t + d + .2);
  });
}
function beep() {
  if (!S.sound || !AC) return;
  const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
  o.frequency.value = 880; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.2, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .35);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + .4);
}

/* ---------- guides ---------- */
function setGuides() {
  const g = R.guides; g.innerHTML = '';
  const id = cur().id;
  const ring = (x, y, r) => {
    E('circle', { cx: x, cy: y, r, fill: '#8aa5f4', 'fill-opacity': .12, stroke: '#0c1222', 'stroke-opacity': .35, 'stroke-width': 7 }, g);
    E('circle', { cx: x, cy: y, r, fill: 'none', stroke: '#9fb6ff', 'stroke-width': 3.5, class: 'pulse' }, g);
  };
  const line = (a, b) => {
    E('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#0c1222', 'stroke-opacity': .4, 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
    E('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#ffffff', 'stroke-width': 3, 'stroke-dasharray': '10 8', class: 'march' }, g);
    E('circle', { cx: a[0], cy: a[1], r: 7, fill: '#9fb6ff', stroke: '#0c1222', 'stroke-opacity': .4, 'stroke-width': 2 }, g);
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const h = (o) => [b[0] - Math.cos(ang + o) * 16, b[1] - Math.sin(ang + o) * 16];
    const p1 = h(.5), p2 = h(-.5);
    E('path', { d: `M${f1(p1[0])},${f1(p1[1])} L${b[0]},${b[1]} L${f1(p2[0])},${f1(p2[1])}`, fill: 'none', stroke: '#ffffff', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
  };
  if (S.free) return;
  if (id === 'anest' && !S.an.running && !S.an.done) ring(400, 500, 258);
  if (id === 'pin') PINS.forEach((p, i) => { if (!S.pins[i]) ring(p[0], p[1], 30); });
  if (id === 'clean' && !S.cleaned) {
    E('ellipse', { cx: 400, cy: 476, rx: 112, ry: 176, fill: 'none', stroke: '#9fb6ff', 'stroke-width': 3.5, 'stroke-dasharray': '12 9', class: 'march' }, g);
  }
  if ((id === 'skin' || id === 'muscle') && !(S.cut && S.cut.done)) {
    const c = CUTS[id];
    if (!S.liftPlaced) ring(c.lift[0], c.lift[1], 22); else line(c.a, c.b);
  }
  if (id === 'girdle' && !(S.cut && S.cut.done)) line(CUTS.girdle.a, CUTS.girdle.b);
  if (id === 'peri' && !S.periRemoved) ring(HEART[0], HEART[1], 74);
  if (['adr', 'wash', 'ach'].includes(id) && !S.drugApplied) ring(HEART[0], HEART[1] + 4, 66);
}

/* ---------- step flow ---------- */
function enterStep() {
  const id = cur().id;
  S.stepDone = false; S.drugApplied = false; S.liftPlaced = false; S.cut = null;
  S.meas.result = null; S.meas.mineResult = null; S.meas.recorded = false;
  if (R.lift) R.lift.innerHTML = '';
  if (id === 'girdle') startCut('girdle');
  if (id === 'base') { S.stepDone = false; if (!S.zoom) zoomTo(true); }
  if (id === 'done') { S.free = true; S.stepDone = true; }
  if (S.tool && S.tool !== expectedTool()) S.tool = null;
  setGuides(); renderCard(); updateTray(); renderProgress();
}
function next() {
  if (cur().id === 'anest') moveToBoard();
  if (S.step < STEPS.length - 1) { S.step++; enterStep(); }
}
function autoDo() {
  const id = cur().id;
  switch (id) {
    case 'anest': if (!S.an.running && !S.an.done) startAnesthesia(); break;
    case 'pin': PINS.forEach((q, i) => { if (!S.pins[i]) setTimeout(() => placePin(i), i * 200); }); break;
    case 'clean': doClean(); break;
    case 'skin': case 'muscle': case 'girdle': {
      if (id !== 'girdle' && !S.liftPlaced) placeLift(id);
      const c = S.cut; if (!c || c.done) break;
      tween(1100, k => { const n = Math.floor(k * c.pts.length); for (let i = 0; i < n; i++) c.hit[i] = true; drawCut(); }, () => finishCut());
      break;
    }
    case 'peri': removePeri(); break;
    case 'adr': case 'wash': case 'ach': if (!S.drugApplied && !S.meas.running) dropSolution({ adr: 'adr', wash: 'ringer', ach: 'ach' }[id]); break;
  }
}
function reset() {
  tweens.length = 0;
  S = freshState();
  K.samples = []; K.markers = []; K.bands = [];
  setVB(VB_FULL.slice());
  buildScene();
  enterStep(); renderNotebook(); updateStageCtl(); updateSpeed();
  $('#swTime').textContent = '00:00.0'; $('#swCount').textContent = '0'; $('#swBar').style.width = '0%';
  toast('بدأت التجربة من جديد');
}

/* ---------- card ---------- */
const beats = n => `${n} ${n >= 3 && n <= 10 ? 'ضربات' : 'ضربة'}`;
const sign = n => n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0';
function statusChip() {
  if (!S.periRemoved) return '';
  if (needsDrug()) return '<span class="chip"><i></i>بانتظار إضافة المحلول</span>';
  if (!S.stable) return '<span class="chip warn"><i></i>التأثير يظهر تدريجياً… انتظر الاستقرار</span>';
  return '<span class="chip ok"><i></i>النبض مستقر — جاهز للعدّ</span>';
}
function measureHTML(optional) {
  const m = S.meas, ready = canMeasure();
  if (m.result != null && !m.running) {
    const mine = m.mineResult > 0 ? `عدّك أنت: <b>${m.mineResult}</b> — ${m.mineResult === m.result ? 'مطابق تماماً' : `الفرق ${Math.abs(m.mineResult - m.result)}`}` : 'لم تعدّ بنفسك هذه المرة (زر «نبضة» اختياري).';
    return `<div class="meas">
      <div class="result"><div class="big"><b>${m.result}</b><span>ضربة / دقيقة</span></div><p class="mine">${mine}</p></div>
      <div class="row">${m.recorded ? '<span class="chip ok"><i></i>سُجّلت في الدفتر</span>' : '<button class="btn primary" type="button" data-act="record">سجّل في الدفتر</button>'}
      <button class="btn" type="button" data-act="start" ${ready ? '' : 'disabled'}>أعِد العدّ</button></div></div>`;
  }
  return `<div class="meas">
    <div>${statusChip()}</div>
    <div class="row">
      <button class="btn primary" type="button" data-act="start" ${ready ? '' : 'disabled'}>${m.running ? 'جارٍ العدّ…' : (optional ? 'قِس للتأكد (اختياري)' : 'ابدأ العدّ لمدة دقيقة')}</button>
      <button class="btn tap" type="button" data-act="tap" ${m.running ? '' : 'disabled'}>نبضة <b id="myCount">${m.mine}</b></button>
    </div>
    <p class="hint">ساعة التوقيت فوق القلب تحسب الضربات. زر «نبضة» اختياري: اضغطه (أو مفتاح المسافة) مع كل انقباض لتتدرب على العدّ بنفسك. لتسريع الدقيقة استعمل ×2 أو ×4.</p>
  </div>`;
}
function renderCard() {
  const st = cur(), id = st.id, i = S.step;
  let body = '', tip = '', auto = false, nextBtn = S.stepDone && id !== 'done';
  let nextLabel = 'الخطوة التالية ←';
  switch (id) {
    case 'anest':
      if (S.an.done) { body = '<p class="lead">سكن الضفدع ولم يعد يستجيب، وأصبح تنفّسه بطيئاً. هو الآن جاهز للتشريح.</p>'; nextLabel = 'انقل الضفدع إلى لوح التشريح ←'; }
      else if (S.an.running) body = `<p class="lead">أُغلق الوعاء على القطنة المبللة بالمخدّر. راقب حركة الضفدع وتنفّسه وهما يتباطآن.</p><div class="bar"><i id="anBar"></i></div><p class="hint">التخدير: <span id="anPct">0</span>%</p>`;
      else { body = '<p class="lead">قبل التشريح نخدّر الضفدع حتى يسكن تماماً. اختر «قطن + مخدّر» من صينية الأدوات، ثم اضغط على الوعاء لتضع القطنة فيه وتغلقه.</p>'; auto = true; }
      tip = 'التخدير المناسب يُبقي القلب نابضاً، وهذا ما نحتاجه لقياس النبض.';
      break;
    case 'pin': {
      const n = S.pins.filter(Boolean).length;
      body = `<p class="lead">وُضع الضفدع على ظهره والجهة البطنية إلى الأعلى. اختر «دبابيس» واضغط على كل دائرة مضيئة لتثبيت اليدين والقدمين.</p><p><span class="chip ${n === 4 ? 'ok' : ''}"><i></i>ثُبّت ${n} من 4</span></p>`;
      auto = n < 4; tip = 'تُثبَّت الأطراف وهي ممدودة قليلاً حتى يبقى البطن مشدوداً ويسهل الشق.';
      break; }
    case 'clean':
      body = S.cleaned ? '<p class="lead">نُظّفت منطقة الشق بالكحول.</p>' : '<p class="lead">امسح جلد البطن بقطنة مبللة بالكحول قبل الشق. اختر «قطن + كحول» واضغط على بطن الضفدع.</p>';
      auto = !S.cleaned; tip = 'الكحول والقطن من المواد المستخدمة في التجربة لتنظيف منطقة العمل.';
      break;
    case 'skin':
      if (S.stepDone) body = '<p class="lead">انفتح الجلد وظهرت عضلات جدار البطن، ويمتد في وسطها الوريد البطني (الخط الأزرق الداكن).</p>';
      else if (!S.liftPlaced) body = '<p class="lead">ارفع جلد أسفل البطن بالملقط عند النقطة المضيئة، حتى يبتعد الجلد عن العضلات تحته.</p>';
      else body = `<p class="lead">اختر المقص واسحب على الخط المنقّط من أسفل البطن صعوداً نحو الفك.</p><div class="bar"><i id="cutBar" style="width:${Math.round(cutFrac() * 100)}%"></i></div><p class="hint">اكتمل الشق: <span id="cutPct">${Math.round(cutFrac() * 100)}</span>%</p>`;
      auto = !S.stepDone; tip = 'جلد الضفدع غير ملتصق بالعضلات بسبب الأكياس اللمفاوية تحته، لذلك ينفصل بسهولة عند رفعه.';
      break;
    case 'muscle':
      if (S.stepDone) body = '<p class="lead">انكشف تجويف الجسم: الكبد بفصوصه، والمعدة، والأمعاء، والأجسام الدهنية الصفراء. القلب ما زال مختبئاً تحت الحزام الصدري.</p>';
      else if (!S.liftPlaced) body = '<p class="lead">ارفع جدار البطن بالملقط عند النقطة المضيئة.</p>';
      else body = `<p class="lead">قصّ بالمقص على الخط المنقّط بجانب الوريد البطني لا فوقه، حتى تصل إلى عظم القص.</p><div class="bar"><i id="cutBar" style="width:${Math.round(cutFrac() * 100)}%"></i></div><p class="hint">اكتمل الشق: <span id="cutPct">${Math.round(cutFrac() * 100)}</span>%</p>`;
      auto = !S.stepDone; tip = 'قطع الوريد البطني يسبب نزفاً يحجب الرؤية، لذلك يكون القص على أحد جانبيه.';
      break;
    case 'girdle':
      body = S.stepDone ? '<p class="lead">ظهر القلب نابضاً داخل غشاء التامور الشفاف.</p>' : `<p class="lead">القلب يقع تحت الحزام الصدري مباشرة. قصّ عظم القص بالمقص على الخط الوسطي بحذر، فيُبعَد نصفاه إلى الجانبين.</p><div class="bar"><i id="cutBar" style="width:${Math.round(cutFrac() * 100)}%"></i></div><p class="hint">اكتمل القص: <span id="cutPct">${Math.round(cutFrac() * 100)}</span>%</p>`;
      auto = !S.stepDone; tip = 'اجعل رأس المقص مرفوعاً للأعلى أثناء قص عظم القص حتى لا يُجرح القلب.';
      break;
    case 'peri':
      body = S.periRemoved ? '<p class="lead">أُزيل الغشاء. لاحظ الأذينين في الأعلى، والبطين المخروطي في الأسفل، والجذع الشرياني الخارج من البطين. البطين يصبح فاتح اللون كلما انقبض.</p>' : '<p class="lead">يحيط بالقلب غشاء رقيق شفاف هو غشاء التامور (Pericardium). اختر الملقط واضغط على القلب لإزالته.</p>';
      auto = !S.periRemoved; tip = 'قلب الضفدع ثلاثي الحجرات: أذينان وبطين واحد.';
      break;
    case 'base':
      body = '<p class="lead">هذا هو النبض في الحالة الطبيعية، من غير أي إضافة. كل انقباض للبطين (يصغر ويصبح لونه فاتحاً) يُحسب ضربة واحدة. شغّل ساعة التوقيت وعُدّ الضربات في دقيقة واحدة.</p>' + measureHTML(false);
      tip = 'يُرطَّب القلب بمحلول رنكر بين حين وآخر حتى لا يجف أثناء التجربة.';
      break;
    case 'adr':
      body = (!S.drugApplied ? '<p class="lead">أضف قطرات من محلول رنكر الحاوي على الأدرينالين على القلب: اختر الزجاجة من «المحاليل» ثم اضغط على القلب.</p>'
        : !S.stable ? '<p class="lead">لاحظ تسارع الضربات وقوة انقباض البطين. انتظر حتى يستقر التأثير قبل العدّ.</p>'
        : '<p class="lead">استقر النبض. عُدّ الضربات في دقيقة واحدة ولاحظ الفرق عن الحالة الطبيعية.</p>') + (S.drugApplied ? measureHTML(false) : '');
      auto = !S.drugApplied; tip = 'الأدرينالين هرمون الكر والفر، تفرزه غدة الكظر الواقعة فوق الكلية.';
      break;
    case 'wash':
      body = (!S.drugApplied ? '<p class="lead">اغسل القلب بمحلول رنكر الخالي من أي إضافة، لإزالة الأدرينالين قبل تجربة العقار الثاني.</p>'
        : !S.stable ? '<p class="lead">يعود النبض تدريجياً نحو الحالة الطبيعية…</p>'
        : '<p class="lead">عاد النبض إلى الحالة الطبيعية. يمكنك القياس للتأكد، أو الانتقال إلى الخطوة التالية.</p>') + (S.drugApplied ? measureHTML(true) : '');
      if (S.drugApplied && S.stable && !S.meas.running) S.stepDone = true;
      nextBtn = S.stepDone;
      auto = !S.drugApplied; tip = 'الغسل يمنع تداخل تأثير العقار الأول مع العقار الثاني.';
      break;
    case 'ach':
      body = (!S.drugApplied ? '<p class="lead">أضف قطرات من محلول رنكر الحاوي على الأستيل كولين على القلب.</p>'
        : !S.stable ? '<p class="lead">لاحظ تباطؤ الضربات وضعف انقباض البطين. انتظر حتى يستقر التأثير قبل العدّ.</p>'
        : '<p class="lead">استقر النبض. عُدّ الضربات في دقيقة واحدة وقارنها بالحالة الطبيعية وبالإضافة الأولى.</p>') + (S.drugApplied ? measureHTML(false) : '');
      auto = !S.drugApplied; tip = 'الأستيل كولين ناقل عصبي تطلقه نهايات العصب المبهم (الحائر) في القلب.';
      nextLabel = 'اعرض النتائج والاستنتاج ←';
      break;
    case 'done':
      body = resultsHTML();
      break;
  }
  if (S.meas.running) nextBtn = false;
  const actions = [];
  if (auto) actions.push('<button class="btn quiet sm" type="button" data-act="auto">نفّذ هذه الخطوة عنّي</button>');
  if (nextBtn) actions.unshift(`<button class="btn primary" type="button" data-act="next">${nextLabel}</button>`);
  const sn = $('#stageNext'); sn.hidden = !nextBtn; sn.textContent = id === 'anest' ? 'انقل إلى لوح التشريح ←' : id === 'ach' ? 'اعرض النتائج ←' : 'الخطوة التالية ←';
  updateChip();
  $('#card').innerHTML = `<div class="kicker">الخطوة ${i + 1} من ${STEPS.length}</div><h2>${st.title}</h2>${body}${actions.length ? `<div class="row actions">${actions.join('')}</div>` : ''}${tip ? `<div class="tip"><b>معلومة</b><span>${tip}</span></div>` : ''}`;
}
function resultsHTML() {
  const r = S.results, n = r.normal, a = r.adr, c = r.ach;
  let concl = '';
  if (n != null && a != null && c != null) {
    concl = `<p class="concl">نستنتج من التجربة أن محلول رنكر الحاوي على الأدرينالين أدى إلى ${a >= n ? 'ارتفاع' : 'انخفاض'} ضربات القلب من <b>${n}</b> إلى <b>${a}</b> ضربة/دقيقة (بمعدل ${beats(Math.abs(a - n))})، بينما محلول رنكر الحاوي على الأستيل كولين أدى إلى ${c <= n ? 'انخفاض' : 'ارتفاع'} ضربات القلب من <b>${n}</b> إلى <b>${c}</b> ضربة/دقيقة (بمعدل ${beats(Math.abs(n - c))}). أي أن الأدرينالين يزيد معدل ضربات القلب، على العكس من الأستيل كولين الذي يقلله.</p>`;
  } else concl = '<p class="concl">لم تُسجَّل كل القياسات بعد. ارجع إلى الخطوات وسجّل النتائج لتظهر المقارنة كاملة.</p>';
  return `${chartSVG()}${concl}
  <div class="why adr"><h3>لماذا يزيد الأدرينالين ضربات القلب؟</h3><ol>
    <li>يرتبط بمستقبلات بيتا-1 الأدرينالية (β1) الموجودة في غشاء خلايا القلب.</li>
    <li>ينشّط ذلك إنزيم البروتين كاينيز A (PKA) داخل الخلية.</li>
    <li>يزداد دخول أيونات الكالسيوم ويتسارع زوال الاستقطاب التلقائي في خلايا منظم الخطى في العقدة الجيبية الأذينية (SA node).</li>
    <li>تصل الخلايا إلى عتبة جهد الفعل أسرع، فتتولد النبضات بوتيرة أعلى ويرتفع معدل الضربات، وتزداد قوة الانقباض وسرعة التوصيل عبر العقدة الأذينية البطينية (AV node).</li>
  </ol></div>
  <div class="why ach"><h3>لماذا يقلل الأستيل كولين ضربات القلب؟</h3><ol>
    <li>يرتبط بالمستقبلات المسكارينية من النوع M2 في العقدة الجيبية الأذينية والعقدة الأذينية البطينية.</li>
    <li>تزداد نفاذية الغشاء لأيونات البوتاسيوم K⁺ فتخرج من الخلايا.</li>
    <li>يصبح داخل الخلية أكثر سلبية، وهذا هو فرط الاستقطاب (Hyperpolarization)، وتقل سرعة زوال الاستقطاب.</li>
    <li>يستغرق الغشاء وقتاً أطول للوصول إلى العتبة، فيقل توليد النبضات وينخفض معدل الضربات، ويبطؤ التوصيل بين الأذينين والبطين.</li>
  </ol></div>
  <div class="tip"><b>جرّب بحرية</b><span>المحاليل الثلاثة متاحة الآن بلا ترتيب: أضف أي محلول على القلب ثم قِس النبض، وستُضاف القياسات إلى الدفتر.</span></div>
  ${measureHTML(false)}
  <div class="row actions"><button class="btn" type="button" data-act="reset">أعِد التجربة من البداية</button></div>`;
}
function chartSVG() {
  const items = [['normal', 'طبيعي', '--ink-2'], ['adr', 'أدرينالين', '--adr'], ['wash', 'بعد الغسل', '--ringer'], ['ach', 'أستيل كولين', '--ach']].filter(it => S.results[it[0]] != null);
  if (!items.length) return '';
  const W = 360, H = 200, top = 22, bot = 32, right = 34, left = 8, max = Math.max(100, ...items.map(it => S.results[it[0]] + 10));
  const ph = H - top - bot, pw = W - right - left, slot = pw / items.length, bw = Math.min(54, slot * .55);
  const y = v => top + ph - v / max * ph;
  let s = `<svg class="chart" style="direction:ltr" viewBox="0 0 ${W} ${H}" role="img" aria-label="مخطط أعمدة لعدد الضربات في كل حالة">`;
  const step = max > 120 ? 40 : 25;
  for (let v = 0; v <= max; v += step) s += `<line x1="${left}" x2="${W - right}" y1="${f1(y(v))}" y2="${f1(y(v))}" style="stroke:var(--line)" stroke-width="1"/><text x="${W - 4}" y="${f1(y(v) + 4)}" text-anchor="end" font-size="11" style="fill:var(--muted);font-family:var(--f-mono)">${v}</text>`;
  items.forEach((it, i) => {
    const v = S.results[it[0]], cx = W - right - slot * (i + .5), x = cx - bw / 2;
    s += `<rect x="${f1(x)}" y="${f1(y(v))}" width="${f1(bw)}" height="${f1(y(0) - y(v))}" rx="4" style="fill:var(${it[2]})"/>`;
    s += `<text x="${f1(cx)}" y="${f1(y(v) - 6)}" text-anchor="middle" font-size="13" font-weight="600" style="fill:var(--ink);font-family:var(--f-mono)">${v}</text>`;
    s += `<text x="${f1(cx)}" y="${H - 10}" text-anchor="middle" font-size="12" style="fill:var(--ink-2);font-family:var(--f-body)">${it[1]}</text>`;
  });
  return s + '</svg>';
}

/* ---------- notebook ---------- */
function renderNotebook() {
  const rows = [['normal', 'الحالة الطبيعية (بدون إضافة)', '--ink-2'], ['adr', 'بعد رنكر + أدرينالين', '--adr'], ['wash', 'بعد الغسل برنكر', '--ringer'], ['ach', 'بعد رنكر + أستيل كولين', '--ach']];
  const n = S.results.normal;
  let h = '';
  for (const [k, label, col] of rows) {
    const v = S.results[k];
    const diff = v != null && n != null && k !== 'normal' ? `<span class="ltr">${sign(v - n)}</span>` : (k === 'normal' ? '—' : '');
    h += `<tr class="${S.fresh === k ? 'fresh' : ''}"><td><span class="sw-dot" style="background:var(${col})"></span>${label}</td><td class="num ${v == null ? 'empty' : ''}">${v == null ? '—' : v}</td><td class="num">${diff}</td></tr>`;
  }
  S.extra.forEach((x, i) => {
    const label = x.drug === 'none' ? 'قياس إضافي' : `قياس إضافي بعد ${TOOLS[x.drug].label}`;
    const col = x.drug === 'none' ? '--ink-2' : TOOLS[x.drug].color;
    h += `<tr class="${S.fresh === 'x' + i ? 'fresh' : ''}"><td><span class="sw-dot" style="background:var(${col})"></span>${label}</td><td class="num">${x.val}</td><td class="num">${n != null ? `<span class="ltr">${sign(x.val - n)}</span>` : ''}</td></tr>`;
  });
  $('#nbBody').innerHTML = h;
  S.fresh = null;
}
function renderProgress() {
  const segs = $('#segs');
  segs.innerHTML = STEPS.map((s, i) => `<span class="seg ${i < S.step ? 'done' : i === S.step ? 'cur' : ''}"></span>`).join('');
  $('#stepLabel').textContent = `${S.step + 1} من ${STEPS.length} · ${cur().title}`;
}
function updateSpeed() { document.querySelectorAll('.speed button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.speed === S.speed))); }

/* ---------- kymograph ---------- */
const K = { samples: [], markers: [], bands: [], cvs: null, ctx: null, w: 0, h: 0, dpr: 1, col: {}, lastCol: 0 };
function kymoResize() {
  const c = K.cvs, r = c.getBoundingClientRect();
  K.dpr = Math.min(2, window.devicePixelRatio || 1); K.w = r.width; K.h = r.height;
  c.width = Math.max(1, Math.round(r.width * K.dpr)); c.height = Math.max(1, Math.round(r.height * K.dpr));
}
function readColors() {
  const cs = getComputedStyle(document.documentElement);
  ['--paper-k', '--grid-k', '--trace', '--adr', '--ach', '--ringer', '--muted', '--glove-soft', '--ink-2'].forEach(k => K.col[k] = cs.getPropertyValue(k).trim());
}
function drawKymo() {
  const x = K.ctx, W = K.w, H = K.h; if (!W || !x) return;
  x.setTransform(K.dpr, 0, 0, K.dpr, 0, 0);
  x.fillStyle = K.col['--paper-k']; x.fillRect(0, 0, W, H);
  const pps = 34, tNow = S.simT, t0 = tNow - W / pps;
  const X = t => W - (tNow - t) * pps;
  for (const b of K.bands) { const e = b.t1 == null ? tNow : b.t1; if (e < t0) continue; x.fillStyle = K.col['--glove-soft']; x.fillRect(X(b.t0), 0, X(e) - X(b.t0), H); }
  x.strokeStyle = K.col['--grid-k']; x.lineWidth = 1;
  for (let s = Math.ceil(t0); s <= tNow; s++) { const xx = Math.round(X(s)) + .5; x.globalAlpha = s % 5 === 0 ? 1 : .55; x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, H); x.stroke(); }
  x.globalAlpha = .55;
  for (let i = 1; i < 4; i++) { const yy = Math.round(H * i / 4) + .5; x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke(); }
  x.globalAlpha = 1;
  x.font = '600 11px "IBM Plex Sans Arabic", system-ui, sans-serif'; x.textBaseline = 'top';
  for (const m of K.markers) {
    if (m.t < t0 - 3) continue; const xx = Math.round(X(m.t)) + .5;
    x.strokeStyle = K.col[m.color]; x.setLineDash([4, 3]); x.lineWidth = 1.5; x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, H); x.stroke(); x.setLineDash([]);
    x.fillStyle = K.col[m.color]; x.textAlign = 'left'; x.direction = 'rtl'; x.fillText(m.label, xx + 4, 5);
  }
  const base = H * .84, amp = H * .56;
  if (!S.kymoOn && !K.samples.length) {
    x.strokeStyle = K.col['--trace']; x.globalAlpha = .35; x.lineWidth = 1.4; x.beginPath(); x.moveTo(0, base); x.lineTo(W, base); x.stroke(); x.globalAlpha = 1;
    x.fillStyle = K.col['--muted']; x.textAlign = 'center'; x.direction = 'rtl'; x.font = '500 13px "IBM Plex Sans Arabic", system-ui, sans-serif';
    x.fillText('يبدأ رسم الانقباضات بعد كشف القلب وإزالة غشاء التامور', W / 2, H * .38);
    return;
  }
  x.strokeStyle = K.col['--trace']; x.lineWidth = 1.7; x.lineJoin = 'round'; x.beginPath();
  let first = true;
  for (const [t, v] of K.samples) { if (t < t0 - .2) continue; const xx = X(t), yy = base - v * amp; if (first) { x.moveTo(xx, yy); first = false; } else x.lineTo(xx, yy); }
  x.stroke();
}

/* ---------- simulation ---------- */
function ventCurve(p) { if (p < .16) { const t = p / .16; return 1 - (1 - t) * (1 - t); } if (p < .46) { const t = (p - .16) / .3; return 1 - ease.inOut(t); } return 0; }
function atrCurve(p) { return (p > .8 && p < .97) ? Math.sin(Math.PI * (p - .8) / .17) : 0; }
let stableEvent = false, beatEvent = false;
function simStep(h) {
  S.simT += h;
  if (S.an.running) { S.an.p = Math.min(1, S.an.p + h / (CFG.anesthesiaSeconds || 6)); if (S.an.p >= 1) { S.an.running = false; setTimeout(onAnesthDone, 0); } }
  if (S.rate !== S.target || S.amp !== S.ampT) {
    const k = 1 - Math.exp(-h / 1.5);
    S.rate += (S.target - S.rate) * k; S.amp += (S.ampT - S.amp) * k;
    if (Math.abs(S.target - S.rate) < .12 && Math.abs(S.ampT - S.amp) < .01) { S.rate = S.target; S.amp = S.ampT; if (!S.stable) { S.stable = true; stableEvent = true; } }
    else S.stable = false;
  }
  const dp = h * S.rate / 60, prev = S.phase;
  S.phase += dp;
  const beat = Math.floor(S.phase) > Math.floor(prev);
  if (beat) beatEvent = true;
  if (S.meas.running) { S.meas.t += h; S.meas.p += dp; if (beat) S.meas.count++; }
  if (S.kymoOn) { const p = S.phase % 1; K.samples.push([S.simT, ventCurve(p) * S.amp + .16 * atrCurve(p) * Math.min(1.2, S.amp)]); }
}
let last = performance.now();
function tick(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  runTweens(now);
  let sdt = dt * S.speed;
  while (sdt > 1e-9) {
    let h = Math.min(1 / 120, sdt);
    if (S.meas.running) h = Math.min(h, 60 - S.meas.t);
    if (h > 0) simStep(h);
    sdt -= h;
    if (S.meas.running && S.meas.t >= 60 - 1e-9) finishMeas();
  }
  if (K.samples.length > 4000) K.samples.splice(0, K.samples.length - 3600);
  if (stableEvent) { stableEvent = false; renderCard(); updateTray(); if (S.drugApplied || S.free) toast('استقر النبض — يمكنك العدّ الآن', 'ok'); }
  if (beatEvent) { beatEvent = false; thump(); if (S.meas.running) { const c = $('#swCount'); c.textContent = S.meas.count; c.classList.add('flash'); setTimeout(() => c.classList.remove('flash'), 120); } }
  render(now);
  requestAnimationFrame(tick);
}
function render(now) {
  // heart
  if (S.heartExposed) {
    const p = S.phase % 1, v = ventCurve(p), a = atrCurve(p), vl = ventCurve((p + .95) % 1);
    const k = v * S.amp, ka = a * Math.min(1.2, S.amp), fill = .035 * v;
    R.vent.setAttribute('transform', `translate(400 348) scale(${(1 - .075 * k).toFixed(4)} ${(1 - .14 * k).toFixed(4)}) translate(-400 -348)`);
    R.blanch.setAttribute('opacity', Math.min(.85, .78 * k).toFixed(3));
    R.atr.setAttribute('transform', `translate(400 340) scale(${(1 - .1 * ka + fill).toFixed(4)} ${(1 - .13 * ka + fill).toFixed(4)}) translate(-400 -340)`);
    R.trunc.setAttribute('transform', `translate(392 344) scale(${(1 + .05 * vl * S.amp).toFixed(4)}) translate(-392 -344)`);
  }
  // breathing
  if (!S.moved) {
    const br = 2 * Math.PI * S.simT * (1.5 - 1.15 * S.an.p);
    const tw = S.an.p < .45 ? Math.sin(S.simT * 1.1) * Math.max(0, Math.sin(S.simT * .43)) * 2.4 * (1 - S.an.p * 2) : 0;
    R.frogDBody.setAttribute('transform', `rotate(${tw.toFixed(2)} 400 520) translate(400 500) scale(${(1 + .012 * Math.sin(br)).toFixed(4)} ${(1 + .018 * Math.sin(br)).toFixed(4)}) translate(-400 -500)`);
    if (S.an.running || S.an.done) {
      R.anRing.setAttribute('stroke-dashoffset', (R.anC * (1 - S.an.p)).toFixed(1));
      const b = $('#anBar'), pc = $('#anPct'); if (b) b.style.width = Math.round(S.an.p * 100) + '%'; if (pc) pc.textContent = Math.round(S.an.p * 100);
    }
  } else {
    const sy = 1 + .07 * Math.max(0, Math.sin(2 * Math.PI * .35 * S.simT));
    R.throat.setAttribute('transform', `translate(400 254) scale(1 ${sy.toFixed(3)}) translate(-400 -254)`);
  }
  // ghost tool
  if (S.tool && S.ptr && (S.ptrMouse || S.pressing)) {
    const tl = TOOLS[S.tool], k = S.vb[2] / 800 * 2.3;
    const wob = S.pressing && S.tool === 'scissors' ? Math.sin(now / 55) * 5 : 0;
    R.ghost.setAttribute('transform', `translate(${f1(S.ptr.x)} ${f1(S.ptr.y)}) rotate(${wob.toFixed(1)}) scale(${k.toFixed(3)}) translate(${-tl.hot[0]} ${-tl.hot[1]})`);
    R.ghost.setAttribute('opacity', 1);
  } else R.ghost.setAttribute('opacity', 0);
  // stopwatch
  if (S.periRemoved) {
    const m = S.meas, t = m.running ? m.t : (m.result != null ? 60 : 0);
    $('#swTime').textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(1).padStart(4, '0')}`;
    $('#swBar').style.width = (t / 60 * 100).toFixed(1) + '%';
    if (!m.running && m.result == null) $('#swCount').textContent = '0';
    const st = $('#swState'); const changing = !S.stable;
    st.classList.toggle('changing', changing);
    st.lastElementChild.textContent = m.running ? 'جارٍ العدّ…' : changing ? 'النبض يتغير…' : 'النبض مستقر';
  }
  if (now - K.lastCol > 1000) { K.lastCol = now; readColors(); }
  drawKymo();
}

/* ---------- input ---------- */
function svgPt(e) { const st = $('#stage'), pt = st.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(st.getScreenCTM().inverse()); }
function inBelly(p) { return ((p.x - 400) / 125) ** 2 + ((p.y - 470) / 200) ** 2 < 1; }
function onDown(p) {
  const id = cur().id, t = S.tool;
  if (TOOLS[t].sol) return applySolution(t, p);
  switch (id) {
    case 'anest':
      if (S.an.running || S.an.done) return toast(S.an.done ? 'التخدير مكتمل — انتقل للخطوة التالية' : 'التخدير جارٍ… انتظر قليلاً');
      if (t !== 'anest') return wrongTool('anest');
      if (Math.hypot(p.x - 400, p.y - 500) > 270) return toast('اضغط على وعاء الضفدع');
      return startAnesthesia();
    case 'pin': {
      if (S.pins.every(Boolean)) return toast('الضفدع مثبّت — انتقل للخطوة التالية');
      if (t !== 'pins') return wrongTool('pins');
      const i = PINS.findIndex((q, j) => !S.pins[j] && dist(p, q) < 50);
      if (i < 0) return toast('ضع الدبوس على الدوائر المضيئة عند اليدين والقدمين');
      return placePin(i); }
    case 'clean':
      if (S.cleaned) return toast('نُظّفت المنطقة — انتقل للخطوة التالية');
      if (t !== 'alcohol') return wrongTool('alcohol');
      if (!inBelly(p)) return toast('امسح منطقة البطن');
      return doClean();
    case 'skin': case 'muscle': {
      if (S.cut && S.cut.done) return;
      const c = CUTS[id];
      if (!S.liftPlaced) {
        if (t === 'scissors' || t === 'scalpel') return toast(id === 'skin' ? 'ارفع الجلد بالملقط أولاً حتى لا تجرح ما تحته' : 'ارفع جدار البطن بالملقط أولاً حتى لا تجرح الأعضاء', 'warn');
        if (t !== 'forceps') return wrongTool('forceps');
        if (dist(p, c.lift) > 42) return toast('أمسك بالملقط عند النقطة المضيئة');
        return placeLift(id);
      }
      if (t === 'scalpel') return toast('استعمل المقص هنا: رأسه المرفوع يقص دون أن يجرح ما تحته', 'warn');
      if (t !== 'scissors') return wrongTool('scissors');
      cutAt(p); return; }
    case 'girdle':
      if (S.cut && S.cut.done) return;
      if (t === 'scalpel') return toast('عظم القص يُقص بالمقص لا بالمشرط', 'warn');
      if (t !== 'scissors') return wrongTool('scissors');
      cutAt(p); return;
    case 'peri':
      if (S.periRemoved) return toast('أُزيل الغشاء — انتقل للخطوة التالية');
      if (t !== 'forceps') return wrongTool('forceps');
      if (Math.hypot(p.x - HEART[0], p.y - HEART[1]) > 84) return toast('اضغط على القلب لتمسك الغشاء');
      return removePeri();
    default:
      if (t === 'forceps' || t === 'scissors' || t === 'scalpel') return toast('القلب مكشوف — لا حاجة لأدوات القص الآن. استعمل المحاليل وساعة التوقيت.');
      return toast('هذه الأداة ليست لهذه الخطوة');
  }
}
function onMove(p) {
  const id = cur().id;
  if (S.tool === 'scissors' && S.cut && !S.cut.done && (id === 'girdle' || ((id === 'skin' || id === 'muscle') && S.liftPlaced))) { cutAt(p); checkCutPath(p); }
}
function bindInput() {
  const st = $('#stage');
  st.addEventListener('pointerdown', e => {
    S.ptr = svgPt(e); S.ptrMouse = e.pointerType === 'mouse';
    if (!S.tool) {
      const exp = expectedTool();
      if (!exp) return;
      S.tool = exp; updateTray();
      toast(`اخترتُ لك «${TOOLS[exp].label}» — يمكنك تغيير الأداة من الصينية`);
    }
    e.preventDefault();
    S.pressing = true;
    try { st.setPointerCapture(e.pointerId); } catch (err) {}
    onDown(S.ptr);
  });
  st.addEventListener('pointermove', e => {
    S.ptr = svgPt(e); S.ptrMouse = e.pointerType === 'mouse';
    if (S.pressing) onMove(S.ptr);
  });
  const up = e => { S.pressing = false; if (e.pointerType !== 'mouse') S.ptr = null; };
  st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
  st.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !S.pressing) S.ptr = null; });
  $('#card').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const a = b.dataset.act;
    if (a === 'next') next();
    else if (a === 'auto') autoDo();
    else if (a === 'start') startMeas();
    else if (a === 'record') record();
    else if (a === 'reset') reset();
    else if (a === 'tap') tapBeat();
  });
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && S.meas.running && !/^(BUTTON|INPUT|SUMMARY|TEXTAREA)$/.test(e.target.tagName)) { e.preventDefault(); tapBeat(); }
  });
  document.querySelectorAll('.speed button').forEach(b => b.addEventListener('click', () => { S.speed = +b.dataset.speed; updateSpeed(); }));
  $('#zoomBtn').addEventListener('click', () => zoomTo(!S.zoom));
  $('#soundBtn').addEventListener('click', () => { S.sound = !S.sound; ensureAudio(); updateStageCtl(); toast(S.sound ? 'صوت النبض مفعّل' : 'صوت النبض متوقف'); });
  $('#resetBtn').addEventListener('click', reset);
  $('#stageNext').addEventListener('click', next);
  const nt = $('#valsNote'); if (nt) nt.textContent = `القيم الافتراضية: ${DEF_RATES.base} في الحالة الطبيعية، و${DEF_RATES.adr} مع الأدرينالين، و${DEF_RATES.ach} مع الأستيل كولين. غيّرها لتطابق نتائج مختبرك، وستُطبَّق على الإضافات القادمة.`;
  const vals = [['#vBase', 'base'], ['#vAdr', 'adr'], ['#vAch', 'ach']];
  vals.forEach(([sel, k]) => {
    const inp = $(sel); inp.value = RATES[k];
    inp.addEventListener('change', () => {
      const v = Math.round(+inp.value);
      if (!(v >= 10 && v <= 200)) { inp.value = RATES[k]; return; }
      RATES[k] = v;
      try { localStorage.setItem(STORE_KEY, JSON.stringify(RATES)); } catch (err) {}
      if (!S.meas.running) { S.target = rateFor(S.drug); if (S.target !== S.rate) S.stable = false; }
      toast('حُدّثت قيم المحاكاة');
    });
  });
  window.addEventListener('resize', kymoResize);
}
function tapBeat() {
  if (!S.meas.running) return;
  S.meas.mine++;
  const el = $('#myCount'); if (el) el.textContent = S.meas.mine;
}

/* ---------- boot ---------- */
function boot() {
  K.cvs = $('#kymo'); K.ctx = K.cvs.getContext('2d');
  buildDefs(); buildScene(); renderTray(); bindInput();
  enterStep(); renderNotebook(); updateStageCtl(); updateSpeed();
  kymoResize(); readColors();
  requestAnimationFrame(t => { last = t; tick(t); });
}
boot();
})();
