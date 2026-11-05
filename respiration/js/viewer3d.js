/* المجسمات ثلاثية الأبعاد: الرئتان، الأسناخ، الهيموكلوبين (Three.js r128) */
(function () {
  'use strict';
  const lab = window.Lab;
  const T = () => window.THREE;

  function webgl() {
    try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
    catch (e) { return false; }
  }

  /* ---------- geometry helpers ---------- */
  function smoothSeams(g) {
    g.computeVertexNormals();
    const p = g.attributes.position, n = g.attributes.normal, map = new Map();
    for (let i = 0; i < p.count; i++) {
      const key = Math.round(p.getX(i) * 1e4) + ',' + Math.round(p.getY(i) * 1e4) + ',' + Math.round(p.getZ(i) * 1e4);
      let e = map.get(key);
      if (!e) { e = { x: 0, y: 0, z: 0, ids: [] }; map.set(key, e); }
      e.x += n.getX(i); e.y += n.getY(i); e.z += n.getZ(i); e.ids.push(i);
    }
    map.forEach(e => {
      if (e.ids.length < 2) return;
      const l = Math.hypot(e.x, e.y, e.z) || 1;
      e.ids.forEach(i => n.setXYZ(i, e.x / l, e.y / l, e.z / l));
    });
    n.needsUpdate = true;
  }
  function merge(list) {
    const THREE = T();
    let vc = 0, ic = 0;
    const hasCol = list.some(g => g.attributes.color);
    list.forEach(g => { vc += g.attributes.position.count; ic += g.index ? g.index.count : g.attributes.position.count; });
    const pos = new Float32Array(vc * 3), nor = new Float32Array(vc * 3), col = hasCol ? new Float32Array(vc * 3) : null, idx = new Uint32Array(ic);
    let vo = 0, io = 0;
    list.forEach(g => {
      const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color;
      pos.set(p.array, vo * 3); nor.set(n.array, vo * 3);
      if (col && c) col.set(c.array, vo * 3);
      if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) idx[io + i] = a[i] + vo; io += a.length; }
      else { for (let i = 0; i < p.count; i++) idx[io + i] = vo + i; io += p.count; }
      vo += p.count;
      g.dispose();
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    if (col) out.setAttribute('color', new THREE.BufferAttribute(col, 3));
    out.setIndex(new THREE.BufferAttribute(idx, 1));
    return out;
  }
  function gradientTube(curve, seg, rad, radial, c0, c1) {
    const THREE = T();
    const g = new THREE.TubeGeometry(curve, seg, rad, radial, false);
    const n = g.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i <= seg; i++) for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j, t = i / seg;
      col[k * 3] = lab.lerp(c0[0], c1[0], t); col[k * 3 + 1] = lab.lerp(c0[1], c1[1], t); col[k * 3 + 2] = lab.lerp(c0[2], c1[2], t);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }

  /* ---------- generic viewer ---------- */
  function Viewer(el, o) {
    this.el = el;
    this.ok = false;
    if (!T() || !webgl()) {
      el.insertAdjacentHTML('beforeend', '<div class="v-fallback">تعذّر تشغيل المجسم ثلاثي الأبعاد في هذا المتصفح. جرّب Chrome أو Safari حديثاً.</div>');
      return;
    }
    const THREE = T();
    this.ok = true;
    const R = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }));
    R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    el.prepend(R.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(o.fov || 32, 1, 0.1, 100);
    this.camera.position.set(o.cam[0], o.cam[1], o.cam[2]);
    const tg = o.target || [0, 0, 0];
    if (THREE.OrbitControls) {
      const c = (this.controls = new THREE.OrbitControls(this.camera, R.domElement));
      c.enableDamping = true; c.dampingFactor = 0.08; c.enablePan = false;
      c.minDistance = o.minD || 3; c.maxDistance = o.maxD || 14;
      c.target.set(tg[0], tg[1], tg[2]);
      c.autoRotate = !lab.reduce; c.autoRotateSpeed = o.spin || 0.7;
      let tm = 0;
      c.addEventListener('start', () => { c.autoRotate = false; clearTimeout(tm); });
      c.addEventListener('end', () => { clearTimeout(tm); tm = setTimeout(() => (c.autoRotate = !lab.reduce), 7000); });
      R.domElement.style.touchAction = 'pan-y';
    } else this.camera.lookAt(tg[0], tg[1], tg[2]);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x4a5a72, 0.9));
    const d = new THREE.DirectionalLight(0xffffff, 0.85); d.position.set(3, 5, 4); this.scene.add(d);
    const r = new THREE.DirectionalLight(0xa9c2ff, 0.4); r.position.set(-4, 2, -4); this.scene.add(r);
    this.labelBox = document.createElement('div'); this.labelBox.className = 'v-labels'; el.appendChild(this.labelBox);
    this.labels = []; this.showLabels = true;
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      R.setSize(w, h, false);
      this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    };
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(el); else window.addEventListener('resize', resize);
    resize();
    this.pickables = []; this.onPick = null;
    let down = null;
    R.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    R.domElement.addEventListener('pointerup', e => {
      if (!down) return;
      const dx = e.clientX - down[0], dy = e.clientY - down[1];
      down = null;
      if (dx * dx + dy * dy > 49 || !this.onPick) return;
      const rect = R.domElement.getBoundingClientRect();
      const v = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      const rc = new THREE.Raycaster();
      rc.setFromCamera(v, this.camera);
      const hits = rc.intersectObjects(this.pickables, false).filter(h => h.object.visible);
      this.onPick(hits[0] || null);
    });
    this.frame = null;
    this._v = new THREE.Vector3();
    lab.loop(el, (dt, t) => {
      if (this.frame) this.frame(dt, t);
      if (this.controls) this.controls.update();
      R.render(this.scene, this.camera);
      this.updateLabels();
    });
  }
  Viewer.prototype.label = function (text, pos, obj) {
    const THREE = T();
    const d = document.createElement('div');
    d.className = 'v-label'; d.textContent = text;
    this.labelBox.appendChild(d);
    const item = { el: d, pos: new THREE.Vector3(pos[0], pos[1], pos[2]), obj: obj || null, hidden: false };
    this.labels.push(item);
    return item;
  };
  Viewer.prototype.updateLabels = function () {
    const w = this.el.clientWidth, h = this.el.clientHeight, v = this._v;
    this.labels.forEach(l => {
      if (!this.showLabels || l.hidden) { if (l.el.style.display !== 'none') l.el.style.display = 'none'; return; }
      v.copy(l.pos);
      if (l.obj) l.obj.localToWorld(v);
      v.project(this.camera);
      if (v.z > 1) { l.el.style.display = 'none'; return; }
      l.el.style.display = '';
      l.el.style.left = (((v.x + 1) / 2) * w).toFixed(1) + 'px';
      l.el.style.top = (((1 - v.y) / 2) * h).toFixed(1) + 'px';
    });
  };
  Viewer.prototype.controlsBar = function (items) {
    const bar = document.createElement('div');
    bar.className = 'v-ctl';
    items.forEach(it => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip-btn'; b.textContent = it.label;
      b.setAttribute('aria-pressed', String(!!it.on));
      b.addEventListener('click', () => {
        const on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(on));
        it.cb(on);
      });
      bar.appendChild(b);
    });
    this.el.appendChild(bar);
    return bar;
  };
  Viewer.prototype.badge = function () { const b = document.createElement('div'); b.className = 'v-badge'; this.el.appendChild(b); return b; };
  Viewer.prototype.info = function () { const b = document.createElement('div'); b.className = 'v-info'; b.hidden = true; this.el.appendChild(b); return b; };

  const breathCurve = p => (p < 0.4 ? lab.ease(p / 0.4) : 1 - lab.ease((p - 0.4) / 0.6));

  /* =========================== الرئتان =========================== */
  function lungGeometry(side) {
    const THREE = T();
    const g = new THREE.SphereGeometry(1, 72, 56);
    const p = g.attributes.position, n = p.count;
    const lobe = new Float32Array(n), fiss = new Float32Array(n), mott = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const ux = p.getX(i), uy = p.getY(i), uz = p.getZ(i);
      const u = (uy + 1) / 2;
      const s = u > 0.32 ? 0.6 + 0.4 * (1 - Math.pow((u - 0.32) / 0.68, 1.4)) : 0.93 + 0.07 * (u / 0.32);
      let x = ux * s, y = uy, z = uz * s;
      if (x * side < 0) x *= 0.6;
      const tb = lab.clamp((-uy - 0.3) / 0.7, 0, 1), r2 = ux * ux + uz * uz;
      y += 0.42 * tb * (1 - Math.min(1, r2 * 1.15));
      if (side > 0) {
        const w = Math.exp(-Math.pow((uy + 0.35) / 0.28, 2)) * lab.clamp(uz * 1.4, 0, 1) * (x * side < 0.15 ? 1 : 0.3);
        x += 0.3 * w * side;
      } else x *= 1.07;
      x *= 0.98; y *= side < 0 ? 1.5 : 1.55; z *= 0.82;
      const nz = 1 + 0.012 * Math.sin(9 * ux + 1.3) * Math.sin(11 * uy) * Math.sin(8 * uz + 0.7);
      p.setXYZ(i, x * nz, y * nz, z * nz);
      const obl = uy - (-0.12 - 0.72 * uz);
      let id, f = 0;
      if (side < 0) {
        if (obl < 0) id = 2; else if (uy < 0.2 && uz > -0.2) id = 1; else id = 0;
        if (Math.abs(obl) < 0.022) f = 1;
        if (obl > 0 && uz > -0.2 && Math.abs(uy - 0.2) < 0.02) f = 1;
      } else {
        id = obl < 0 ? 2 : 0;
        if (Math.abs(obl) < 0.022) f = 1;
      }
      lobe[i] = id; fiss[i] = f;
      mott[i] = 0.94 + 0.06 * (0.5 + 0.5 * Math.sin(23 * ux) * Math.sin(19 * uy + 1) * Math.sin(21 * uz + 2));
    }
    smoothSeams(g);
    g.setAttribute('lobe', new THREE.BufferAttribute(lobe, 1));
    g.setAttribute('fiss', new THREE.BufferAttribute(fiss, 1));
    g.setAttribute('mott', new THREE.BufferAttribute(mott, 1));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return g;
  }
  const LOBE_COL = [[0.94, 0.65, 0.67], [0.89, 0.56, 0.61], [0.83, 0.5, 0.56]];
  const FISS_COL = [0.5, 0.24, 0.3];
  function paintLung(mesh, sel) {
    const g = mesh.geometry, lo = g.attributes.lobe, fi = g.attributes.fiss, mo = g.attributes.mott, col = g.attributes.color;
    for (let i = 0; i < lo.count; i++) {
      const id = lo.getX(i);
      let c = fi.getX(i) > 0 ? FISS_COL : LOBE_COL[id];
      if (sel === id && fi.getX(i) === 0) c = [lab.lerp(c[0], 1, 0.5), lab.lerp(c[1], 0.86, 0.5), lab.lerp(c[2], 0.5, 0.5)];
      const m = mo.getX(i);
      col.setXYZ(i, c[0] * m, c[1] * m, c[2] * m);
    }
    col.needsUpdate = true;
  }
  function bronchTree(side, rnd) {
    const THREE = T();
    const parts = [];
    const inside = q => (q.x * q.x) / 0.72 + ((q.y + 0.1) * (q.y + 0.1)) / 1.9 + (q.z * q.z) / 0.5 < 1;
    function br(a, dir, len, rad, depth) {
      const b = a.clone().addScaledVector(dir, len);
      let k = 0;
      while (!inside(b) && k < 6) { len *= 0.72; b.copy(a).addScaledVector(dir, len); k++; }
      parts.push(new THREE.TubeGeometry(new THREE.LineCurve3(a.clone(), b.clone()), 1, rad, 6, false));
      parts.push(new THREE.SphereGeometry(rad, 6, 4).translate(b.x, b.y, b.z));
      if (depth === 0) return;
      for (let c = 0; c < 2; c++) {
        const nd = dir.clone();
        const axis = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
        nd.applyAxisAngle(axis, (0.45 + rnd() * 0.35) * (c ? 1 : -1));
        nd.y -= 0.12; nd.normalize();
        br(b, nd, len * 0.74, rad * 0.72, depth - 1);
      }
    }
    const start = new THREE.Vector3(-side * 0.36, 0.48, -0.05);
    [[side * 0.35, 0.85, 0.05], [side * 0.85, -0.1, 0.12], [side * 0.3, -0.92, -0.05]].forEach(d =>
      br(start, new THREE.Vector3(d[0], d[1], d[2]).normalize(), 0.55, 0.06, 4));
    return merge(parts);
  }

  function buildLungs(el) {
    const V = new Viewer(el, { cam: [0, 0.5, 8.6], target: [0, 0.2, 0], minD: 4.5, maxD: 13, spin: 0.55, fov: 32 });
    if (!V.ok) return;
    const THREE = T(), S = V.scene;
    const root = new THREE.Group(); S.add(root);
    const cart = new THREE.MeshStandardMaterial({ color: 0xf1e1cd, roughness: 0.55 });
    const cartD = new THREE.MeshStandardMaterial({ color: 0xe2cbb0, roughness: 0.5 });
    const lungs = [];
    const lungGroup = new THREE.Group(); root.add(lungGroup);
    const visc = [], pari = [], trees = [];
    [-1, 1].forEach(side => {
      const g = lungGeometry(side);
      const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0, transparent: false, opacity: 1 });
      const m = new THREE.Mesh(g, mat);
      m.position.set(side * 1.03, 0.12, 0);
      m.userData = { side, kind: 'lung' };
      lungGroup.add(m); lungs.push(m); paintLung(m, -1);
      const tree = new THREE.Mesh(bronchTree(side, lab.rnd(side > 0 ? 11 : 5)), cart);
      tree.visible = false; m.add(tree); trees.push(tree);
      const vp = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xd6ecff, transparent: true, opacity: 0.2, roughness: 0.15, depthWrite: false }));
      vp.scale.setScalar(1.035); vp.visible = false; m.add(vp); visc.push(vp);
      const pp = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x9ec1ff, transparent: true, opacity: 0.13, roughness: 0.3, depthWrite: false, side: THREE.DoubleSide }));
      pp.scale.setScalar(1.12); pp.visible = false; m.add(pp); pari.push(pp);
    });
    // القصبة الهوائية والشعبتان
    const trachea = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.175, 1.35, 28, 1, true), cart);
    trachea.position.set(0, 2.08, 0); trachea.userData.kind = 'trachea'; root.add(trachea);
    for (let k = 0; k < 9; k++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.178, 0.03, 8, 30), cartD);
      ring.rotation.x = Math.PI / 2; ring.position.set(0, 1.5 + k * 0.135, 0); root.add(ring);
    }
    [[-1, [-0.32, 1.1, 0], [-0.66, 0.66, -0.05]], [1, [0.36, 1.14, 0], [0.7, 0.72, -0.05]]].forEach(b => {
      const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.42, 0), new THREE.Vector3(...b[1]), new THREE.Vector3(...b[2])]);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(c, 24, 0.105, 14, false), cart);
      tube.userData.kind = 'bronchus'; root.add(tube); V.pickables.push(tube);
    });
    // القلب
    const heart = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 24), new THREE.MeshStandardMaterial({ color: 0xa8303f, roughness: 0.45 }));
    heart.scale.set(1, 1.2, 0.85); heart.rotation.z = 0.5; heart.position.set(0.24, -0.5, 0.42); heart.userData.kind = 'heart'; root.add(heart);
    // الحجاب الحاجز
    const dia = new THREE.Mesh(new THREE.SphereGeometry(1, 56, 20, 0, Math.PI * 2, 0, Math.PI * 0.45),
      new THREE.MeshStandardMaterial({ color: 0xb4564c, roughness: 0.7, side: THREE.DoubleSide }));
    dia.scale.set(2.25, 0.66, 1.45); dia.position.y = -1.42; dia.userData.kind = 'dia'; root.add(dia);
    V.pickables.push(...lungs, trachea, heart, dia);

    // labels
    V.label('القصبة الهوائية', [0.75, 2.45, 0]);
    V.label('الرئة اليمنى · 3 فصوص', [-1.35, 1.75, 0.3]);
    V.label('الرئة اليسرى · فصان', [1.35, 1.75, 0.3]);
    V.label('الحجاب الحاجز', [1.75, -1.25, 0.6]);
    const badge = V.badge();
    const info = V.info();
    let breathing = !lab.reduce, t = 0, sel = null, infoTimer = 0;
    V.controlsBar([
      { label: 'تنفس', on: breathing, cb: on => (breathing = on) },
      { label: 'الشجرة القصبية', on: false, cb: on => { trees.forEach(tr => (tr.visible = on)); lungs.forEach(m => { m.material.transparent = on; m.material.opacity = on ? 0.3 : 1; m.material.depthWrite = !on; m.material.needsUpdate = true; }); } },
      { label: 'غشاء الجنب', on: false, cb: on => { visc.forEach(v => (v.visible = on)); pari.forEach(v => (v.visible = on)); showInfo(on ? ['غشاء الجنب', 'الطبقة الملاصقة للرئة هي الغشاء الحشوي، والطبقة الخارجية هي الجداري، وبينهما التجويف الجنبي المملوء بسائل انزلاقي.'] : null); } },
      { label: 'الأسماء', on: true, cb: on => (V.showLabels = on) }
    ]);
    const LOBES = ['الفص العلوي', 'الفص الأوسط', 'الفص السفلي'];
    function showInfo(x) {
      clearTimeout(infoTimer);
      if (!x) { info.hidden = true; return; }
      info.innerHTML = `<b>${x[0]}</b>${x[1]}`; info.hidden = false;
      infoTimer = setTimeout(() => { info.hidden = true; if (sel) { paintLung(sel, -1); sel = null; } }, 7000);
    }
    V.onPick = hit => {
      if (sel) { paintLung(sel, -1); sel = null; }
      if (!hit) { showInfo(null); return; }
      const k = hit.object.userData.kind;
      if (k === 'lung') {
        const m = hit.object, id = m.geometry.attributes.lobe.getX(hit.face.a);
        sel = m; paintLung(m, id);
        const right = m.userData.side < 0;
        showInfo([`${LOBES[id]} · ${right ? 'الرئة اليمنى' : 'الرئة اليسرى'}`, right ? 'الرئة اليمنى ثلاثة فصوص: علوي وأوسط وسفلي. لكل فص تجهيز هوائي ودموي خاص به.' : 'الرئة اليسرى فصان: علوي وسفلي، وفيها تقعّر يفسح مكاناً للقلب.']);
      } else if (k === 'trachea' || k === 'bronchus') showInfo([k === 'trachea' ? 'القصبة الهوائية' : 'القصبة (الشعبة) الهوائية', 'تمرر الهواء إلى الرئتين وتتفرع داخلهما إلى فروع أدق حتى الأكياس السنخية.']);
      else if (k === 'dia') showInfo(['الحجاب الحاجز', 'عضلة تتقلص في الشهيق فتصبح مستوية بعد أن كانت محدبة إلى الأعلى، فيتوسع القفص الصدري.']);
      else if (k === 'heart') showInfo(['القلب', 'يقع بين الرئتين. يضخ الدم إليهما ليتأكسج، والخرج القلبي حوالي 5 لتر/دقيقة.']);
    };
    V.frame = dt => {
      if (breathing) t += dt;
      const p = (t % 5) / 5, b = breathCurve(p);
      lungGroup.scale.set(1 + 0.065 * b, 1 + 0.055 * b, 1 + 0.065 * b);
      lungGroup.position.y = -0.06 * b;
      dia.position.y = -1.42 - 0.17 * b;
      dia.scale.y = 0.66 - 0.2 * b;
      const txt = !breathing ? 'متوقف' : p < 0.4 ? 'شهيق ↓ الحجاب' : 'زفير ↑ الحجاب';
      if (badge.textContent !== txt) badge.textContent = txt;
    };
  }

  /* =========================== الأسناخ =========================== */
  function buildAlveoli(el) {
    const V = new Viewer(el, { cam: [0, 0.3, 6.6], target: [0, -0.15, 0], minD: 3.2, maxD: 10, spin: 0.8, fov: 34 });
    if (!V.ok) return;
    const THREE = T(), S = V.scene;
    const root = new THREE.Group(); S.add(root);
    const rnd = lab.rnd(7);
    const cream = new THREE.MeshStandardMaterial({ color: 0xf0dcc6, roughness: 0.5 });
    const ductMat = new THREE.MeshPhysicalMaterial({ color: 0xeeb2b0, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3 });
    const alvMat = new THREE.MeshPhysicalMaterial({ color: 0xf0b6b4, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25, transparent: true, opacity: 0.94 });
    root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0, 2.4, 0), new THREE.Vector3(0, 0.95, 0)), 1, 0.17, 18), cream));
    for (let k = 0; k < 5; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.022, 6, 24), new THREE.MeshStandardMaterial({ color: 0xe0c7aa })); r.rotation.x = Math.PI / 2; r.position.y = 1.2 + k * 0.24; root.add(r); }
    const hub = new THREE.Vector3(0, 0.3, 0);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0, 1.0, 0), hub), 1, 0.13, 16), ductMat));
    const centers = [new THREE.Vector3(-0.92, -0.4, 0.1), new THREE.Vector3(0.92, -0.32, -0.1), new THREE.Vector3(0.05, -1.08, 0.38)];
    const blue = [0.24, 0.4, 0.84], red = [0.83, 0.23, 0.31];
    const sacs = [];
    const dummy = new THREE.Object3D(), cA = new THREE.Color(), cB = new THREE.Color();
    centers.forEach((c, si) => {
      const duct = new THREE.CatmullRomCurve3([hub.clone(), hub.clone().lerp(c, 0.5).add(new THREE.Vector3(0, 0.08, 0)), c.clone()]);
      root.add(new THREE.Mesh(new THREE.TubeGeometry(duct, 16, 0.1, 12), ductMat));
      const sg = new THREE.Group(); sg.position.copy(c); root.add(sg);
      const N = 11, caps = [], curves = [];
      for (let i = 0; i < N; i++) {
        const yv = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(1 - yv * yv), th = i * 2.399963 + si;
        const dir = new THREE.Vector3(Math.cos(th) * rr, yv, Math.sin(th) * rr).normalize();
        if (dir.y > 0.75) dir.y = 0.4;
        dir.normalize();
        const r = 0.27 + rnd() * 0.08, pc = dir.clone().multiplyScalar(0.46 + rnd() * 0.06);
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), alvMat);
        m.position.copy(pc); sg.add(m);
        for (let a = 0; a < 3; a++) {
          const ax = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
          const st = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).cross(ax).normalize();
          const pts = [];
          for (let q = 0; q <= 8; q++) pts.push(st.clone().applyAxisAngle(ax, -1.2 + (q / 8) * 2.4).multiplyScalar(r * 1.045).add(pc));
          const cv = new THREE.CatmullRomCurve3(pts);
          curves.push(cv);
          caps.push(gradientTube(cv, 20, 0.016, 5, blue, red));
        }
      }
      const capMesh = new THREE.Mesh(merge(caps), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45 }));
      sg.add(capMesh);
      const count = 34;
      const rbc = new THREE.InstancedMesh(new THREE.SphereGeometry(0.034, 8, 6), new THREE.MeshStandardMaterial({ roughness: 0.4 }), count);
      const st = [];
      for (let i = 0; i < count; i++) st.push({ c: Math.floor(rnd() * curves.length), t: rnd() });
      sg.add(rbc);
      sacs.push({ sg, curves, rbc, st, capMesh });
    });
    // الشرين والوريد الرئوي
    const art = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.42, 2.3, -0.3), new THREE.Vector3(-0.38, 1.0, -0.32), new THREE.Vector3(-0.7, 0.05, -0.4), new THREE.Vector3(-0.95, -0.35, -0.38)]);
    const ven = new THREE.CatmullRomCurve3([new THREE.Vector3(0.42, 2.3, -0.3), new THREE.Vector3(0.38, 1.0, -0.32), new THREE.Vector3(0.7, 0.05, -0.42), new THREE.Vector3(0.95, -0.3, -0.4)]);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(art, 40, 0.07, 10), new THREE.MeshStandardMaterial({ color: 0x3d67d6, roughness: 0.4 })));
    root.add(new THREE.Mesh(new THREE.TubeGeometry(ven, 40, 0.07, 10), new THREE.MeshStandardMaterial({ color: 0xd23a4f, roughness: 0.4 })));

    V.label('القصيبة الهوائية', [0.62, 1.95, 0]);
    V.label('القناة السنخية', [0.55, 0.62, 0.1]);
    V.label('الكيس السنخي', [-0.92, 0.42, 0.45]);
    V.label('سنخ (0.2 ملم)', [0.05, -1.75, 0.6]);
    V.label('شُرين: دم غير مؤكسج', [-0.85, 2.45, -0.3]);
    V.label('وريد: دم مؤكسج', [0.85, 2.45, -0.3]);
    let breathing = !lab.reduce, t = 0;
    V.controlsBar([
      { label: 'تنفس', on: breathing, cb: on => (breathing = on) },
      { label: 'الشعيرات', on: true, cb: on => sacs.forEach(s => { s.capMesh.visible = on; s.rbc.visible = on; }) },
      { label: 'الأسماء', on: true, cb: on => (V.showLabels = on) }
    ]);
    const tmp = new THREE.Vector3();
    V.frame = dt => {
      if (breathing) t += dt;
      const b = breathCurve((t % 5) / 5);
      sacs.forEach(s => {
        s.sg.scale.setScalar(1 + 0.06 * b);
        if (!s.rbc.visible) return;
        for (let i = 0; i < s.st.length; i++) {
          const q = s.st[i];
          q.t += dt * 0.22;
          if (q.t > 1) { q.t -= 1; q.c = Math.floor(Math.random() * s.curves.length); }
          s.curves[q.c].getPoint(lab.clamp(q.t, 0, 1), tmp);
          dummy.position.copy(tmp); dummy.scale.set(1, 0.55, 1); dummy.updateMatrix();
          s.rbc.setMatrixAt(i, dummy.matrix);
          cA.setRGB(blue[0], blue[1], blue[2]); cB.setRGB(red[0], red[1], red[2]);
          cA.lerp(cB, lab.clamp(q.t * 1.3, 0, 1));
          if (s.rbc.setColorAt) s.rbc.setColorAt(i, cA);
        }
        s.rbc.instanceMatrix.needsUpdate = true;
        if (s.rbc.instanceColor) s.rbc.instanceColor.needsUpdate = true;
      });
    };
  }

  /* =========================== الهيموكلوبين =========================== */
  function blobGeometry(seed, r) {
    const THREE = T();
    const g = new THREE.IcosahedronGeometry(r, 4);
    const p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const u = v.clone().normalize();
      const n = 1 + 0.1 * Math.sin(3.1 * u.x + seed) * Math.sin(2.7 * u.y + seed * 1.7) * Math.sin(3.3 * u.z + seed * 0.6)
        + 0.05 * Math.sin(7.3 * u.x + seed * 2) * Math.sin(6.1 * u.y) * Math.sin(7.7 * u.z + seed)
        + 0.025 * Math.sin(14 * u.x) * Math.sin(13 * u.y + seed) * Math.sin(15 * u.z);
      v.multiplyScalar(n);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    smoothSeams(g);
    return g;
  }
  function buildHb(el) {
    const V = new Viewer(el, { cam: [0, 0.4, 6.8], target: [0, 0, 0], minD: 3.6, maxD: 11, spin: 0.9, fov: 34 });
    const api = { count: 0, busy: false, listeners: [] };
    lab.hb = api;
    if (!V.ok) {
      // نسخة بلا رسم: تحافظ على عمل المعادلات والأزرار
      api.add = () => { if (api.count < 4) { api.count++; api.listeners.forEach(f => f(api.count)); } };
      api.remove = () => { if (api.count > 0) { api.count--; api.listeners.forEach(f => f(api.count)); } };
      api.setTarget = n => { api.count = n; api.listeners.forEach(f => f(api.count)); };
      return;
    }
    const THREE = T(), S = V.scene;
    const root = new THREE.Group(); S.add(root);
    const defs = [
      { pos: [-0.64, 0.5, 0.38], col: 0xe0808b, name: 'α', grp: 0 },
      { pos: [0.64, 0.5, -0.38], col: 0x7d90e0, name: 'β', grp: 1 },
      { pos: [0.64, -0.5, 0.38], col: 0xe0808b, name: 'α', grp: 0 },
      { pos: [-0.64, -0.5, -0.38], col: 0x7d90e0, name: 'β', grp: 1 }
    ];
    const deoxy = new THREE.Color(0x531431), oxy = new THREE.Color(0xd6223c);
    const subs = defs.map((d, i) => {
      const g = new THREE.Group(); g.position.set(...d.pos); root.add(g);
      const blob = new THREE.Mesh(blobGeometry(i * 1.7 + 0.4, 0.66), new THREE.MeshStandardMaterial({ color: d.col, roughness: 0.78 }));
      g.add(blob);
      const dir = new THREE.Vector3(...d.pos).normalize();
      const heme = new THREE.Group();
      heme.position.copy(dir.clone().multiplyScalar(0.6));
      heme.lookAt(dir.clone().multiplyScalar(5).add(g.position));
      g.add(heme);
      const ringMat = new THREE.MeshStandardMaterial({ color: deoxy.clone(), roughness: 0.35, metalness: 0.1 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.038, 8, 4), ringMat);
      ring.rotation.z = Math.PI / 4; heme.add(ring);
      for (let k = 0; k < 4; k++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), ringMat);
        s.position.set(Math.cos(k * Math.PI / 2) * 0.17, Math.sin(k * Math.PI / 2) * 0.17, 0); heme.add(s);
      }
      const fe = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshStandardMaterial({ color: 0xe39a32, emissive: 0x3a2200, roughness: 0.3, metalness: 0.4 }));
      heme.add(fe);
      return { g, heme, ringMat, base: g.rotation.y, grp: d.grp, ox: 0 };
    });
    function o2Mesh() {
      const grp = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: 0xff3b55, roughness: 0.3, transparent: true, opacity: 1 });
      [-0.075, 0.075].forEach(x => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), mat); s.position.x = x; grp.add(s); });
      grp.userData.mat = mat;
      return grp;
    }
    const site = new THREE.Vector3(0.04, 0, 0.17);
    const order = [0, 2, 1, 3];
    const bound = [null, null, null, null];
    let relax = 0, queue = [], anim = null, target = null;
    V.label('وحدة ثانوية α', [-1.25, 1.15, 0.5]);
    V.label('وحدة ثانوية β', [1.25, 1.15, -0.5]);
    V.label('هيم + \u2066Fe²⁺\u2069', [-1.05, -1.25, -0.3]);
    V.controlsBar([{ label: 'الأسماء', on: true, cb: on => (V.showLabels = on) }]);
    function emit() { api.listeners.forEach(f => f(api.count)); }
    function step() {
      if (anim || !queue.length) return;
      const op = queue.shift();
      if (op === 'add') {
        const idx = order.find(i => !bound[i]);
        if (idx === undefined) return step();
        const s = subs[idx], m = o2Mesh();
        const far = new THREE.Vector3(Math.sin(idx * 2.1) * 3.4, 2.2 - idx * 0.6, Math.cos(idx * 2.1) * 3.4);
        root.updateMatrixWorld(true);
        const from = s.heme.worldToLocal(far.clone());
        s.heme.add(m); m.position.copy(from); m.rotation.z = 0.6;
        bound[idx] = m;
        const dur = api.count === 0 ? 1.5 : 0.6;
        anim = { m, from, to: site.clone(), t: 0, dur, done: () => { api.count++; emit(); } , idx, kind: 'add' };
      } else {
        const idx = [...order].reverse().find(i => bound[i]);
        if (idx === undefined) return step();
        const s = subs[idx], m = bound[idx];
        bound[idx] = null;
        const to = site.clone().add(new THREE.Vector3(0.6, 0.8, 3));
        anim = { m, from: m.position.clone(), to, t: 0, dur: 0.9, idx, kind: 'rem', done: () => { s.heme.remove(m); api.count--; emit(); } };
      }
      api.busy = true;
    }
    api.add = () => { if (api.count + queue.filter(q => q === 'add').length - queue.filter(q => q === 'rem').length < 4) { queue.push('add'); step(); } };
    api.remove = () => { if (api.count + queue.filter(q => q === 'add').length - queue.filter(q => q === 'rem').length > 0) { queue.push('rem'); step(); } };
    api.setTarget = n => {
      queue = [];
      target = n;
      const pending = api.count + (anim ? (anim.kind === 'add' ? 1 : -1) : 0);
      const diff = n - pending;
      for (let i = 0; i < Math.abs(diff); i++) queue.push(diff > 0 ? 'add' : 'rem');
      step();
    };
    V.frame = dt => {
      if (anim) {
        anim.t += dt / anim.dur;
        const k = lab.ease(Math.min(1, anim.t));
        anim.m.position.lerpVectors(anim.from, anim.to, k);
        if (anim.kind === 'rem') anim.m.userData.mat.opacity = 1 - k;
        if (anim.t >= 1) { const a = anim; anim = null; api.busy = false; a.done(); step(); }
      }
      const want = api.count > 0 || (anim && anim.kind === 'add') ? 1 : 0;
      relax += (want - relax) * Math.min(1, dt * 2.5);
      subs.forEach((s, i) => {
        s.g.rotation.y = (s.grp ? -1 : 1) * 0.16 * relax;
        const on = bound[i] && !(anim && anim.idx === i && anim.kind === 'add' && anim.t < 0.9) ? 1 : 0;
        s.ox += (on - s.ox) * Math.min(1, dt * 4);
        s.ringMat.color.copy(deoxy).lerp(oxy, s.ox);
      });
    };
  }

  lab.ready.push(() => {
    const a = document.getElementById('lung3d'), b = document.getElementById('alv3d'), c = document.getElementById('hb3d');
    if (a) buildLungs(a);
    if (b) buildAlveoli(b);
    if (c) buildHb(c);
  });
})();
