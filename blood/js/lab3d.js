/* مختبر سحب الدم ثلاثي الأبعاد: الذراع والأوردة والأدوات، ووخز الإصبع */
(function () {
  'use strict';
  const lab = window.Lab;
  const T = () => window.THREE;
  const TILT = 0.1;          // ميلان الذراع: الكتف أعلى واليد على المسند
  const TOP = -0.565;        // سطح الطاولة
  const REST = -0.445;       // سطح مسند الذراع
  const W = 0.046;           // عرض انتفاخ الوريد تحت الجلد

  function roundCone(px, py, pz, a, b, r1, r2) {
    const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
    const l2 = bax * bax + bay * bay + baz * baz, rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
    const pax = px - a[0], pay = py - a[1], paz = pz - a[2];
    const y = pax * bax + pay * bay + paz * baz, z = y - l2;
    const qx = pax * l2 - bax * y, qy = pay * l2 - bay * y, qz = paz * l2 - baz * y;
    const x2 = qx * qx + qy * qy + qz * qz, y2 = y * y * l2, z2 = z * z * l2, k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
    if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
    return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
  }

  /* الذراع الأيمن ممدود والكف للأعلى. المحلي: الكتف نحو +x واليد نحو -x، الإبهام نحو -z، المرفق عند الأصل */
  function armSDF(K) {
    const S = K.sdf;
    return (x, y, z) => {
      if (x > 4.75 || x < -3.75 || Math.abs(y) > 0.78 || Math.abs(z) > 0.78) return 0.3;
      let d = roundCone(x, y, z, [4.7, 0.02, 0], [0.35, 0, 0], 0.5, 0.43);                     // العضد
      d = S.smin(d, S.ellipsoid(x - 1.75, y - 0.13, z, 1.15, 0.37, 0.39), 0.28);                // ذات الرأسين
      d = S.smin(d, S.sphere(x - 0.05, y + 0.02, z, 0.42), 0.22);                               // المرفق
      const fy = 1 + 0.32 * S.ss(0.3, -2.4, x);
      d = S.smin(d, roundCone(x, y * fy, z * 0.95, [0.05, 0, 0], [-2.45, 0.01, 0], 0.42, 0.25), 0.2); // الساعد يتسطح نحو الرسغ
      d = S.smin(d, S.ellipsoid(x + 0.8, y - 0.03, z, 0.95, 0.33, 0.42), 0.26);                 // عضلات الساعد
      d = S.smax(d, -S.ellipsoid(x - 0.02, y - 0.47, z - 0.02, 0.34, 0.09, 0.22), 0.14);        // الحفرة المرفقية
      d = S.smin(d, S.ellipsoid(x + 2.95, y, z, 0.5, 0.13, 0.4), 0.16);                         // الكف
      d = S.smin(d, S.capsule(x, y * 1.25, z, -3.3, 0, -0.27, -3.3, 0, 0.27, 0.105), 0.12);     // رؤوس عظام المشط
      d = S.smin(d, S.ellipsoid(x + 2.78, y - 0.07, z + 0.24, 0.32, 0.12, 0.18), 0.12);         // بارزة الإبهام
      d = S.smin(d, S.ellipsoid(x + 2.9, y - 0.05, z - 0.28, 0.36, 0.1, 0.14), 0.12);           // بارزة الخنصر
      return S.smax(d, x - 4.55, 0.12);
    };
  }

  /* كبسولة بالدوران تمتد على -x (سلاميات الأصابع) */
  function capsuleGeo(THREE, len, r0, r1, tip) {
    const pts = [];
    for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (i / 8) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.cos(a) * r0, Math.sin(a) * r0)); }
    for (let i = 1; i < 6; i++) { const t = i / 6; pts.push(new THREE.Vector2(r0 + (r1 - r0) * t, len * t)); }
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.cos(a) * r1, len + Math.sin(a) * r1)); }
    const g = new THREE.LatheGeometry(pts, 24);
    g.rotateZ(Math.PI / 2);
    // ألوان: ثنية المفصل في الوجه الراحي، ووسادة رأس الإصبع أكثر احمراراً
    const p = g.attributes.position, c = new Float32Array(p.count * 3);
    const top = [0.82, 0.6, 0.47], back = [0.74, 0.5, 0.37], crease = [0.58, 0.36, 0.27], pad = [0.84, 0.55, 0.45];
    const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), r = Math.max(r0, r1);
      const up = ss(-r * 0.6, r * 0.6, y);
      let col = back.map((v, k) => v + (top[k] - v) * up);
      const cr = (1 - ss(0.004, 0.02, Math.abs(x + 0.012))) * ss(0.2 * r, 0.7 * r, y) * 0.75;
      col = col.map((v, k) => v + (crease[k] - v) * cr);
      if (tip) { const pd = ss(-len * 0.35, -len * 0.75, x) * up * 0.6; col = col.map((v, k) => v + (pad[k] - v) * pd); }
      c[i * 3] = col[0] ** 2.2; c[i * 3 + 1] = col[1] ** 2.2; c[i * 3 + 2] = col[2] ** 2.2;
    }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return g;
  }
  /* لوح مستطيل بحواف مدوّرة: lx على x، lz على z، الارتفاع h على y وقاعدته عند 0 */
  function slab(THREE, lx, lz, h, r) {
    const s = new THREE.Shape(), x0 = -lx / 2, z0 = -lz / 2;
    s.moveTo(x0 + r, z0); s.lineTo(x0 + lx - r, z0); s.quadraticCurveTo(x0 + lx, z0, x0 + lx, z0 + r);
    s.lineTo(x0 + lx, z0 + lz - r); s.quadraticCurveTo(x0 + lx, z0 + lz, x0 + lx - r, z0 + lz);
    s.lineTo(x0 + r, z0 + lz); s.quadraticCurveTo(x0, z0 + lz, x0, z0 + lz - r);
    s.lineTo(x0, z0 + r); s.quadraticCurveTo(x0, z0, x0 + r, z0);
    const b = Math.min(r * 0.6, h * 0.35);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.0005, h - 2 * b), bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 4, curveSegments: 10 });
    g.rotateX(Math.PI / 2); g.translate(0, h - b, 0);
    return g;
  }
  /* شريط مغلق يتبع مقطع الذراع (الرباط الضاغط) */
  function bandGeo(THREE, ring, w, t) {
    const n = ring.length, pos = [], idx = [];
    for (let i = 0; i < n; i++) {
      const [y, z, ny, nz] = ring[i];
      for (const [sx, o] of [[-1, 0], [1, 0], [1, t], [-1, t]]) pos.push((sx * w) / 2, y + ny * o, z + nz * o);
    }
    for (let i = 0; i < n; i++) {
      const a = i * 4, b = ((i + 1) % n) * 4;
      for (let s = 0; s < 4; s++) { const s2 = (s + 1) % 4; idx.push(a + s, b + s, b + s2, a + s, b + s2, a + s2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  function build(el) {
    const THREE = T(), K = lab.k3, S = K.sdf;
    const HOME = [[-0.55, 4.5, 5.4], [-0.95, -0.4, -0.5]];
    const V = new K.Viewer(el, { cam: HOME[0], target: HOME[1], minD: 0.5, maxD: 14, spin: 0, fov: 32, shadows: true, shadowSize: 4.8, exposure: 0.88, hemi: 0.3, keyI: 1.3 });
    if (!V.ok) { api.fail(); return; }
    V.loading(true);
    const sc = V.scene, root = new THREE.Group(); sc.add(root);
    const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const arm = armSDF(K);
    const armG = new THREE.Group(); armG.rotation.z = TILT; root.add(armG); armG.updateMatrixWorld(true);
    const toW = p => armG.localToWorld(p.clone());
    const toL = p => armG.worldToLocal(p.clone());
    const dirW = d => d.clone().transformDirection(armG.matrixWorld);

    /* ---------- الطاولة ومسند الذراع ---------- */
    const benchMat = K.tissue({ a: 0x8f9ba8, b: 0x8996a3, edge: 0x7f8b98, speck: 0x6d7987, speckAmt: 0.25, cell: 9, noise: 3, bump: 0.0008, edgeAmt: 0.05, rim: 0xdfe8f0, rimAmt: 0.05, clearcoat: 0.18, ccr: 0.45, roughness: 0.7, env: 0.4 });
    const bench = new THREE.Mesh(slab(THREE, 9.6, 2.9, 0.16, 0.12), benchMat);
    bench.position.set(-0.3, TOP - 0.16, -0.55); bench.receiveShadow = true; root.add(bench);
    const restMat = K.tissue({ a: 0x2a3b4f, b: 0x263649, edge: 0x1f2d3d, cell: 40, noise: 6, bump: 0.0012, edgeAmt: 0.08, rim: 0x8fb3d9, rimAmt: 0.12, clearcoat: 0.55, ccr: 0.3, roughness: 0.45 });
    const rest = new THREE.Mesh(slab(THREE, 7.2, 1.3, REST - TOP, 0.16), restMat);
    rest.position.set(-0.75, TOP, 0.02); rest.castShadow = true; rest.receiveShadow = true; root.add(rest);
    const padMat = K.tissue({ a: 0x9cc8ea, b: 0x93c0e3, edge: 0x7fb0d8, cell: 70, noise: 9, bump: 0.0018, edgeAmt: 0.12, rim: 0xe1f1ff, rimAmt: 0.1, clearcoat: 0, roughness: 0.92 });
    const pad = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.006, 1.05), padMat);
    pad.position.set(-0.3, REST + 0.003, 0.02); pad.receiveShadow = true; root.add(pad);

    /* ---------- الذراع ---------- */
    const g = K.surfaceNets(arm, [-3.62, -0.62, -0.7], [4.72, 0.66, 0.7], K.lite ? 0.026 : 0.019, { coarse: 3, smooth: 1 });
    const surfY = (x, z) => { let lo = -0.1, hi = 0.9; for (let i = 0; i < 26; i++) { const m = (lo + hi) / 2; if (arm(x, m, z) < 0) lo = m; else hi = m; } return (lo + hi) / 2; };
    const normalAt = p => { const h = 0.004; return v3(arm(p.x + h, p.y, p.z) - arm(p.x - h, p.y, p.z), arm(p.x, p.y + h, p.z) - arm(p.x, p.y - h, p.z), arm(p.x, p.y, p.z + h) - arm(p.x, p.y, p.z - h)).normalize(); };
    // الأوردة السطحية (المسارات على الوجه الأمامي، الإبهام نحو -z)
    const VEINS = {
      mcub: { name: 'الوريد المرفقي الأوسط', k: 1, pts: [[-0.44, -0.33], [-0.22, -0.2], [0.0, -0.06], [0.2, 0.09], [0.44, 0.29]] },
      ceph: { name: 'الوريد الرأسي', k: 0.9, pts: [[-2.35, -0.18], [-1.5, -0.29], [-0.7, -0.34], [-0.2, -0.335], [0.5, -0.31], [1.4, -0.3], [2.6, -0.27], [4.2, -0.24]] },
      bas: { name: 'الوريد القاعدي', k: 0.85, pts: [[-2.35, 0.16], [-1.5, 0.29], [-0.7, 0.33], [0.0, 0.325], [0.6, 0.28], [1.3, 0.21], [1.9, 0.16]] },
      mant: { name: 'الوريد الأوسط للساعد', k: 0.6, pts: [[-2.15, -0.02], [-1.4, 0.01], [-0.75, -0.06], [-0.32, -0.17]] }
    };
    const VK = Object.keys(VEINS);
    VK.forEach(k => {
      const vn = VEINS[k];
      vn.curve = new THREE.CatmullRomCurve3(vn.pts.map(([x, z]) => v3(x, surfY(x, z), z)));
      vn.surf = vn.curve.getPoints(70);
      const a = new Float32Array(vn.surf.length * 3); vn.surf.forEach((p, i) => { a[i * 3] = p.x; a[i * 3 + 1] = p.y; a[i * 3 + 2] = p.z; });
      vn.a = a;
      const xs = vn.surf.map(p => p.x), zs = vn.surf.map(p => p.z);
      vn.box = [Math.min(...xs) - 0.12, Math.max(...xs) + 0.12, Math.min(...zs) - 0.12, Math.max(...zs) + 0.12];
    });
    // أقرب نقطة على مسار (بدون إنشاء كائنات)
    const near = { d: 9, t: 0, cx: 0, cy: 0, cz: 0 };
    function nearest(a, px, py, pz) {
      let best = 1e9, bt = 0, bx = 0, by = 0, bz = 0;
      const n = a.length / 3;
      for (let i = 0; i < n - 1; i++) {
        const ax = a[i * 3], ay = a[i * 3 + 1], az = a[i * 3 + 2], ex = a[i * 3 + 3] - ax, ey = a[i * 3 + 4] - ay, ez = a[i * 3 + 5] - az;
        let t = ((px - ax) * ex + (py - ay) * ey + (pz - az) * ez) / (ex * ex + ey * ey + ez * ez);
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const cx = ax + ex * t, cy = ay + ey * t, cz = az + ez * t, dd = (px - cx) ** 2 + (py - cy) ** 2 + (pz - cz) ** 2;
        if (dd < best) { best = dd; bt = (i + t) / (n - 1); bx = cx; by = cy; bz = cz; }
      }
      near.d = Math.sqrt(best); near.t = bt; near.cx = bx; near.cy = by; near.cz = bz;
      return near;
    }
    // خطوط الجلد: خطوط الكف وثنيات الرسغ (x,z)
    const LINES = [
      { p: [[-3.19, 0.38], [-3.22, 0.2], [-3.25, 0.02], [-3.3, -0.12]], s: 0.85 },
      { p: [[-3.12, -0.37], [-3.1, -0.18], [-3.04, 0.02], [-2.96, 0.24]], s: 0.8 },
      { p: [[-3.14, -0.37], [-2.95, -0.2], [-2.75, -0.13], [-2.55, -0.1]], s: 0.85 },
      { p: [[-2.44, -0.18], [-2.42, 0.0], [-2.44, 0.18]], s: 0.75 },
      { p: [[-2.52, -0.2], [-2.5, 0.0], [-2.52, 0.2]], s: 0.55 }
    ].map(l => ({ s: l.s, c: new THREE.SplineCurve(l.p.map(([x, z]) => new THREE.Vector2(x, z))).getPoints(24) }));
    const lineD = (c, x, z) => { let b = 9; for (let i = 0; i < c.length - 1; i++) { const a = c[i], e = c[i + 1], ex = e.x - a.x, ez = e.y - a.y; let t = ((x - a.x) * ex + (z - a.y) * ez) / (ex * ex + ez * ez); t = t < 0 ? 0 : t > 1 ? 1 : t; b = Math.min(b, Math.hypot(x - a.x - ex * t, z - a.y - ez * t)); } return b; };

    const P = g.attributes.position, NN = g.attributes.normal, nv = P.count;
    const col = new Float32Array(nv * 3), C0 = new Float32Array(nv * 3);
    const cFront = K.rgb(0xd09878), cBack = K.rgb(0xb87a5a), cPalm = K.rgb(0xdea28c), cCrease = K.rgb(0x9a624c), cVein = K.rgb(0x5f6e96);
    const BI = [], BW = [], BG = [];
    for (let i = 0; i < nv; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      const front = S.ss(-0.22, 0.3, y);
      const palm = S.ss(-2.45, -2.68, x) * S.ss(-0.02, 0.08, y);
      let r = cBack[0] + (cFront[0] - cBack[0]) * front, gg = cBack[1] + (cFront[1] - cBack[1]) * front, b = cBack[2] + (cFront[2] - cBack[2]) * front;
      r += (cPalm[0] - r) * palm * 0.7; gg += (cPalm[1] - gg) * palm * 0.7; b += (cPalm[2] - b) * palm * 0.7;
      let cr = 0;
      if (y > 0.12 && Math.abs(x) < 0.3) cr = Math.max(cr, (1 - S.ss(0, 0.022, Math.abs(x - 0.04 + 0.35 * z * z))) * S.ss(0.25, 0.37, y) * 0.55);
      if (x < -2.38 && y > 0.02) LINES.forEach(l => { cr = Math.max(cr, (1 - S.ss(0.0, 0.022, lineD(l.c, x, z))) * l.s * 0.75 * S.ss(0.02, 0.09, y)); });
      r += (cCrease[0] - r) * cr; gg += (cCrease[1] - gg) * cr; b += (cCrease[2] - b) * cr;
      C0[i * 3] = r; C0[i * 3 + 1] = gg; C0[i * 3 + 2] = b;
      // وزن الوريد وتدرّجه
      if (y > -0.12) {
        let bw = 0, bgx = 0, bgy = 0, bgz = 0;
        for (const k of VK) {
          const vn = VEINS[k], bx = vn.box;
          if (x < bx[0] || x > bx[1] || z < bx[2] || z > bx[3]) continue;
          const nr = nearest(vn.a, x, y, z);
          if (nr.d > W * 2.6) continue;
          const fade = S.ss(0, 0.07, nr.t) * S.ss(1, 0.93, nr.t);
          const w = vn.k * fade * Math.exp(-((nr.d / W) ** 2));
          if (w > bw) { bw = w; const f = (-2 * w) / (W * W); bgx = f * (x - nr.cx); bgy = f * (y - nr.cy); bgz = f * (z - nr.cz); }
        }
        if (bw > 0.02) { BI.push(i); BW.push(bw); BG.push(bgx, bgy, bgz); }
      }
    }
    col.set(C0);
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const P0 = Float32Array.from(P.array), N0 = Float32Array.from(NN.array);
    const bulge = { h: -1 };
    function setBulge(h) {
      if (Math.abs(h - bulge.h) < 0.00015) return;
      bulge.h = h;
      const pa = P.array, na = NN.array, tint = 0.3 + 26 * h;
      for (let j = 0; j < BI.length; j++) {
        const i = BI[j], w = BW[j], o = i * 3;
        const nx = N0[o], ny = N0[o + 1], nz = N0[o + 2], gx = BG[j * 3], gy = BG[j * 3 + 1], gz = BG[j * 3 + 2];
        pa[o] = P0[o] + nx * h * w; pa[o + 1] = P0[o + 1] + ny * h * w; pa[o + 2] = P0[o + 2] + nz * h * w;
        const gd = gx * nx + gy * ny + gz * nz;
        const mx = nx - h * (gx - gd * nx), my = ny - h * (gy - gd * ny), mz = nz - h * (gz - gd * nz);
        const l = Math.hypot(mx, my, mz) || 1; na[o] = mx / l; na[o + 1] = my / l; na[o + 2] = mz / l;
        const t = Math.min(0.7, w * tint);
        for (let c = 0; c < 3; c++) col[o + c] = C0[o + c] + (cVein[c] - C0[o + c]) * t;
      }
      P.needsUpdate = true; NN.needsUpdate = true; g.attributes.color.needsUpdate = true;
    }
    setBulge(0.0035);
    g.computeBoundingSphere();
    const skinOpts = { a: 0xd09878, b: 0xc48a6a, edge: 0xb98062, speck: 0x8c5c44, speckAmt: 0.08, cell: 130, noise: 9, bump: 0.00055, edgeW: 0.12, edgeAmt: 0.025, rim: 0xff8a6a, rimAmt: 0.2, clearcoat: 0.12, ccr: 0.5, roughness: 0.6, env: 0.35 };
    const armMesh = new THREE.Mesh(g, K.tissue(Object.assign({ vertexColors: true }, skinOpts)));
    armMesh.castShadow = true; armMesh.receiveShadow = true; armMesh.userData.kind = 'arm';
    armG.add(armMesh);
    // كمّ القميص المطوي فوق العضد
    {
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const x = 3.55 + (i / 40) * 1.2, rr = 0.53 + 0.035 * Math.sin(i * 1.9) * S.ss(3.5, 3.7, x) + 0.05 * S.ss(3.55, 3.75, x);
        pts.push(new THREE.Vector2(rr, x));
      }
      const sg = new THREE.LatheGeometry(pts, 48); sg.rotateZ(-Math.PI / 2);
      const p = sg.attributes.position, rnd = lab.rnd(11);
      const ph = [rnd() * 6, rnd() * 6, rnd() * 6];
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, y);
        const f = 1 + 0.035 * Math.sin(a * 5 + ph[0] + x * 3) + 0.02 * Math.sin(a * 11 + ph[1] - x * 7) + 0.015 * Math.sin(x * 23 + ph[2]);
        p.setXYZ(i, x, y * f + 0.02, z * f);
      }
      sg.computeVertexNormals();
      const sleeve = new THREE.Mesh(sg, K.tissue({ a: 0x5f7fa6, b: 0x56769c, edge: 0x4a6890, cell: 90, noise: 6, bump: 0.003, edgeAmt: 0.12, fiber: 0.5, fiberDir: v3(1, 0, 0), rim: 0xbcd3f0, rimAmt: 0.12, clearcoat: 0, roughness: 0.9, side: THREE.DoubleSide }));
      sleeve.castShadow = true; armG.add(sleeve);
    }
    // نقطة السحب على الوريد المرفقي الأوسط (محلي ثم عالمي)
    const ML = VEINS.mcub.curve.getPoint(0.5), MNL = normalAt(ML);
    const MTL = VEINS.mcub.curve.getTangent(0.5).normalize(); MTL.addScaledVector(MNL, -MTL.dot(MNL)).normalize();
    const MVL = MNL.clone().cross(MTL).normalize();
    const onSkinL = (u, w, lift) => ML.clone().addScaledVector(MTL, u).addScaledVector(MVL, w).addScaledVector(MNL, lift || 0);
    const M = toW(ML), MN = dirW(MNL), MT = dirW(MTL);
    const MV = dirW(MVL); if (MV.z < 0) MV.negate();
    const onSkin = (u, w, lift) => toW(onSkinL(u, w, lift));

    /* ---------- الأصابع ---------- */
    const fingerMat = K.tissue(Object.assign({}, skinOpts, { vertexColors: true }));
    const nailMat = new THREE.MeshPhysicalMaterial({ color: K.col(0xeec4bb), roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 });
    const FINGERS = [
      { k: 'index', z: -0.27, s: 0.95, r: 0.079, x0: -3.35 },
      { k: 'middle', z: -0.088, s: 1.0, r: 0.082, x0: -3.38 },
      { k: 'ring', z: 0.092, s: 0.95, r: 0.078, x0: -3.36 },
      { k: 'little', z: 0.265, s: 0.77, r: 0.068, x0: -3.3 }
    ];
    const fingers = {};
    FINGERS.forEach(f => {
      const len = [0.43, 0.27, 0.21].map(l => l * f.s);
      let parent = armG; const chain = [];
      for (let j = 0; j < 3; j++) {
        const jg = new THREE.Group();
        if (j === 0) jg.position.set(f.x0, 0.025, f.z); else jg.position.set(-len[j - 1], 0, 0);
        parent.add(jg);
        const r0 = f.r * (1 - j * 0.07), r1 = f.r * (1 - (j + 1) * 0.07);
        const ph = new THREE.Mesh(capsuleGeo(THREE, len[j], r0, r1, j === 2), fingerMat);
        ph.scale.set(1, 0.84, 1); ph.castShadow = true; ph.receiveShadow = true;
        ph.userData = { kind: 'finger', finger: f.k };
        jg.add(ph);
        if (j === 2) {
          const nail = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), nailMat);
          nail.scale.set(len[j] * 0.44, 0.014, r1 * 0.78); nail.position.set(-len[j] * 0.6, -r1 * 0.8, 0);
          jg.add(nail);
          f.tip = jg; f.tipLen = len[j]; f.tipR = r1;
        }
        chain.push(jg); parent = jg;
      }
      f.chain = chain; fingers[f.k] = f;
    });
    {
      const f = { k: 'thumb', r: 0.09 };
      const base = new THREE.Group(); base.position.set(-2.93, 0.05, -0.38); armG.add(base);
      base.rotation.set(0.3, -0.78, 0.12);
      const len = [0.36, 0.27]; let parent = base; const chain = [];
      for (let j = 0; j < 2; j++) {
        const jg = new THREE.Group(); if (j) jg.position.set(-len[j - 1], 0, 0); parent.add(jg);
        const ph = new THREE.Mesh(capsuleGeo(THREE, len[j], f.r * (1 - j * 0.08), f.r * (1 - (j + 1) * 0.08), j === 1), fingerMat);
        ph.scale.set(1, 0.84, 1); ph.castShadow = true; ph.userData = { kind: 'finger', finger: 'thumb' };
        jg.add(ph);
        if (j === 1) { const nail = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), nailMat); nail.scale.set(len[j] * 0.42, 0.014, f.r * 0.7); nail.position.set(-len[j] * 0.58, -f.r * 0.78, 0); jg.add(nail); }
        chain.push(jg); parent = jg;
      }
      f.chain = chain; fingers.thumb = f;
    }
    let fist = 0, fistTarget = 0;
    function poseHand(k) {
      FINGERS.forEach((f, i) => {
        const c = fingers[f.k].chain;
        c[0].rotation.z = -0.1 - i * 0.025 - 1.5 * k; c[1].rotation.z = -0.14 - 1.75 * k; c[2].rotation.z = -0.08 - 1.1 * k;
      });
      const t = fingers.thumb.chain; t[0].rotation.z = -0.1 - 0.55 * k; t[1].rotation.z = -0.12 - 0.85 * k; t[0].rotation.y = 0.55 * k;
    }
    poseHand(0);
    armG.updateMatrixWorld(true);

    /* ---------- الأدوات على الطاولة ---------- */
    const plastic = (c, o) => new THREE.MeshPhysicalMaterial(Object.assign({ color: K.col(c), roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.8 }, o || {}));
    const clear = o => new THREE.MeshPhysicalMaterial(Object.assign({ color: 0xffffff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.22, clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false, envMapIntensity: 1.25 }, o || {}));
    const steel = new THREE.MeshPhysicalMaterial({ color: 0xe3e8ec, metalness: 1, roughness: 0.16, envMapIntensity: 1.5 });
    const bloodMat = new THREE.MeshPhysicalMaterial({ color: K.col(0x5a0912), roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.18, envMapIntensity: 0.55 });
    const cyl = (r0, r1, h, seg) => new THREE.CylinderGeometry(r0, r1, h, seg || 28, 1);
    const basis = (xAxis, upHint) => { const x = xAxis.clone().normalize(); const y = upHint.clone().addScaledVector(x, -upHint.dot(x)).normalize(); const z = x.clone().cross(y); return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); };
    const flatQ = a => basis(v3(Math.cos(a), 0, Math.sin(a)), v3(Math.sin(a), 0, -Math.cos(a)));
    const tools = {};
    const addTool = (name, obj) => { obj.userData.tool = name; tools[name] = { obj, home: null }; root.add(obj); return obj; };

    // الرباط الضاغط: شريط يتبع مقطع العضد
    const TQX = 1.05, TQC = [0.05, 0];
    const ring = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2, cy = Math.cos(a), cz = Math.sin(a);
      let lo = 0.05, hi = 0.8; for (let s = 0; s < 22; s++) { const m = (lo + hi) / 2; if (arm(TQX, TQC[0] + cy * m, TQC[1] + cz * m) < 0) lo = m; else hi = m; }
      ring.push([cy * (lo + 0.006), cz * (lo + 0.006), cy, cz]);
    }
    const tq = new THREE.Group(); armG.add(tq);
    const tqMat = plastic(0x2a6fd8, { roughness: 0.55, clearcoat: 0.2 });
    tq.add(new THREE.Mesh(bandGeo(THREE, ring, 0.25, 0.014), tqMat));
    const topR = Math.max(...ring.map(r => r[0]));
    const tqTuck = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.018, 8, 28, Math.PI * 1.25), tqMat);
    tqTuck.position.set(0.02, topR + 0.03, 0); tqTuck.rotation.set(0.25, Math.PI / 2, Math.PI * 0.85); tq.add(tqTuck);
    const tqTail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.012, 0.42), tqMat); tqTail.position.set(0.04, topR + 0.02, 0.22); tqTail.rotation.set(0.5, 0, 0.1); tq.add(tqTail);
    tq.userData.tool = 'tourniquet';
    tools.tourniquet = { obj: tq, home: null };
    const tqHome = { p: toL(v3(-0.4, TOP + 0.08, -1.22)), rz: Math.PI / 2 - TILT, s: 0.6 };
    const tqOn = v3(TQX, TQC[0], TQC[1]);

    // كحول وقطن
    const alc = addTool('alcohol', new THREE.Group());
    const bottle = new THREE.Mesh(cyl(0.14, 0.15, 0.44, 36), clear({ opacity: 0.32, color: 0xeaf6ff })); bottle.position.y = 0.22; alc.add(bottle);
    const liq = new THREE.Mesh(cyl(0.128, 0.138, 0.3, 32), new THREE.MeshPhysicalMaterial({ color: K.col(0xc6e6ff), transparent: true, opacity: 0.5, roughness: 0.05, depthWrite: false })); liq.position.y = 0.16; alc.add(liq);
    const capB = new THREE.Mesh(cyl(0.075, 0.075, 0.1, 28), plastic(0x2f6db3)); capB.position.y = 0.49; alc.add(capB);
    const capN2 = new THREE.Mesh(cyl(0.025, 0.06, 0.08, 20), plastic(0xf2f4f6)); capN2.position.y = 0.58; alc.add(capN2);
    const lbl = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.17, 36, 1, true, -1.3, 2.6), new THREE.MeshStandardMaterial({ map: labelTex(THREE, 'كحول 70%', '#2f6db3'), transparent: true }));
    lbl.position.y = 0.22; lbl.rotation.y = 0.35; alc.add(lbl);
    alc.position.set(-1.95, TOP, -1.32);
    const cottonGeo = new THREE.IcosahedronGeometry(0.075, 3);
    { const p = cottonGeo.attributes.position, r = lab.rnd(5); for (let i = 0; i < p.count; i++) { const f = 1 + (r() - 0.5) * 0.26; p.setXYZ(i, p.getX(i) * f, p.getY(i) * f * 0.78, p.getZ(i) * f); } cottonGeo.computeVertexNormals(); }
    const cottonMat = K.tissue({ a: 0xf7f7f3, b: 0xeeeeea, edge: 0xdedcd6, cell: 120, noise: 14, bump: 0.004, edgeAmt: 0.25, rim: 0xffffff, rimAmt: 0.2, clearcoat: 0, roughness: 0.95, env: 0.3 });
    const cotton = addTool('cotton', new THREE.Group());
    const dish = new THREE.Mesh(cyl(0.3, 0.26, 0.05, 40), plastic(0xd5dbe1)); dish.position.y = 0.025; cotton.add(dish);
    for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(cottonGeo, cottonMat); const rr = i ? 0.12 : 0; c.position.set(Math.cos(i * 1.3) * rr, 0.09, Math.sin(i * 1.3) * rr); c.rotation.y = i; c.scale.setScalar(0.92 + (i % 3) * 0.06); cotton.add(c); }
    cotton.position.set(-1.25, TOP, -1.25);
    const swab = new THREE.Mesh(cottonGeo, cottonMat); swab.visible = false; root.add(swab);

    // الحقنة 5 مل: رأس الإبرة عند الأصل، والمحور +x نحو المكبس
    const syr = addTool('syringe', new THREE.Group());
    const NEED = 0.38, HUB0 = 0.38, BAR0 = 0.53, BARL = 0.62, BR = 0.066;
    const needle = new THREE.Mesh(cyl(0.0045, 0.0045, NEED, 10), steel); needle.rotation.z = Math.PI / 2; needle.position.x = NEED / 2; syr.add(needle);
    const bevel = new THREE.Mesh(new THREE.ConeGeometry(0.0045, 0.022, 10), steel); bevel.rotation.z = Math.PI / 2; bevel.position.x = -0.007; syr.add(bevel);
    const hub = new THREE.Mesh(cyl(0.022, 0.032, 0.13, 20), plastic(0x2f9a63, { transparent: true, opacity: 0.86 })); hub.rotation.z = Math.PI / 2; hub.position.x = HUB0 + 0.065; syr.add(hub);
    const flash = new THREE.Mesh(cyl(0.012, 0.016, 0.1, 12), bloodMat); flash.rotation.z = Math.PI / 2; flash.position.x = HUB0 + 0.06; flash.visible = false; syr.add(flash);
    const tipL = new THREE.Mesh(cyl(0.02, 0.03, 0.06, 18), clear({ opacity: 0.4 })); tipL.rotation.z = Math.PI / 2; tipL.position.x = 0.5; syr.add(tipL);
    const barrel = new THREE.Mesh(cyl(BR, BR, BARL, 40), clear()); barrel.rotation.z = Math.PI / 2; barrel.position.x = BAR0 + BARL / 2; syr.add(barrel);
    const grad = new THREE.Mesh(new THREE.CylinderGeometry(BR + 0.0015, BR + 0.0015, BARL, 40, 1, true), new THREE.MeshBasicMaterial({ map: gradTex(THREE), transparent: true, depthWrite: false, toneMapped: false }));
    grad.rotation.z = Math.PI / 2; grad.position.x = BAR0 + BARL / 2; syr.add(grad);
    const flange = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.32, 0.1), clear({ opacity: 0.5 })); flange.position.x = BAR0 + BARL; syr.add(flange);
    const blood = new THREE.Mesh(cyl(BR - 0.006, BR - 0.006, 1, 32), bloodMat); blood.rotation.z = Math.PI / 2; blood.visible = false; syr.add(blood);
    const plunger = new THREE.Group(); syr.add(plunger);
    const piston = new THREE.Mesh(cyl(BR - 0.003, BR - 0.003, 0.05, 32), plastic(0x1b1d22, { roughness: 0.6 })); piston.rotation.z = Math.PI / 2; plunger.add(piston);
    const rodM = plastic(0xf2f4f6, { transparent: true, opacity: 0.85 });
    const rod1 = new THREE.Mesh(new THREE.BoxGeometry(BARL, 0.1, 0.012), rodM); rod1.position.x = BARL / 2; plunger.add(rod1);
    const rod2 = rod1.clone(); rod2.rotation.x = Math.PI / 2; plunger.add(rod2);
    const thumbP = new THREE.Mesh(cyl(0.09, 0.09, 0.016, 32), rodM); thumbP.rotation.z = Math.PI / 2; thumbP.position.x = BARL + 0.01; plunger.add(thumbP);
    const capN = new THREE.Mesh(cyl(0.017, 0.023, 0.43, 16), plastic(0x2f9a63, { transparent: true, opacity: 0.78 })); capN.rotation.z = Math.PI / 2; capN.position.x = 0.19; syr.add(capN);
    let vol = 0;
    function setVol(mL) {
      vol = lab.clamp(mL, 0, 5);
      const len = (vol / 5) * (BARL - 0.06);
      plunger.position.x = BAR0 + 0.025 + len;
      blood.visible = len > 0.002;
      blood.scale.set(1, Math.max(0.001, len), 1); blood.position.x = BAR0 + 0.025 + len / 2;
    }
    setVol(0);
    syr.position.set(0.1, TOP + 0.09, -1.12); syr.quaternion.copy(flatQ(0.12));

    // حامل الأنابيب: أنبوب عادي بلا مانع تجلط (أحمر) وأنبوب EDTA (بنفسجي)
    const rack = addTool('tubes', new THREE.Group());
    const rackMat = plastic(0xe9edf1, { roughness: 0.5 });
    const rb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.3), rackMat); rb.position.y = 0.36; rack.add(rb);
    const rb2 = rb.clone(); rb2.position.y = 0.025; rack.add(rb2);
    [-0.44, 0.44].forEach(x => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.36, 0.3), rackMat); l.position.set(x, 0.2, 0); rack.add(l); });
    const tubes = {};
    const TO = -0.35;
    [['plain', 0xd8343c, 'Plain', -0.18], ['edta', 0x8a5bd6, 'EDTA', 0.18]].forEach(([k, c, t, x]) => {
      const tg = new THREE.Group(); tg.position.set(x, 0.112, 0); rack.add(tg);
      const tb = new THREE.Group(); tb.position.y = -TO; tg.add(tb);
      const body = new THREE.Mesh(cyl(0.062, 0.062, 0.62, 32), clear({ opacity: 0.24 })); body.position.y = 0.31 + TO; tb.add(body);
      const bottom = new THREE.Mesh(new THREE.SphereGeometry(0.062, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), clear({ opacity: 0.24 })); bottom.position.y = TO; tb.add(bottom);
      const cap = new THREE.Group(); cap.position.y = 0.69 + TO; tb.add(cap);
      cap.add(new THREE.Mesh(cyl(0.076, 0.076, 0.14, 32), plastic(c)));
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.076, 0.008, 6, 32), plastic(c)); rim.rotation.x = Math.PI / 2; rim.position.y = -0.07; cap.add(rim);
      const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.0635, 0.0635, 0.28, 32, 1, true, -1.3, 2.6), new THREE.MeshStandardMaterial({ map: labelTex(THREE, t, '#' + c.toString(16).padStart(6, '0')), transparent: true }));
      lb.position.y = 0.38 + TO; tb.add(lb);
      const fill = new THREE.Mesh(cyl(0.056, 0.056, 1, 28), bloodMat); fill.visible = false; tb.add(fill);
      const fillB = new THREE.Mesh(new THREE.SphereGeometry(0.056, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), bloodMat); fillB.position.y = TO; fillB.visible = false; tb.add(fillB);
      tubes[k] = { g: tg, tb, cap, fill, fillB, home: tg.position.clone(), level: 0 };
    });
    rack.position.set(1.95, TOP, -1.25);
    const setTube = (k, mL) => { const t = tubes[k]; const h = (mL / 3) * 0.5; t.fill.visible = t.fillB.visible = h > 0.002; t.fill.scale.y = Math.max(0.001, h); t.fill.position.y = TO + h / 2; };

    // حاوية الإبر الحادة
    const sharps = addTool('sharps', new THREE.Group());
    sharps.add(new THREE.Mesh(slab(THREE, 0.5, 0.42, 0.5, 0.05), plastic(0xf2c12e, { roughness: 0.5 })));
    const sl = new THREE.Mesh(slab(THREE, 0.54, 0.46, 0.07, 0.04), plastic(0xd23a35)); sl.position.y = 0.49; sharps.add(sl);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.06, 24), new THREE.MeshBasicMaterial({ color: 0x1a0d0d })); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.561; sharps.add(hole);
    const bio = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28), new THREE.MeshBasicMaterial({ map: bioTex(THREE), transparent: true, toneMapped: false })); bio.position.set(0, 0.26, 0.212); sharps.add(bio);
    sharps.position.set(3.0, TOP, -1.15);

    // الواخزة والأنبوب الشعري
    const lancet = addTool('lancet', new THREE.Group());
    lancet.add(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.085), plastic(0x2d8fd8)));
    const lnose = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.06), plastic(0xf3f5f7)); lnose.position.x = -0.16; lancet.add(lnose);
    const lpin = new THREE.Mesh(cyl(0.003, 0.003, 0.03, 8), steel); lpin.rotation.z = Math.PI / 2; lpin.position.x = -0.222; lpin.visible = false; lancet.add(lpin);
    lancet.position.set(-2.6, TOP + 0.025, -1.05);
    const capT = addTool('captube', new THREE.Group());
    const ctBody = new THREE.Mesh(cyl(0.012, 0.012, 0.75, 14), clear({ opacity: 0.38 })); ctBody.rotation.z = Math.PI / 2; capT.add(ctBody);
    const ctBand = new THREE.Mesh(cyl(0.0128, 0.0128, 0.05, 14), plastic(0xd8343c)); ctBand.rotation.z = Math.PI / 2; ctBand.position.x = 0.33; capT.add(ctBand);
    const ctFill = new THREE.Mesh(cyl(0.0085, 0.0085, 1, 12), bloodMat); ctFill.rotation.z = Math.PI / 2; ctFill.visible = false; capT.add(ctFill);
    capT.position.set(-3.25, TOP + 0.013, -1.0); capT.quaternion.copy(flatQ(0.3));
    const setCap = f => { const len = f * 0.62; ctFill.visible = len > 0.002; ctFill.scale.set(1, Math.max(0.001, len), 1); ctFill.position.x = -0.375 + len / 2; };

    // عناصر على الجلد
    const drop = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), bloodMat); drop.visible = false; root.add(drop);
    const wet = new THREE.Mesh(new THREE.CircleGeometry(0.1, 40), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0, roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0.02, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    wet.visible = false; armG.add(wet);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 8), bloodMat); dot.visible = false; armG.add(dot);
    const plaster = new THREE.Group(); plaster.visible = false; armG.add(plaster);
    {
      const pm = K.tissue({ a: 0xe6c3a0, b: 0xdfba96, edge: 0xcfa985, cell: 80, noise: 9, bump: 0.002, edgeAmt: 0.1, rim: 0xfff0e0, rimAmt: 0.1, clearcoat: 0, roughness: 0.85 });
      plaster.add(new THREE.Mesh(slab(THREE, 0.1, 0.3, 0.006, 0.04), pm));
      const gz = new THREE.Mesh(slab(THREE, 0.07, 0.09, 0.008, 0.012), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })); gz.position.y = 0.001; plaster.add(gz);
    }
    // حلقة توجيه تنبض فوق الهدف
    const guide = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.007, 8, 48), new THREE.MeshBasicMaterial({ color: 0x3cf0e0, transparent: true, opacity: 0.95, toneMapped: false, depthTest: false }));
    guide.renderOrder = 10; guide.visible = false; root.add(guide);
    // قوس زاوية الإبرة وخط الجلد
    const arcGeo = new THREE.BufferGeometry(); arcGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(33 * 3), 3));
    const arcMat = new THREE.LineBasicMaterial({ color: 0x3cf0e0, transparent: true, depthTest: false, toneMapped: false });
    const arc = new THREE.Line(arcGeo, arcMat); arc.renderOrder = 11; arc.visible = false; arc.frustumCulled = false; root.add(arc);
    const skinLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([M.clone().addScaledVector(MT, -0.34), M.clone().addScaledVector(MT, 0.08)]), new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.02, gapSize: 0.014, depthTest: false, transparent: true, opacity: 0.85, toneMapped: false }));
    skinLine.computeLineDistances(); skinLine.renderOrder = 11; skinLine.visible = false; root.add(skinLine);
    // الشريان الكعبري عند الرسغ (جهة الإبهام)
    const RAL = v3(-2.28, surfY(-2.28, -0.17), -0.17), RA = toW(RAL), RAN = dirW(normalAt(RAL));

    [tq, alc, cotton, syr, rack, sharps, lancet, capT].forEach(o => o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }));
    K.contactShadow(sc, TOP + 0.002, 10, 3.2, 0.3);
    Object.keys(tools).forEach(k => { const o = tools[k].obj; tools[k].home = { p: o.position.clone(), q: o.quaternion.clone() }; });
    tq.position.copy(tqHome.p); tq.rotation.set(0, 0, tqHome.rz); tq.scale.setScalar(tqHome.s);

    /* ---------- الأسماء ---------- */
    const L = {
      mcub: V.label('الوريد المرفقي الأوسط', [ML.x + 0.05, ML.y + 0.16, ML.z + 0.42], armG),
      ceph: V.label('الوريد الرأسي', [-1.15, surfY(-1.15, -0.32) + 0.1, -0.66], armG),
      bas: V.label('الوريد القاعدي', [-1.15, surfY(-1.15, 0.31) + 0.08, 0.64], armG),
      tq: V.label('الرباط الضاغط', [TQX, 0.72, 0], armG),
      ra: V.label('الشريان الكعبري', [-2.28, 0.4, -0.5], armG),
      ang: V.label('', [0, 0, 0])
    };
    L.tq.hidden = true; L.ra.hidden = true; L.ang.hidden = true;
    L.ang.el.classList.add('v-angle');

    /* ---------- الحركة ---------- */
    const tweens = [];
    const anim = (dur, fn) => new Promise(res => tweens.push({ t: 0, dur: (lab.reduce ? Math.min(dur, 0.25) : dur) * (window.__labSpeed || 1), fn, res }));
    const wait = s => anim(s, () => {});
    const camTo = (pos, tgt, dur) => {
      const c = V.camera, ctl = V.controls, p0 = c.position.clone(), t0 = ctl ? ctl.target.clone() : v3(0, 0, 0);
      const p1 = pos.isVector3 ? pos.clone() : v3(...pos), t1 = tgt.isVector3 ? tgt.clone() : v3(...tgt);
      return anim(dur || 1.2, k => { const e = lab.ease(k); c.position.lerpVectors(p0, p1, e); if (ctl) ctl.target.lerpVectors(t0, t1, e); else c.lookAt(t1); });
    };
    const moveTo = (obj, pos, q, dur) => { const p0 = obj.position.clone(), q0 = obj.quaternion.clone(); return anim(dur || 1, k => { const e = lab.ease(k); obj.position.lerpVectors(p0, pos, e); if (q) obj.quaternion.slerpQuaternions(q0, q, e); }); };

    let needleIn = false, finger = 'middle';
    const chosen = () => fingers[finger] || fingers.middle;
    const tipWorld = (f, along, side) => { f.tip.updateMatrixWorld(true); return f.tip.localToWorld(v3(-f.tipLen * (along || 0.55), f.tipR * 0.9, side || 0)); };
    const tipNormal = f => v3(0, 1, 0).transformDirection(f.tip.matrixWorld).normalize();
    const pricked = () => tipWorld(chosen(), 0.5, finger === 'ring' ? 0.03 : -0.03);
    const VIEW = {
      home: () => [v3(...HOME[0]), v3(...HOME[1])],
      site: () => [M.clone().add(v3(0.35, 1.9, 2.0)), M.clone().add(v3(-0.15, 0, 0))],
      side: () => [M.clone().addScaledVector(MV, 2.3).addScaledVector(MN, 0.75).addScaledVector(MT, -0.55), M.clone().addScaledVector(MT, -0.42).addScaledVector(MN, 0.12)],
      tubes: () => [v3(3.55, 1.65, 0.5), v3(1.95, 0.72, -1.25)],
      hand: () => { const p = tipWorld(fingers.middle, 0.5); return [p.clone().add(v3(1.1, 1.1, 1.35)), p.clone().add(v3(0.3, 0, 0))]; },
      finger: () => { const p = pricked(); return [p.clone().add(v3(0.55, 0.62, 0.72)), p.clone()]; },
      wrist: () => [RA.clone().add(v3(0.45, 1.35, 1.45)), RA.clone()]
    };
    const view = (k, d) => { const v = VIEW[k](); const f = lab.clamp(1.6 / (V.camera.aspect || 1.6), 1, 1.45); const p = v[1].clone().add(v[0].clone().sub(v[1]).multiplyScalar(f)); return camTo(p, v[1], d || 1.1); };

    function aimPose(deg, back) {
      const a = (deg * Math.PI) / 180;
      const N = MT.clone().multiplyScalar(Math.cos(a)).addScaledVector(MN, -Math.sin(a)).normalize();
      return { N, p: M.clone().addScaledVector(N, -back), q: basis(N.clone().negate(), MN) };
    }
    function aimSyringe(deg, move) {
      const pose = aimPose(deg, 0.2);
      if (move !== false && !needleIn) { syr.position.copy(pose.p); syr.quaternion.copy(pose.q); }
      const a = (deg * Math.PI) / 180, pa = arcGeo.attributes.position, R = 0.16;
      for (let i = 0; i <= 32; i++) { const t = (i / 32) * a; const q = M.clone().addScaledVector(MT, -Math.cos(t) * R).addScaledVector(MN, Math.sin(t) * R); pa.setXYZ(i, q.x, q.y, q.z); }
      pa.needsUpdate = true;
      const good = deg >= 15 && deg <= 30;
      arcMat.color.set(good ? 0x3cf0b0 : deg < 15 ? 0xffc23d : 0xff5d6c);
      arc.visible = true; skinLine.visible = true;
      L.ang.pos.copy(M).addScaledVector(MT, -Math.cos(a / 2) * (R + 0.08)).addScaledVector(MN, Math.sin(a / 2) * (R + 0.08));
      L.ang.hidden = false; L.ang.el.textContent = Math.round(deg) + '°'; L.ang.el.dataset.ok = good ? '1' : '0';
      return pose.N;
    }
    function guideAt(where) {
      if (!where) { guide.visible = false; return; }
      let p, n, s = 1;
      if (where === 'site') { p = M; n = MN; }
      else if (where === 'upperArm') { p = toW(v3(TQX, surfY(TQX, 0), 0)); n = dirW(v3(0, 1, 0)); s = 1.6; }
      else if (where === 'finger') { p = pricked(); n = tipNormal(chosen()); s = 0.45; }
      else if (where === 'drop') { p = drop.position; n = v3(0, 1, 0); s = 0.6; }
      else if (where === 'artery') { p = RA; n = RAN; s = 0.7; }
      else if (where === 'hand') { p = toW(v3(-2.95, 0.15, 0)); n = v3(0, 1, 0); s = 2.2; }
      else { const o = tools[where] && tools[where].obj; if (!o) { guide.visible = false; return; } p = o.getWorldPosition(v3(0, 0, 0)).add(v3(0, 0.8, 0)); n = v3(0, 1, 0); s = 1.6; }
      guide.visible = true; guide.userData.s = s;
      guide.position.copy(p).addScaledVector(n, 0.012); guide.lookAt(p.clone().add(n));
    }
    function select(name) { Object.keys(tools).forEach(k => { tools[k].lift = k === name ? 1 : 0; }); }

    function reset(mode) {
      tweens.length = 0;
      needleIn = false; fistTarget = 0; fist = 0; poseHand(0);
      tq.position.copy(tqHome.p); tq.rotation.set(0, 0, tqHome.rz); tq.scale.setScalar(tqHome.s); L.tq.hidden = true;
      Object.keys(tools).forEach(k => { if (k === 'tourniquet') return; const t = tools[k], o = t.obj; o.position.copy(t.home.p); o.quaternion.copy(t.home.q); o.visible = true; t.ly = 0; });
      capN.visible = true; capN.position.x = 0.19; flash.visible = false; setVol(0);
      swab.visible = false; swab.scale.set(1, 1, 1); wet.visible = false; dot.visible = false; plaster.visible = false; drop.visible = false;
      guide.visible = false; arc.visible = false; skinLine.visible = false; L.ang.hidden = true; lpin.visible = false;
      Object.keys(tubes).forEach(k => { const t = tubes[k]; setTube(k, 0); t.level = 0; t.tb.rotation.set(0, 0, 0); t.g.position.copy(t.home); t.cap.position.set(0, 0.69 + TO, 0); });
      setCap(0); setBulge(0.0035);
      L.mcub.hidden = L.ceph.hidden = L.bas.hidden = mode !== 'vein';
      L.ra.hidden = mode !== 'artery';
      select(null);
      if (mode === 'cap') return view('hand', 1.1);
      if (mode === 'artery') { guideAt('artery'); return view('wrist', 1.1); }
      return view('home', 0.9);
    }

    /* ---------- أفعال الخطوات ---------- */
    const A = {
      async tourniquet() {
        L.tq.hidden = false;
        const up = v3(TQX, 1.0, 0);
        await anim(0.9, k => { const e = lab.ease(k); tq.position.lerpVectors(tqHome.p, up, e); tq.rotation.z = lab.lerp(tqHome.rz, 0, e); tq.scale.setScalar(lab.lerp(tqHome.s, 1.9, e)); });
        await anim(0.9, k => { const e = lab.ease(k); tq.position.lerpVectors(up, tqOn, e); tq.scale.setScalar(lab.lerp(1.9, 1.0, e)); });
        await anim(1.5, k => setBulge(lab.lerp(0.0035, 0.013, lab.ease(k))));
      },
      async fist() { fistTarget = 1; await anim(1.1, k => setBulge(lab.lerp(0.013, 0.017, k))); },
      async palpate() { guideAt('site'); await view('site', 1.0); },
      async swab() {
        guideAt(null);
        const s0 = onSkin(0, 0, 0.6), s1 = onSkin(0, 0, 0.05);
        swab.visible = true; swab.position.copy(s0);
        await anim(0.6, k => swab.position.lerpVectors(s0, s1, lab.ease(k)));
        wet.visible = true; wet.position.copy(onSkinL(0, 0, 0.004)); wet.lookAt(toW(ML.clone().add(MNL)));
        await anim(2.4, k => {
          const th = k * Math.PI * 6, r = 0.008 + k * 0.085;
          swab.position.copy(onSkin(Math.cos(th) * r, Math.sin(th) * r, 0.05));
          wet.scale.setScalar(Math.min(1, 0.15 + k)); wet.material.opacity = 0.34 * Math.min(1, k * 3);
        });
        const s2 = swab.position.clone(), s3 = onSkin(0, 0, 0.8);
        await anim(0.5, k => swab.position.lerpVectors(s2, s3, k));
        swab.visible = false;
        await anim(2.0, k => (wet.material.opacity = 0.34 * (1 - k)));
        wet.visible = false;
      },
      async uncap(deg) {
        await moveTo(syr, M.clone().add(v3(-0.5, 0.75, 0.6)), basis(v3(-1, 0.3, 0.25), v3(0, 1, 0)), 0.9);
        await anim(0.7, k => (capN.position.x = 0.19 - k * 0.7));
        capN.visible = false; capN.position.x = 0.19;
        const pose = aimPose(deg, 0.2);
        view('side', 1.0);
        await moveTo(syr, pose.p, pose.q, 0.9);
        aimSyringe(deg);
      },
      async insert(deg) {
        const N = aimSyringe(deg), p0 = syr.position.clone(), p1 = M.clone().addScaledVector(N, 0.06);
        await anim(1.1, k => syr.position.lerpVectors(p0, p1, lab.ease(k)));
        needleIn = true;
        await wait(0.2);
        flash.visible = true; flash.scale.set(1, 0.01, 1);
        await anim(0.6, k => { flash.scale.y = Math.max(0.01, k); });
      },
      async release() {
        fistTarget = 0; L.tq.hidden = true;
        const up = v3(TQX, 0.9, 0);
        await anim(0.8, k => { const e = lab.ease(k); tq.scale.setScalar(lab.lerp(1, 1.8, e)); tq.position.lerpVectors(tqOn, up, e); });
        await anim(0.8, k => { const e = lab.ease(k); tq.position.lerpVectors(up, tqHome.p, e); tq.rotation.z = lab.lerp(0, tqHome.rz, e); tq.scale.setScalar(lab.lerp(1.8, tqHome.s, e)); });
        await anim(1.0, k => setBulge(lab.lerp(0.017, 0.005, k)));
      },
      async withdraw() {
        const sp = onSkin(-0.04, 0, 0.5), sp1 = onSkin(-0.04, 0, 0.07);
        swab.visible = true; swab.position.copy(sp);
        await anim(0.5, k => swab.position.lerpVectors(sp, sp1, lab.ease(k)));
        const back = v3(1, 0, 0).applyQuaternion(syr.quaternion), p0 = syr.position.clone();
        await anim(0.6, k => syr.position.copy(p0).addScaledVector(back, k * 0.36));
        needleIn = false; flash.visible = false; arc.visible = false; skinLine.visible = false; L.ang.hidden = true;
        dot.visible = true; dot.position.copy(onSkinL(0, 0, 0.002));
        const sp2 = onSkin(0, 0, 0.045);
        await anim(0.4, k => swab.position.lerpVectors(sp1, sp2, k));
        await anim(1.3, k => swab.scale.set(1, 1 - 0.28 * Math.sin(k * Math.PI), 1));
        await moveTo(syr, v3(1.0, 0.75, -0.55), basis(v3(1, 0.5, 0), v3(0, 1, 0)), 0.8);
        swab.visible = false; dot.visible = false;
        plaster.visible = true; plaster.position.copy(onSkinL(0, 0, 0.006)); plaster.quaternion.copy(basis(MTL, MNL));
      },
      async fillTube(k) {
        const t = tubes[k];
        await view('tubes', 0.8);
        await anim(0.5, kk => t.cap.position.set(0, 0.69 + TO + kk * 0.28, kk * 0.26));
        const mouth = t.tb.localToWorld(v3(0, 0.62 + TO, 0));
        const tip = mouth.clone().add(v3(0.03, -0.1, 0));
        await moveTo(syr, tip.clone().add(v3(0, 0.5, 0)), basis(v3(0.08, 1, 0), v3(-1, 0, 0)), 0.8);
        await moveTo(syr, tip, null, 0.4);
        const v0 = vol, amt = Math.min(2.5, v0), l0 = t.level;
        await anim(1.8, kk => { setVol(v0 - amt * kk); setTube(k, l0 + amt * kk); });
        t.level = l0 + amt;
        await moveTo(syr, tip.clone().add(v3(0, 0.55, 0)), null, 0.4);
        await anim(0.45, kk => t.cap.position.set(0, 0.69 + TO + 0.28 * (1 - kk), 0.26 * (1 - kk)));
        if (k === 'edta') {
          const h = t.home.y;
          await anim(0.4, kk => (t.g.position.y = h + 0.5 * lab.ease(kk)));
          for (let i = 0; i < 4; i++) await anim(0.6, kk => (t.tb.rotation.x = Math.sin(kk * Math.PI) * Math.PI * 0.97));
          t.tb.rotation.x = 0;
          await anim(0.4, kk => (t.g.position.y = h + 0.5 * (1 - lab.ease(kk))));
        }
      },
      async dispose() {
        const top = sharps.localToWorld(v3(0, 0.56, 0));
        await moveTo(syr, top.clone().add(v3(0, 0.5, 0)), basis(v3(0, 1, 0), v3(1, 0, 0)), 0.9);
        await anim(0.6, k => (syr.position.y = top.y + 0.5 - k * 0.55));
        syr.visible = false;
        await view('home', 1.0);
      },
      /* --- الدم الشعيري --- */
      async swabFinger() {
        guideAt(null);
        const p = pricked();
        swab.visible = true; swab.position.copy(p).add(v3(0, 0.5, 0));
        await anim(0.5, k => swab.position.lerp(p.clone().add(v3(0, 0.065, 0)), lab.ease(k)));
        await anim(1.8, k => { const th = k * Math.PI * 5; swab.position.copy(p).add(v3(Math.cos(th) * 0.03, 0.065, Math.sin(th) * 0.03)); });
        await anim(0.5, k => swab.position.lerp(p.clone().add(v3(0, 0.7, 0)), k));
        swab.visible = false;
        await wait(0.5);
      },
      async prick() {
        guideAt(null);
        const p = pricked();
        const qd = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2));
        const above = p.clone().add(v3(0, 0.237 + 0.12, 0));
        await moveTo(lancet, above, qd, 0.8);
        lpin.visible = true;
        await anim(0.1, k => (lancet.position.y = above.y - k * 0.12));
        await anim(0.25, k => (lancet.position.y = above.y - 0.12 + k * 0.25));
        lpin.visible = false;
        await moveTo(lancet, tools.lancet.home.p.clone(), tools.lancet.home.q.clone(), 0.7);
        drop.visible = true;
        await anim(1.6, k => { const r = 0.004 + 0.034 * lab.ease(k); drop.scale.set(r, r * 0.82, r); drop.position.copy(p).add(v3(0, r * 0.6, 0)); });
      },
      async wipe() {
        guideAt(null);
        const p = drop.position.clone();
        swab.visible = true; swab.position.copy(p).add(v3(0, 0.5, 0));
        await anim(0.5, k => swab.position.lerp(p.clone().add(v3(0, 0.05, 0)), lab.ease(k)));
        await anim(0.5, k => { const r = 0.038 * (1 - k) + 0.001; drop.scale.set(r, r * 0.82, r); });
        await anim(0.5, k => swab.position.lerp(p.clone().add(v3(0, 0.7, 0)), k));
        swab.visible = false;
        const q = pricked();
        await anim(1.4, k => { const r = 0.004 + 0.036 * lab.ease(k); drop.scale.set(r, r * 0.82, r); drop.position.copy(q).add(v3(0, r * 0.6, 0)); });
      },
      async collect() {
        guideAt(null);
        const p = drop.position.clone(), dir = v3(0.86, 0.2, 0.47).normalize();
        await moveTo(capT, p.clone().addScaledVector(dir, 0.375 + 0.022), basis(dir, v3(0, 1, 0)), 1.0);
        await anim(2.6, k => { setCap(k * 0.85); const r = 0.004 + 0.036 * (1 - k * 0.9); drop.scale.set(r, r * 0.82, r); });
        await moveTo(capT, p.clone().add(v3(0.75, 0.4, 0.35)), basis(v3(1, 0.1, 0), v3(0, 1, 0)), 0.8);
      },
      async pressFinger() {
        guideAt(null);
        const p = pricked();
        swab.visible = true; swab.position.copy(p).add(v3(0, 0.5, 0));
        await anim(0.5, k => swab.position.lerp(p.clone().add(v3(0, 0.05, 0)), lab.ease(k)));
        drop.visible = false;
        await anim(1.2, k => swab.scale.set(1, 1 - 0.28 * Math.sin(k * Math.PI), 1));
      }
    };

    /* ---------- الاختيار بالضغط ---------- */
    V.pickables.push(armMesh, drop);
    drop.userData.kind = 'drop';
    armG.traverse(c => { if (c.isMesh && c.userData.kind === 'finger') V.pickables.push(c); });
    Object.keys(tools).forEach(k => tools[k].obj.traverse(c => { if (c.isMesh) { c.userData.toolOf = k; V.pickables.push(c); } }));
    V.onPick = hit => api.pick(classify(hit));
    function classify(hit) {
      if (!hit) return { none: true };
      const ud = hit.object.userData;
      if (ud.toolOf) return { tool: ud.toolOf };
      if (ud.kind === 'drop') return { drop: true, finger };
      if (ud.kind === 'finger') return { finger: ud.finger, drop: drop.visible && hit.point.distanceTo(drop.position) < 0.1 };
      if (ud.kind === 'arm') {
        const p = toL(hit.point);
        let best = null, bd = 0.06;
        VK.forEach(k => { const vn = VEINS[k]; if (p.x < vn.box[0] || p.x > vn.box[1]) return; const d = nearest(vn.a, p.x, p.y, p.z).d; if (d < bd) { bd = d; best = k; } });
        const site = hit.point.distanceTo(M) < 0.22;
        if (p.x < -2.42) return { hand: true };
        if (p.x > 0.5 && p.x < 2.8) return { upperArm: true, vein: best, site };
        return { vein: best, site, forearm: p.x < -0.45, elbow: p.x >= -0.45 && p.x <= 0.5, ra: hit.point.distanceTo(RA) < 0.15 };
      }
      return { none: true };
    }

    /* ---------- الإطار ---------- */
    V.frame = dt => {
      for (let i = tweens.length - 1; i >= 0; i--) {
        const tw = tweens[i];
        tw.t += dt / tw.dur;
        const k = Math.min(1, tw.t);
        tw.fn(k);
        if (k >= 1) { tweens.splice(i, 1); tw.res(); }
      }
      if (Math.abs(fistTarget - fist) > 0.001) { fist += (fistTarget - fist) * Math.min(1, dt * 3.2); poseHand(fist); }
      Object.keys(tools).forEach(k => {
        if (k === 'tourniquet') return;
        const t = tools[k], o = t.obj, ly = t.ly || 0, hp = t.home.p;
        if (Math.abs(o.position.x - hp.x) > 1e-3 || Math.abs(o.position.z - hp.z) > 1e-3 || Math.abs(o.position.y - hp.y - ly) > 1e-3) { t.ly = 0; return; }
        const n = ly + ((t.lift ? 0.09 : 0) - ly) * Math.min(1, dt * 8);
        t.ly = Math.abs(n) < 1e-4 ? 0 : n; o.position.y = hp.y + t.ly;
      });
      if (guide.visible) guide.scale.setScalar((guide.userData.s || 1) * (1 + 0.16 * Math.sin(performance.now() / 210)));
    };

    Object.assign(api.scene, {
      ready: true, V, A, reset, select, guideAt, aimSyringe, setVol, setBulge, view,
      vol: () => vol, needleIn: () => needleIn, setFinger: k => { finger = k; }, finger: () => finger,
      showLabels: on => { V.showLabels = on; }, tubeLevels: () => ({ plain: tubes.plain.level, edta: tubes.edta.level })
    });
    V.loading(false);
    api.onReady();
  }

  /* ---------- قوامات ---------- */
  function labelTex(THREE, text, color) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#fbfbf8'; x.fillRect(0, 0, 256, 128);
    x.fillStyle = color; x.fillRect(0, 0, 256, 26);
    x.fillStyle = '#1b2733'; x.font = '700 40px Cairo, "Noto Sans Arabic", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    if (/[؀-ۿ]/.test(text)) x.direction = 'rtl';
    x.fillText(text, 128, 72);
    x.fillStyle = '#8a96a3'; for (let i = 0; i < 16; i++) x.fillRect(40 + i * 11, 102, i % 3 ? 3 : 6, 16);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  function gradTex(THREE) {
    // محور الصورة العمودي = محور الحقنة: الأعلى عند الإبرة (الصفر) والأسفل نحو المكبس (5 مل)
    const c = document.createElement('canvas'); c.width = 256; c.height = 512;
    const x = c.getContext('2d'); x.clearRect(0, 0, 256, 512);
    x.fillStyle = 'rgba(20,30,40,.92)'; x.font = '700 30px "IBM Plex Mono", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let side = 0; side < 2; side++) {
      const cx = side ? 192 : 64;
      for (let i = 0; i <= 25; i++) {
        const y = 512 * (0.04 + (i / 25) * 0.904), major = i % 5 === 0;
        x.fillRect(cx - (major ? 24 : 12), y - 1.5, major ? 48 : 24, 3);
        if (major && i) { x.save(); x.translate(cx + 40, y); x.rotate(-Math.PI / 2); x.fillText(String(i / 5), 0, 0); x.restore(); }
      }
    }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  function bioTex(THREE) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const x = c.getContext('2d');
    x.strokeStyle = '#1b1b1b'; x.lineWidth = 9;
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 - Math.PI / 2; x.beginPath(); x.arc(64 + Math.cos(a) * 22, 64 + Math.sin(a) * 22, 22, 0, Math.PI * 2); x.stroke(); }
    x.beginPath(); x.arc(64, 64, 10, 0, Math.PI * 2); x.stroke();
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }

  const api = (lab.bloodLab = { scene: {}, onReadyFns: [], pick: () => {} });
  api.onReady = () => api.onReadyFns.forEach(f => { try { f(); } catch (e) { console.error(e); } });
  api.fail = () => { const s = document.getElementById('stText'); if (s) s.textContent = 'المتصفح لا يدعم المجسمات ثلاثية الأبعاد، لكن يمكنك قراءة الخطوات.'; };
  lab.ready.push(() => lab.k3.lazy(document.getElementById('lab3d'), build));
})();
