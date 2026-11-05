/* مجسم الرئتين التشريحي: رئتان بفصوصهما وشقوقهما، القصبة والشجرة القصبية، الأوعية الرئوية، القلب والأوعية الكبيرة، الحجاب الحاجز والقفص الصدري */
(function () {
  'use strict';
  const lab = window.Lab;
  const T = () => window.THREE;

  /* ---------- القلب (دالة مسافة) ---------- */
  function heartSDF(K) {
    const S = K.sdf;
    // محور البطينين من القاعدة إلى القمة (نحو اليسار والأسفل والأمام)
    const base = [-0.02, -0.3, 0.1], apex = [0.86, -1.12, 0.6];
    const ax = [apex[0] - base[0], apex[1] - base[1], apex[2] - base[2]], L = Math.hypot(...ax);
    const a = ax.map(v => v / L);
    let b = [a[1] * 0 - a[2] * 1, a[2] * 0 - a[0] * 0, a[0] * 1 - a[1] * 0]; // a × z
    const bl = Math.hypot(...b); b = b.map(v => v / bl);
    const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const cen = [base[0] + a[0] * L * 0.48, base[1] + a[1] * L * 0.48, base[2] + a[2] * L * 0.48];
    return (x, y, z) => {
      const dx0 = x - 0.18, dy0 = y + 0.62, dz0 = z - 0.25;
      const far = Math.sqrt(dx0 * dx0 + dy0 * dy0 + dz0 * dz0) - 1.25;
      if (far > 0.25) return far;
      const px = x - cen[0], py = y - cen[1], pz = z - cen[2];
      const lx = px * a[0] + py * a[1] + pz * a[2], ly = px * b[0] + py * b[1] + pz * b[2], lz = px * c[0] + py * c[1] + pz * c[2];
      const k = 1 + 0.62 * S.ss(-0.25, 0.75, lx / 0.66);
      let d = S.ellipsoid(lx, ly * k, lz * k, 0.7, 0.62, 0.56) / k;
      d = S.smin(d, S.sphere(x + 0.46, y + 0.4, z - 0.1, 0.36), 0.2);               // الأذين الأيمن
      d = S.smin(d, S.ellipsoid(x - 0.06, y + 0.16, z + 0.34, 0.44, 0.3, 0.28), 0.18); // الأذين الأيسر
      d = S.smin(d, S.ellipsoid(x + 0.33, y + 0.06, z - 0.42, 0.21, 0.12, 0.14), 0.1); // الأذينة اليمنى
      d = S.smin(d, S.ellipsoid(x - 0.5, y + 0.2, z - 0.38, 0.19, 0.1, 0.12), 0.1);   // الأذينة اليسرى
      return d;
    };
  }

  /* ---------- الرئة (دالة مسافة) ---------- */
  function lungSDF(K, s, heart) {
    const S = K.sdf, left = s > 0;
    return (x, y, z) => {
      const u = x * s;
      const ty = S.ss(-0.35, 1.8, y);
      const tp = 1 + 0.78 * Math.pow(ty, 1.45);
      const u0 = 1.0 - 0.3 * ty, z0 = -0.12 - 0.12 * ty;
      let d = S.ellipsoid((u - u0) * tp, y - (left ? -0.14 : -0.06), (z - z0) * tp, 1.03, left ? 1.82 : 1.74, 1.27) / tp;
      if (d > 0.4) return d;
      d = S.smax(d, 0.14 + 0.05 * S.ss(0.4, 1.4, y) - u, 0.2);                      // السطح المنصفي
      if (u < 1.05 && y < 0.35) d = S.smax(d, -(heart(x, y, z) - (left ? 0.07 : 0.045)), 0.13); // انطباع القلب (والثلمة القلبية في اليسرى)
      d = S.smax(d, -S.ellipsoid(x - s * 0.72, y - (left ? -2.63 : -2.5), z - 0.05, 1.32, 1.05, 1.52), 0.08); // قبة الحجاب
      d = S.smax(d, -(Math.hypot(x, z + 1.34) - 0.33), 0.16);                       // العمود الفقري
      d = S.smax(d, -S.sphere(x - s * 0.24, y - 0.3, z + 0.06, 0.19), 0.16);        // السرة الرئوية
      return d;
    };
  }

  /* مستويات الشقوق: n·p = w */
  function plane(y1, z1, y2, z2) {
    const dy = y2 - y1, dz = z2 - z1, l = Math.hypot(dy, dz);
    const n = [0, dz / l, -dy / l];
    return { n, w: n[1] * y1 + n[2] * z1 };
  }

  async function build(el) {
    const THREE = T(), K = lab.k3, S = K.sdf;
    const tick = () => new Promise(r => setTimeout(r, 0));
    const V = new K.Viewer(el, { cam: [0.4, 0.45, 10.2], target: [0, -0.1, 0], minD: 5, maxD: 15, spin: 0.55, fov: 30, shadows: true, shadowSize: 3.6, exposure: 0.92, hemi: 0.22, keyI: 1.35 });
    if (!V.ok) return;
    V.loading(true);
    const sc = V.scene;
    const root = new THREE.Group(); sc.add(root);
    const heart = heartSDF(K);
    const rnd = lab.rnd(42);

    /* ===== الرئتان ===== */
    const OBL = { r: plane(0.62, -1.08, -1.32, 0.95), l: plane(0.8, -1.08, -1.46, 0.9) };
    const HOR = { n: [0, 0.998, 0.06], w: 0.08 };
    const lungs = [], lungSdf = {};
    const LOBE = {
      r: ['الفص العلوي', 'الفص الأوسط', 'الفص السفلي'],
      l: ['الفص العلوي', 'الفص السفلي']
    };
    const lobeOf = (side, x, y, z) => {
      const o = side < 0 ? OBL.r : OBL.l;
      const s1 = o.n[1] * y + o.n[2] * z - o.w;
      if (side < 0) return s1 < 0 ? 2 : (HOR.n[1] * y + HOR.n[2] * z - HOR.w > 0 ? 0 : 1);
      return s1 < 0 ? 1 : 0;
    };
    for (const side of [-1, 1]) {
      await tick();
      const f = lungSDF(K, side, heart);
      lungSdf[side] = f;
      const bx = side < 0 ? [-2.25, -0.06] : [0.06, 2.25];
      const g = K.surfaceNets(f, [bx[0], -2.05, -1.62], [bx[1], 2.0, 1.4], K.lite ? 0.042 : 0.034, { coarse: 3, smooth: 1 });
      const p = g.attributes.position, lob = new Float32Array(p.count);
      for (let i = 0; i < p.count; i++) lob[i] = lobeOf(side, p.getX(i), p.getY(i), p.getZ(i));
      g.setAttribute('lobe', new THREE.BufferAttribute(lob, 1));
      const m = K.tissue({ a: 0xd9727f, b: 0xb85466, edge: 0x8e3f55, speck: 0x241c22, speckAmt: 0.5, cell: 5.2, noise: 2.0, bump: 0.0035, edgeW: 0.22, edgeAmt: 0.12, rim: 0xff9a9a, rimAmt: 0.22, clearcoat: 0.4, ccr: 0.3, roughness: 0.6, fissW: 0.024, env: 0.5 });
      const o = side < 0 ? OBL.r : OBL.l;
      m.userData.u.uF1.value.set(0, o.n[1], o.n[2], o.w);
      if (side < 0) { m.userData.u.uF2.value.set(0, HOR.n[1], HOR.n[2], HOR.w); m.userData.u.uF2Side.value = 1; }
      const mesh = new THREE.Mesh(g, m);
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData = { kind: 'lung', side };
      lungs.push(mesh);
    }
    const lungGroup = new THREE.Group(); root.add(lungGroup);
    lungs.forEach(m => lungGroup.add(m));

    /* ===== القلب ===== */
    await tick();
    const hg = K.surfaceNets(heart, [-0.95, -1.42, -0.78], [1.32, 0.12, 1.08], K.lite ? 0.036 : 0.03, { coarse: 3, smooth: 1 });
    {
      // دهون صفراء في الأخدودين التاجي وبين البطينين
      const p = hg.attributes.position, col = new Float32Array(p.count * 3);
      const myo = K.rgb(0x8c2330), fat = K.rgb(0xb98d45);
      const A = [0.02, -0.18, 0.78], B = [0.86, -1.1, 0.66];
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const ex = B[0] - A[0], ey = B[1] - A[1], ez = B[2] - A[2];
        const t = Math.max(0, Math.min(1, ((x - A[0]) * ex + (y - A[1]) * ey + (z - A[2]) * ez) / (ex * ex + ey * ey + ez * ez)));
        const dl = Math.hypot(x - A[0] - ex * t, y - A[1] - ey * t, z - A[2] - ez * t);
        const av = Math.abs((x + 0.02) * 0.62 + (y + 0.32) * 0.78 + (z - 0.1) * 0.05);
        let fk = Math.max((1 - S.ss(0.025, 0.07, dl)) * 0.75, (1 - S.ss(0.02, 0.06, av)) * (y > -0.75 ? 0.5 : 0));
        fk = Math.min(1, fk + (rnd() - 0.5) * 0.15);
        for (let c = 0; c < 3; c++) col[i * 3 + c] = myo[c] + (fat[c] - myo[c]) * fk;
      }
      hg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    const heartMesh = new THREE.Mesh(hg, K.tissue({ vertexColors: true, a: 0x8c2330, b: 0x74202b, edge: 0x6e1d27, cell: 7, noise: 2.5, bump: 0.0025, edgeAmt: 0.08, rim: 0xff6a6a, rimAmt: 0.2, clearcoat: 0.7, ccr: 0.22, roughness: 0.45, env: 0.6 }));
    heartMesh.castShadow = true; heartMesh.receiveShadow = true; heartMesh.userData.kind = 'heart';
    root.add(heartMesh);

    /* ===== الأوعية الكبيرة ===== */
    const RED = K.rgb(0xc8303d), BLUE = K.rgb(0x3b5cc6), VEIN = K.rgb(0xd04655);
    const cr = pts => new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
    const vessels = (list, color) => {
      const geos = [];
      list.forEach(v => { geos.push(K.tube(cr(v.p), v.seg || 40, v.r0, v.r1 !== undefined ? v.r1 : v.r0, 14, color, color)); });
      return K.merge(geos);
    };
    const artMat = K.tissue({ vertexColors: true, a: 0xc8303d, cell: 14, noise: 4, bump: 0.003, edgeAmt: 0.05, rim: 0xff7070, rimAmt: 0.22, clearcoat: 0.85, ccr: 0.12, roughness: 0.38 });
    const venMat = K.tissue({ vertexColors: true, a: 0x3b5cc6, cell: 14, noise: 4, bump: 0.003, edgeAmt: 0.05, rim: 0x8aa8ff, rimAmt: 0.22, clearcoat: 0.85, ccr: 0.12, roughness: 0.38 });
    const aorta = new THREE.Mesh(vessels([
      { p: [[0.02, -0.25, 0.1], [0.0, 0.3, 0.24], [-0.04, 0.82, 0.14], [0.08, 1.06, -0.14], [0.27, 0.95, -0.55], [0.3, 0.55, -0.86], [0.27, -0.4, -0.98], [0.24, -1.7, -0.92]], r0: 0.14, r1: 0.115, seg: 90 },
      { p: [[-0.02, 1.0, 0.05], [-0.14, 1.32, 0.08], [-0.26, 1.72, 0.06]], r0: 0.062, r1: 0.05 },
      { p: [[0.08, 1.06, -0.05], [0.13, 1.4, -0.04], [0.15, 1.78, -0.02]], r0: 0.05, r1: 0.044 },
      { p: [[0.2, 1.02, -0.28], [0.36, 1.32, -0.3], [0.55, 1.62, -0.28]], r0: 0.052, r1: 0.045 },
      { p: [[-0.4, 0.18, -0.06], [-0.18, -0.02, -0.3], [0.0, -0.12, -0.36]], r0: 0.055 },
      { p: [[-0.36, -0.06, -0.22], [-0.16, -0.18, -0.4], [0.02, -0.22, -0.4]], r0: 0.052 },
      { p: [[0.4, 0.14, -0.08], [0.24, -0.04, -0.32], [0.12, -0.12, -0.38]], r0: 0.052 },
      { p: [[0.38, -0.08, -0.24], [0.22, -0.2, -0.4], [0.1, -0.24, -0.42]], r0: 0.05 },
      // الشريان التاجي الأمامي النازل في أخدوده
      { p: [[0.08, -0.22, 0.86], [0.36, -0.55, 0.88], [0.62, -0.86, 0.8], [0.86, -1.12, 0.62]], r0: 0.026, r1: 0.016 }
    ], RED), artMat);
    const pulm = new THREE.Mesh(vessels([
      { p: [[0.3, -0.12, 0.66], [0.32, 0.18, 0.5], [0.24, 0.42, 0.16]], r0: 0.125, r1: 0.11 },
      { p: [[0.24, 0.42, 0.16], [0.42, 0.46, 0.0], [0.58, 0.36, -0.1], [0.72, 0.3, -0.12]], r0: 0.095, r1: 0.075 },
      { p: [[0.24, 0.42, 0.16], [0.02, 0.4, 0.02], [-0.3, 0.34, -0.06], [-0.62, 0.3, -0.1]], r0: 0.095, r1: 0.075 },
      { p: [[-0.3, 1.55, 0.16], [-0.34, 0.75, 0.2], [-0.42, -0.2, 0.14]], r0: 0.09, r1: 0.1 },
      { p: [[-0.36, -0.8, 0.02], [-0.32, -1.25, -0.06], [-0.3, -1.75, -0.1]], r0: 0.1, r1: 0.1 }
    ], BLUE), venMat);
    [aorta, pulm].forEach((m, i) => { m.castShadow = true; m.receiveShadow = true; m.userData.kind = i ? 'pulm' : 'aorta'; root.add(m); });

    /* ===== القصبة الهوائية والشجرة القصبية ===== */
    await tick();
    const cart = K.tissue({ a: 0xeedfd2, b: 0xe2cbbd, edge: 0xc9a99d, cell: 16, noise: 5, bump: 0.004, edgeAmt: 0.15, rim: 0xfff0e6, rimAmt: 0.18, clearcoat: 0.6, ccr: 0.25, roughness: 0.45 });
    const CAR = new THREE.Vector3(0, 1.1, -0.2);
    const trachea = new THREE.Group(); root.add(trachea);
    {
      const geos = [K.tube(new THREE.LineCurve3(new THREE.Vector3(0, 2.62, -0.16), CAR.clone()), 8, 0.122, 0.118, 24)];
      for (let k = 0; k < 15; k++) {
        const r = new THREE.TorusGeometry(0.127, 0.022, 8, 28, Math.PI * 1.65);
        r.rotateX(Math.PI / 2); r.rotateY(Math.PI * 0.67 + 0.0); r.translate(0, 1.26 + k * 0.088, -0.17 - k * 0.003);
        geos.push(r);
      }
      const tm = new THREE.Mesh(K.merge(geos), cart);
      tm.castShadow = true; tm.userData.kind = 'trachea';
      trachea.add(tm);
    }
    // الشجرة: جذوع رئيسية ثابتة ثم تفرعات تنمو داخل كل فص
    const segs = { br: [], art: [], vein: [] };
    const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const insideLung = (side, p, margin) => lungSdf[side](p.x, p.y, p.z) < -(margin || 0.05);
    // مراكز الفصوص لتوجيه نمو الشجرة
    const cen = { '-1': [], '1': [] };
    lungs.forEach(m => {
      const side = m.userData.side, p = m.geometry.attributes.position, lo = m.geometry.attributes.lobe, acc = [];
      for (let i = 0; i < p.count; i += 3) { const id = lo.getX(i); if (!acc[id]) acc[id] = [0, 0, 0, 0]; acc[id][0] += p.getX(i); acc[id][1] += p.getY(i); acc[id][2] += p.getZ(i); acc[id][3]++; }
      cen[side] = acc.map(a => new THREE.Vector3(a[0] / a[3], a[1] / a[3], a[2] / a[3]).lerp(new THREE.Vector3(side * 0.95, -0.1, -0.1), 0.25));
    });
    function grow(side, lobe, start, dir, len, rad, gen, list, seed) {
      const r = lab.rnd(seed);
      const stack = [[start, dir.clone().normalize(), len, rad, gen]];
      while (stack.length) {
        const [a, d, l0, r0, g] = stack.pop();
        let l = l0, b = null, dd = d.clone();
        const toC = cen[side][lobe].clone().sub(a).normalize();
        for (let tries = 0; tries < 7; tries++) {
          const cand = a.clone().addScaledVector(dd, l);
          if (insideLung(side, cand, 0.03 + r0) && lobeOf(side, cand.x, cand.y, cand.z) === lobe) { b = cand; break; }
          if (tries % 2) l *= 0.75;
          dd.lerp(toC, 0.35).add(new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.3)).normalize();
        }
        if (!b) continue;
        list.push({ a, b, r0, r1: r0 * 0.86, side, lobe });
        if (g <= 0 || r0 < 0.011) continue;
        const perp = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).cross(d).normalize();
        [-1, 1].forEach((sg, ci) => {
          const ang = (0.42 + r() * 0.3) * sg;
          const nd = d.clone().applyAxisAngle(perp, ang);
          nd.applyAxisAngle(d, (r() - 0.5) * 1.2).normalize();
          stack.push([b, nd, l0 * (0.74 + r() * 0.1), r0 * (ci ? 0.74 : 0.8), g - 1]);
        });
      }
    }
    const trunk = (a, b, r0, r1) => segs.br.push({ a, b, r0, r1 });
    // اليمنى: قصيرة وعريضة وأكثر عمودية
    const rMain = v3(-0.36, 0.86, -0.17), rInt = v3(-0.44, 0.5, -0.16);
    trunk(CAR, rMain, 0.088, 0.078); trunk(rMain, rInt, 0.066, 0.06);
    const lMain = v3(0.48, 0.74, -0.18);
    trunk(CAR, lMain, 0.08, 0.07);
    const lobarSeeds = [
      [-1, 0, rMain, null, v3(-0.55, 0.8, 0.05), 0.32, 0.05, 11],
      [-1, 1, rInt, v3(-0.6, -0.06, 0.28), v3(-0.35, -0.25, 0.9), 0.28, 0.042, 12],
      [-1, 2, rInt, v3(-0.55, -0.36, -0.34), v3(-0.22, -0.92, -0.32), 0.32, 0.054, 13],
      [1, 0, lMain, null, v3(0.42, 0.72, 0.38), 0.3, 0.05, 14],
      [1, 0, lMain, v3(0.62, -0.12, 0.3), v3(0.3, -0.28, 0.9), 0.28, 0.04, 15],
      [1, 1, lMain, v3(0.56, -0.3, -0.36), v3(0.26, -0.92, -0.3), 0.34, 0.054, 16]
    ];
    lobarSeeds.forEach(([side, lobe, par, st, d, l, r, seed]) => {
      if (st) { trunk(par, st, r * 1.15, r); grow(side, lobe, st, d, l, r, 6, segs.br, seed); }
      else grow(side, lobe, par, d, l, r, 6, segs.br, seed);
    });
    // الشرايين الرئوية ترافق القصبات، والأوردة تجري بينها
    segs.br.forEach((sg, i) => {
      if (i < 3) return;
      const d = sg.b.clone().sub(sg.a).normalize();
      const off = new THREE.Vector3(0, 0, -1).cross(d).normalize().multiplyScalar(sg.r0 * 1.7 + 0.012);
      segs.art.push({ a: sg.a.clone().add(off), b: sg.b.clone().add(off), r0: sg.r0 * 0.9, r1: sg.r1 * 0.9 });
    });
    [[-1, 0, v3(-0.34, 0.2, -0.02), v3(-0.6, 0.85, 0.3), 21], [-1, 1, v3(-0.34, 0.08, 0.05), v3(-0.4, -0.2, 0.9), 22], [-1, 2, v3(-0.36, -0.02, -0.2), v3(-0.3, -0.9, -0.2), 23],
     [1, 0, v3(0.34, 0.16, -0.02), v3(0.5, 0.7, 0.45), 24], [1, 1, v3(0.36, -0.06, -0.2), v3(0.3, -0.9, -0.15), 25]]
      .forEach(([side, lobe, a, d, seed]) => grow(side, lobe, a, d, 0.3, 0.046, 5, segs.vein, seed));
    const tree = (list, mat, c0, c1) => {
      const geos = [];
      list.forEach(s => {
        const mid = s.a.clone().lerp(s.b, 0.5);
        geos.push(K.tube(new THREE.LineCurve3(s.a, s.b), 2, s.r0, s.r1, 9, c0, c1));
        geos.push(K.cap(s.b, s.r1 * 1.02, c0));
        void mid;
      });
      const m = new THREE.Mesh(K.merge(geos), mat);
      m.castShadow = true;
      return m;
    };
    const bronchi = tree(segs.br, cart);
    const arteries = tree(segs.art, venMat, BLUE, BLUE);
    const veins = tree(segs.vein, artMat, VEIN, VEIN);
    bronchi.userData.kind = 'bronchus';
    const inner = new THREE.Group(); inner.add(bronchi, arteries, veins); root.add(inner);
    // الجذوع الرئيسية تبقى ظاهرة دائماً
    const mainBr = tree(segs.br.slice(0, 3), cart); mainBr.userData.kind = 'bronchus'; trachea.add(mainBr);
    inner.visible = false;

    /* ===== الحجاب الحاجز ===== */
    await tick();
    let dia;
    {
      const dome = (x, z, cx, cy, rx, ry, rz) => { const q = 1 - ((x - cx) / rx) ** 2 - ((z - 0.05) / rz) ** 2; return q > 0 ? cy + ry * Math.sqrt(q) : -9; };
      const H = (x, z) => {
        const dr = dome(x, z, -0.72, -2.5, 1.32, 1.05, 1.52), dl = dome(x, z, 0.72, -2.63, 1.32, 1.05, 1.52);
        const base = -1.95 - 0.55 * ((x * x) / 4.4 + (z * z) / 2.6);
        return S.smax(S.smax(dr, dl, 0.25), base, 0.2) - 0.03;
      };
      const RS = 56, AS = 96, pos = [], col = [], ind = [];
      const tendon = K.rgb(0xd9d0c2), muscle = K.rgb(0x8a2a31);
      for (let i = 0; i <= RS; i++) for (let j = 0; j <= AS; j++) {
        const r = Math.pow(i / RS, 0.9), th = (j / AS) * Math.PI * 2;
        const x = 1.98 * r * Math.cos(th), z = -0.05 + 1.42 * r * Math.sin(th);
        pos.push(x, H(x, z), z);
        const tx = (x - 0.02) / 0.62, tz = (z - 0.25) / 0.5;
        const tk = 1 - S.ss(0.55, 1.0, Math.sqrt(tx * tx + tz * tz) - 0.12 * Math.cos(3 * Math.atan2(tz, tx)));
        for (let c = 0; c < 3; c++) col.push(muscle[c] + (tendon[c] - muscle[c]) * tk);
      }
      for (let i = 0; i < RS; i++) for (let j = 0; j < AS; j++) { const a = i * (AS + 1) + j, b = a + AS + 1; ind.push(a, b, a + 1, b, b + 1, a + 1); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(ind); g.computeVertexNormals();
      dia = new THREE.Mesh(g, K.tissue({ vertexColors: true, a: 0x8a2a31, cell: 12, noise: 3.5, bump: 0.0025, edgeAmt: 0.06, rim: 0xff7070, rimAmt: 0.15, clearcoat: 0.45, ccr: 0.35, roughness: 0.6, side: THREE.DoubleSide, fiber: 0.35, fiberDir: new THREE.Vector3(1, 0, 0.35).normalize() }));
      dia.receiveShadow = true; dia.castShadow = true; dia.userData.kind = 'dia';
      root.add(dia);
    }

    /* ===== القفص الصدري ===== */
    const cage = new THREE.Group(); cage.visible = false; root.add(cage);
    {
      const bone = K.tissue({ a: 0xece0c8, b: 0xdccaa8, edge: 0xc9b38e, cell: 18, noise: 4, bump: 0.004, edgeAmt: 0.12, rim: 0xfff2dc, rimAmt: 0.2, clearcoat: 0.25, ccr: 0.45, roughness: 0.55 });
      const cc = K.tissue({ a: 0xd9e3ea, b: 0xc6d4de, edge: 0xb3c2cd, cell: 20, noise: 4, bump: 0.003, edgeAmt: 0.08, rim: 0xffffff, rimAmt: 0.25, clearcoat: 0.8, ccr: 0.15, roughness: 0.35 });
      const ribs = [], carts = [];
      for (let i = 0; i < 12; i++) {
        const y0 = 1.58 - i * 0.27, drop = 0.72 + i * 0.05;
        const yy = Math.max(-1.4, y0 - drop * 0.5);
        const ty = S.ss(-0.35, 1.8, yy), tp = 1 + 0.78 * Math.pow(ty, 1.45);
        const A = (1.0 - 0.3 * ty) + 1.03 / tp + 0.2, B = 1.27 / tp + 0.24;
        const end = i < 7 ? 0.62 : i < 10 ? 0.5 : 0.18;
        [-1, 1].forEach(s => {
          const pts = [];
          for (let k = 0; k <= 16; k++) {
            const t = k / 16, th = -Math.PI / 2 + t * Math.PI * end;
            pts.push(new THREE.Vector3(s * (0.16 + (A - 0.16) * Math.cos(th) * (0.55 + 0.45 * Math.min(1, t * 2.4))), y0 - drop * t, -0.12 + B * Math.sin(th) * (t < 0.08 ? 0.97 : 1)));
          }
          const c = new THREE.CatmullRomCurve3(pts);
          ribs.push(K.tube(c, 48, 0.045, 0.036, 8));
          if (i < 10) {
            const last = pts[pts.length - 1];
            const st = i < 7 ? new THREE.Vector3(s * 0.13, 1.32 - i * 0.2, 1.22) : new THREE.Vector3(s * (0.45 + (i - 7) * 0.14), last.y + 0.3, last.z + 0.08);
            carts.push(K.tube(new THREE.CatmullRomCurve3([last, last.clone().lerp(st, 0.45).add(new THREE.Vector3(0, -0.12, 0.06)), st]), 16, 0.038, 0.032, 8));
          }
        });
      }
      const sternum = new THREE.CylinderGeometry(0.15, 0.1, 1.55, 20, 1); sternum.scale(1, 1, 0.28); sternum.translate(0, 0.62, 1.27);
      ribs.push(sternum);
      for (let v = 0; v < 14; v++) { const vb = new THREE.CylinderGeometry(0.17, 0.17, 0.2, 18); vb.translate(0, 1.8 - v * 0.27, -1.36); ribs.push(vb); const sp = new THREE.BoxGeometry(0.07, 0.12, 0.32); sp.translate(0, 1.76 - v * 0.27, -1.62); ribs.push(sp); }
      [-1, 1].forEach(s => ribs.push(K.tube(new THREE.CatmullRomCurve3([v3(s * 0.15, 1.55, 1.12), v3(s * 0.7, 1.62, 1.0), v3(s * 1.2, 1.78, 0.55), v3(s * 1.5, 1.82, 0.2)]), 30, 0.055, 0.05, 8)));
      const bm = new THREE.Mesh(K.merge(ribs), bone), cm = new THREE.Mesh(K.merge(carts), cc);
      bm.castShadow = true; cage.add(bm, cm);
    }

    /* ===== غشاء الجنب ===== */
    const pleura = new THREE.Group(); pleura.visible = false; lungGroup.add(pleura);
    lungs.forEach(m => {
      const vis = new THREE.Mesh(m.geometry, new THREE.MeshPhysicalMaterial({ color: 0xd8ecff, transparent: true, opacity: 0.16, roughness: 0.08, clearcoat: 1, depthWrite: false }));
      vis.scale.setScalar(1.025); vis.position.copy(m.position);
      const par = new THREE.Mesh(m.geometry, new THREE.MeshPhysicalMaterial({ color: 0x9ec4ff, transparent: true, opacity: 0.12, roughness: 0.15, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide }));
      par.scale.set(1.09, 1.05, 1.09); par.position.copy(m.position);
      pleura.add(vis, par);
    });

    K.contactShadow(sc, -2.25, 6.5, 4.6, 0.5);

    /* ===== العناوين والتفاعل ===== */
    V.label('القصبة الهوائية', [0.62, 2.35, -0.15]);
    V.label('الرئة اليمنى · 3 فصوص', [-1.45, 1.45, 0.55], null, [-1, 0.2, 0.7]);
    V.label('الرئة اليسرى · فصان', [1.5, 1.4, 0.45], null, [1, 0.2, 0.7]);
    V.label('القلب', [0.62, -0.42, 1.0], null, [0.2, 0, 1]);
    V.label('الحجاب الحاجز', [1.75, -1.95, 0.7], null, [0.6, 0.2, 0.8]);
    const lFiss = V.label('الشق المائل', [-1.55, -0.55, 0.7], null, [-1, 0, 0.6]); lFiss.hidden = true;
    const lHor = V.label('الشق الأفقي', [-1.6, 0.12, 0.45], null, [-1, 0, 0.6]); lHor.hidden = true;
    const badge = V.badge(), info = V.info();
    let breathing = !lab.reduce, t = 0, infoTimer = 0, sel = null;
    function showInfo(x) {
      clearTimeout(infoTimer);
      if (!x) { info.hidden = true; return; }
      info.innerHTML = `<b>${x[0]}</b>${x[1]}`; info.hidden = false;
      infoTimer = setTimeout(() => { info.hidden = true; clearSel(); }, 8000);
    }
    function clearSel() { if (sel) { sel.material.userData.u.uSel.value = -1; sel = null; } }
    const setX = on => {
      inner.visible = on;
      lungs.forEach(m => { const mt = m.material; mt.transparent = on; mt.opacity = on ? 0.15 : 1; mt.depthWrite = !on; mt.needsUpdate = true; m.castShadow = !on; });
      heartMesh.material.transparent = on; heartMesh.material.opacity = on ? 0.55 : 1; heartMesh.material.needsUpdate = true;
    };
    V.controlsBar([
      { label: 'تنفس', on: breathing, cb: on => (breathing = on) },
      { label: 'داخل الرئة', on: false, cb: on => { setX(on); showInfo(on ? ['داخل الرئة', 'القصبات (بيضاء) تتفرع حتى الأكياس السنخية، ويرافقها الشريان الرئوي (أزرق: دم غير مؤكسج)، بينما تجري الأوردة الرئوية (حمراء: دم مؤكسج) إلى القلب.'] : null); } },
      { label: 'الشقوق', on: false, cb: on => { lFiss.hidden = !on; lHor.hidden = !on; lungs.forEach(m => (m.material.userData.u.uFissW.value = on ? 0.04 : 0.024)); showInfo(on ? ['شقوق الرئتين', 'الشق المائل في الرئتين، والشق الأفقي في اليمنى فقط؛ لذلك اليمنى ثلاثة فصوص واليسرى فصان. واليسرى فيها ثلمة قلبية تفسح مكاناً للقلب.'] : null); } },
      { label: 'غشاء الجنب', on: false, cb: on => { pleura.visible = on; showInfo(on ? ['غشاء الجنب', 'الطبقة الملاصقة للرئة هي الحشوي، والخارجية المبطنة للقفص الصدري هي الجداري، وبينهما التجويف الجنبي فيه سائل انزلاقي يمنع الاحتكاك.'] : null); } },
      { label: 'القفص الصدري', on: false, cb: on => { cage.visible = on; } },
      { label: 'الأسماء', on: true, cb: on => (V.showLabels = on) }
    ]);
    V.pickables.push(...lungs, heartMesh, dia, aorta, pulm);
    trachea.children.forEach(c => V.pickables.push(c));
    V.onPick = hit => {
      clearSel();
      if (!hit) { showInfo(null); return; }
      const k = hit.object.userData.kind;
      if (k === 'lung') {
        const m = hit.object, idx = hit.face.a, id = m.geometry.attributes.lobe.getX(idx), right = m.userData.side < 0;
        sel = m; m.material.userData.u.uSel.value = id;
        const name = (right ? LOBE.r : LOBE.l)[id];
        showInfo([`${name} · ${right ? 'الرئة اليمنى' : 'الرئة اليسرى'}`, right ? 'الرئة اليمنى ثلاثة فصوص (علوي وأوسط وسفلي) يفصلها الشقان المائل والأفقي، ولكل فص تجهيز هوائي ودموي خاص به.' : 'الرئة اليسرى فصان (علوي وسفلي) يفصلهما الشق المائل، وفي حافتها الأمامية ثلمة قلبية.']);
      } else if (k === 'heart') showInfo(['القلب', 'يقع بين الرئتين ومائل إلى اليسار، لذلك الرئة اليسرى أصغر. يضخ الدم إلى الرئتين ليتأكسج، والخرج القلبي حوالي 5 لتر/دقيقة.']);
      else if (k === 'dia') showInfo(['الحجاب الحاجز', 'عضلة على شكل قبة مركزها وتر أبيض. تتقلص في الشهيق فتصبح مستوية وتنزل، فيتوسع القفص الصدري.']);
      else if (k === 'trachea' || k === 'bronchus') showInfo(['القصبة الهوائية والقصبتان', 'حلقات غضروفية على شكل حرف C تبقيها مفتوحة. تتفرع إلى قصبتين: اليمنى أقصر وأعرض وأكثر عمودية.']);
      else if (k === 'aorta') showInfo(['الأبهر والأوردة الرئوية', 'الأوعية الحمراء تحمل دماً مؤكسجاً: الأوردة الرئوية من الرئتين إلى القلب، والأبهر من القلب إلى الجسم.']);
      else if (k === 'pulm') showInfo(['الشريان الرئوي', 'يحمل دماً غير مؤكسج (أزرق) من البطين الأيمن إلى الرئتين ليتبادل الغازات في الأسناخ.']);
    };

    const apexY = 1.75;
    V.frame = dt => {
      if (breathing) t += dt;
      const p = (t % 5) / 5, b = K.breath(p);
      const sy = 1 + 0.07 * b, sxz = 1 + 0.045 * b;
      lungGroup.scale.set(sxz, sy, sxz); lungGroup.position.y = -apexY * (sy - 1);
      inner.scale.copy(lungGroup.scale); inner.position.copy(lungGroup.position);
      dia.position.y = -0.17 * b; dia.scale.set(1, 1 - 0.05 * b, 1);
      heartMesh.position.y = aorta.position.y = pulm.position.y = -0.05 * b;
      cage.rotation.x = -0.035 * b; cage.position.z = -0.04 * b;
      const txt = breathing ? (p < 0.4 ? 'شهيق ↓ الحجاب' : 'زفير ↑ الحجاب') : 'متوقف';
      if (badge.textContent !== txt) badge.textContent = txt;
    };
   
    V.loading(false);
  }

  lab.ready.push(() => lab.k3.lazy(document.getElementById('lung3d'), build));
})();
