/* مجسم نهاية القصيبة والأكياس السنخية: جدران أسناخ عضوية ملتحمة، شبكة شعيرات، كريات دم تجري وتتأكسج، ومقطع يكشف الداخل */
(function () {
  'use strict';
  const lab = window.Lab;
  const T = () => window.THREE;

  function build(el) {
    const THREE = T(), K = lab.k3, S = K.sdf;
    const V = new K.Viewer(el, { cam: [0.6, 0.45, 8.7], target: [0, 0.3, 0], minD: 3.4, maxD: 14, spin: 0.5, fov: 32, clip: true, shadows: false, exposure: 0.9, hemi: 0.2, keyI: 1.3 });
    if (!V.ok) return;
    V.loading(true);
    const sc = V.scene, root = new THREE.Group(); sc.add(root);
    const rnd = lab.rnd(9);
    const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

    /* ---------- الهيكل: قنوات + أسناخ ---------- */
    const prims = [], alveoli = [];
    const cap = (a, b, r) => prims.push({ t: 'c', a, b, r, c: a.clone().lerp(b, 0.5), R: a.distanceTo(b) / 2 + r });
    const sph = (c, r, sac) => { prims.push({ t: 's', c, r, R: r }); alveoli.push({ c, r, sac }); };
    const top = v3(0, 2.55, 0), tb = v3(0, 1.45, 0), rb = v3(0, 0.82, 0.02);
    cap(top, tb, 0.24); cap(tb, rb, 0.19);
    // أسناخ قليلة على جدار القصيبة التنفسية
    for (let i = 0; i < 4; i++) {
      const th = i * 1.9 + 0.4, y = 1.32 - i * 0.14;
      sph(v3(Math.cos(th) * 0.27, y, Math.sin(th) * 0.27), 0.14 + rnd() * 0.03, -1);
    }
    const sacs = [v3(-1.15, -0.28, 0.18), v3(1.1, -0.18, -0.12), v3(0.05, -1.08, 0.36)];
    sacs.forEach((sc0, si) => {
      const a = rb.clone(), b = sc0.clone();
      const mid = a.clone().lerp(b, 0.5).add(v3(0, 0.1, 0));
      cap(a, mid, 0.135); cap(mid, b, 0.13);
      // حلقات أسناخ حول القناة السنخية
      const dir = b.clone().sub(a).normalize();
      const pp = new THREE.Vector3(0, 0, 1).cross(dir).normalize(), qq = dir.clone().cross(pp).normalize();
      for (let k = 1; k <= 3; k++) {
        const c = a.clone().lerp(b, 0.22 + k * 0.17);
        for (let j = 0; j < 5; j++) {
          const th = (j / 5) * Math.PI * 2 + k * 0.6 + si;
          const off = pp.clone().multiplyScalar(Math.cos(th)).add(qq.clone().multiplyScalar(Math.sin(th)));
          sph(c.clone().addScaledVector(off, 0.24), 0.16 + rnd() * 0.035, si);
        }
      }
      // الكيس السنخي: عنقود في النهاية
      const N = 15;
      for (let i = 0; i < N; i++) {
        const yv = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(1 - yv * yv), th = i * 2.39996 + si;
        const d = v3(Math.cos(th) * rr, yv, Math.sin(th) * rr);
        if (d.dot(dir) < -0.55) continue;
        sph(b.clone().addScaledVector(d, 0.4 + rnd() * 0.06), 0.22 + rnd() * 0.05, si);
      }
    });
    // تسريع: شبكة خشنة لكل خلية فيها العناصر القريبة فقط
    const CS = 0.35, K0 = 0.07, bmin = [-2.0, -1.85, -1.15], bmax = [2.0, 2.6, 1.25];
    const gx = Math.ceil((bmax[0] - bmin[0]) / CS), gy = Math.ceil((bmax[1] - bmin[1]) / CS), gz = Math.ceil((bmax[2] - bmin[2]) / CS);
    const grid = Array.from({ length: gx * gy * gz }, () => []);
    prims.forEach((p, pi) => {
      const R = p.R + K0 + CS;
      for (let k = Math.max(0, Math.floor((p.c.z - R - bmin[2]) / CS)); k <= Math.min(gz - 1, Math.floor((p.c.z + R - bmin[2]) / CS)); k++)
        for (let j = Math.max(0, Math.floor((p.c.y - R - bmin[1]) / CS)); j <= Math.min(gy - 1, Math.floor((p.c.y + R - bmin[1]) / CS)); j++)
          for (let i = Math.max(0, Math.floor((p.c.x - R - bmin[0]) / CS)); i <= Math.min(gx - 1, Math.floor((p.c.x + R - bmin[0]) / CS)); i++) grid[i + gx * (j + gy * k)].push(pi);
    });
    const sdf = (x, y, z) => {
      const i = Math.floor((x - bmin[0]) / CS), j = Math.floor((y - bmin[1]) / CS), k = Math.floor((z - bmin[2]) / CS);
      if (i < 0 || j < 0 || k < 0 || i >= gx || j >= gy || k >= gz) return 1;
      const L = grid[i + gx * (j + gy * k)];
      if (!L.length) return CS;
      let d = 9;
      for (let n = 0; n < L.length; n++) {
        const p = prims[L[n]];
        const e = p.t === 's' ? S.sphere(x - p.c.x, y - p.c.y, z - p.c.z, p.r) : S.capsule(x, y, z, p.a.x, p.a.y, p.a.z, p.b.x, p.b.y, p.b.z, p.r);
        d = S.smin(d, e, K0);
      }
      return d;
    };
    const wallG = K.surfaceNets(sdf, bmin, bmax, 0.03, { coarse: 3, smooth: 1 });
    const clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 10);
    const wallMat = K.tissue({ a: 0xe48d98, b: 0xcf6f80, edge: 0xb35a6e, cell: 16, noise: 4, bump: 0.004, edgeW: 0.1, edgeAmt: 0.18, rim: 0xffb3bd, rimAmt: 0.45, clearcoat: 0.55, ccr: 0.2, roughness: 0.45, side: THREE.DoubleSide, transparent: true, opacity: 0.92, env: 0.5 });
    wallMat.clippingPlanes = [clip]; wallMat.clipShadows = true;
    const wall = new THREE.Mesh(wallG, wallMat); wall.userData.kind = 'wall';
    root.add(wall);
    // الجزء الغضروفي/العضلي للقصيبة الانتهائية
    const mus = K.tissue({ a: 0xe9c9b4, b: 0xdcb39d, edge: 0xc79e88, cell: 14, noise: 4, bump: 0.004, edgeAmt: 0.15, rim: 0xffe6d6, rimAmt: 0.25, clearcoat: 0.6, ccr: 0.25 });
    {
      const geos = [];
      for (let k = 0; k < 6; k++) { const r = new THREE.TorusGeometry(0.245, 0.028, 8, 32); r.rotateX(Math.PI / 2); r.translate(0, 1.62 + k * 0.15, 0); geos.push(r); }
      const m = new THREE.Mesh(K.merge(geos), mus); m.userData.kind = 'bronchiole'; root.add(m);
    }

    /* ---------- الأوعية والشعيرات ---------- */
    const BLUE = K.rgb(0x2a4fd0), RED = K.rgb(0xe0223a);
    const flow = v3(1, -0.15, 0.1).normalize();
    const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const capGeos = [], paths = [];
    alveoli.forEach((al, ai) => {
      const out = al.sac >= 0 ? al.c.clone().sub(sacs[al.sac]).normalize() : al.c.clone().sub(v3(0, al.c.y, 0)).normalize();
      const pts = [];
      const n = al.sac >= 0 ? 18 : 9;
      for (let i = 0; i < n * 3 && pts.length < n; i++) {
        const d = v3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize();
        if (d.dot(out) < -0.25) continue;
        if (pts.some(p => p.angleTo(d) < 0.46)) continue;
        pts.push(d);
      }
      const edges = new Set();
      pts.forEach((p, i) => {
        pts.map((q, j) => [j, p.angleTo(q)]).filter(e => e[0] !== i).sort((a, b) => a[1] - b[1]).slice(0, 3)
          .forEach(([j, ang]) => { if (ang < 1.35) edges.add(i < j ? i + '_' + j : j + '_' + i); });
      });
      edges.forEach(key => {
        const [i, j] = key.split('_').map(Number);
        const a = pts[i], b = pts[j], arc = [];
        for (let s = 0; s <= 6; s++) {
          const d = a.clone().lerp(b, s / 6).normalize();
          const p = al.c.clone().addScaledVector(d, al.r * 1.045);
          if (sdf(p.x, p.y, p.z) < -0.012) { const q = al.c.clone().addScaledVector(d, al.r * 1.0); arc.push(q); } else arc.push(p);
        }
        const curve = new THREE.CatmullRomCurve3(arc);
        const gx = lab.clamp((al.c.x + 1.5) / 3.0, 0, 1);
        const ta = lab.clamp(gx * 0.7 + (a.dot(flow) * 0.5 + 0.5) * 0.3, 0, 1), tb2 = lab.clamp(gx * 0.7 + (b.dot(flow) * 0.5 + 0.5) * 0.3, 0, 1);
        capGeos.push(K.tube(curve, 8, 0.02, 0.02, 6, mix3(BLUE, RED, ta), mix3(BLUE, RED, tb2)));
        paths.push({ curve, t0: ta, t1: tb2 });
      });
      void ai;
    });
    const capMat = K.tissue({ vertexColors: true, a: 0xc0404e, cell: 30, noise: 6, bump: 0.002, edgeAmt: 0.02, rim: 0xffa0a0, rimAmt: 0.25, clearcoat: 0.8, ccr: 0.12, roughness: 0.38 });
    capMat.clippingPlanes = [clip];
    const caps = new THREE.Mesh(K.merge(capGeos), capMat); root.add(caps);
    // الشُرين (أزرق) والوريد (أحمر) يرافقان القصيبة ويتفرعان إلى الأكياس
    const vMatB = K.tissue({ vertexColors: true, a: 0x3557c8, cell: 18, noise: 5, bump: 0.003, edgeAmt: 0.04, rim: 0x9db4ff, rimAmt: 0.25, clearcoat: 0.85, ccr: 0.12, roughness: 0.38 });
    const vMatR = K.tissue({ vertexColors: true, a: 0xd02c3e, cell: 18, noise: 5, bump: 0.003, edgeAmt: 0.04, rim: 0xff9aa6, rimAmt: 0.25, clearcoat: 0.85, ccr: 0.12, roughness: 0.38 });
    const art = [], ven = [];
    art.push(K.tube(new THREE.CatmullRomCurve3([v3(-0.52, 2.55, -0.12), v3(-0.45, 1.5, -0.18), v3(-0.38, 0.9, -0.22)]), 30, 0.085, 0.07, 12, BLUE, BLUE));
    ven.push(K.tube(new THREE.CatmullRomCurve3([v3(0.38, 0.9, -0.22), v3(0.46, 1.5, -0.18), v3(0.54, 2.55, -0.12)]), 30, 0.07, 0.085, 12, RED, RED));
    sacs.forEach(c => {
      const back = c.clone().add(v3(0, 0.05, -0.42));
      art.push(K.tube(new THREE.CatmullRomCurve3([v3(-0.38, 0.9, -0.22), v3(-0.38, 0.9, -0.22).lerp(back, 0.5).add(v3(-0.1, 0.12, -0.05)), back.clone().add(v3(-0.25, 0.1, 0))]), 24, 0.05, 0.03, 10, BLUE, BLUE));
      ven.push(K.tube(new THREE.CatmullRomCurve3([back.clone().add(v3(0.25, -0.05, 0)), v3(0.38, 0.9, -0.22).lerp(back, 0.5).add(v3(0.1, 0.08, -0.08)), v3(0.38, 0.9, -0.22)]), 24, 0.03, 0.05, 10, RED, RED));
    });
    const artM = new THREE.Mesh(K.merge(art), vMatB), venM = new THREE.Mesh(K.merge(ven), vMatR);
    artM.userData.kind = 'art'; venM.userData.kind = 'ven';
    root.add(artM, venM);

    /* ---------- كريات الدم الحمراء (قرص مقعر الوجهين) ---------- */
    const prof = [];
    for (let i = 0; i <= 14; i++) { const r = (i / 14) * 0.05; const x = r / 0.05; const h = 0.5 * Math.sqrt(Math.max(0, 1 - x * x)) * (0.21 + 2.0 * x * x - 1.12 * x ** 4) * 0.05; prof.push(new THREE.Vector2(r, h)); }
    for (let i = 14; i >= 0; i--) prof.push(new THREE.Vector2(prof[i].x, -prof[i].y));
    const rbcG = new THREE.LatheGeometry(prof.filter((p, i, a) => i === 0 || p.distanceTo(a[i - 1]) > 1e-5), 20);
    const rbcM = new THREE.MeshPhysicalMaterial({ roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 });
    const NR = 70, rbc = new THREE.InstancedMesh(rbcG, rbcM, NR);
    rbc.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const cells = [];
    for (let i = 0; i < NR; i++) cells.push({ p: paths[Math.floor(rnd() * paths.length)], t: rnd(), sp: 0.22 + rnd() * 0.2, rot: rnd() * 6 });
    root.add(rbc);
    rbc.material.clippingPlanes = [clip];

    /* ---------- جزيئات الغازات ---------- */
    const NG = 60;
    const gasG = new THREE.SphereGeometry(0.034, 10, 8);
    const o2 = new THREE.InstancedMesh(gasG, new THREE.MeshStandardMaterial({ color: K.col(0xff4d5e), emissive: K.col(0x801020), roughness: 0.3 }), NG);
    const co2 = new THREE.InstancedMesh(gasG, new THREE.MeshStandardMaterial({ color: K.col(0x4f7dff), emissive: K.col(0x10206a), roughness: 0.3 }), NG);
    const sacAl = alveoli.filter(a => a.sac >= 0);
    const gas = [];
    for (let i = 0; i < NG * 2; i++) gas.push({ kind: i < NG ? 'o' : 'c', al: sacAl[Math.floor(rnd() * sacAl.length)], d: v3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(), t: rnd() });
    o2.visible = co2.visible = false;
    root.add(o2, co2);

    /* ---------- عناوين وتحكم ---------- */
    V.label('قصيبة انتهائية', [0.05, 2.5, 0.35]);
    V.label('قصيبة تنفسية', [-0.68, 1.2, 0.2]);
    V.label('قناة سنخية', [0.55, 0.42, 0.45]);
    V.label('كيس سنخي', [-1.72, -0.2, 0.6]);
    V.label('سنخ (0.2 ملم)', [0.95, -1.3, 0.6]);
    V.label('شُرين: دم غير مؤكسج', [-1.25, 1.7, -0.12]);
    V.label('وريد: دم مؤكسج', [1.3, 1.7, -0.12]);
    const info = V.info();
    let breathing = !lab.reduce, t = 0, cut = false, cutK = 0, infoTimer = 0;
    const showInfo = x => { clearTimeout(infoTimer); if (!x) { info.hidden = true; return; } info.innerHTML = `<b>${x[0]}</b>${x[1]}`; info.hidden = false; infoTimer = setTimeout(() => (info.hidden = true), 8000); };
    V.controlsBar([
      { label: 'تنفس', on: breathing, cb: on => (breathing = on) },
      { label: 'مقطع', on: false, cb: on => { cut = on; showInfo(on ? ['مقطع في الأسناخ', 'السنخ كيس مجوف جداره صف واحد من خلايا طلائية مسطحة، تحيط به من الخارج شبكة الشعيرات الدموية.'] : null); } },
      { label: 'تبادل الغازات', on: false, cb: on => { o2.visible = co2.visible = on; showInfo(on ? ['تبادل الغازات', 'الأوكسجين (أحمر) ينتشر من هواء السنخ إلى الدم، وثاني أوكسيد الكاربون (أزرق) من الدم إلى السنخ.'] : null); } },
      { label: 'الشعيرات', on: true, cb: on => { caps.visible = on; rbc.visible = on; } },
      { label: 'الأسماء', on: true, cb: on => (V.showLabels = on) }
    ]);
    V.pickables.push(wall, artM, venM);
    V.onPick = hit => {
      if (!hit) return showInfo(null);
      const k = hit.object.userData.kind;
      if (k === 'wall') showInfo(['السنخ', 'حجيرة قطرها حوالي 0.2 ملم، عددها 300 مليون، ومساحة جدرانها المتاحة للشعيرات 70 م².']);
      else if (k === 'art') showInfo(['شُرين رئوي', 'فرع من الشريان الرئوي يحمل دماً غير مؤكسج (أزرق) إلى شبكة الشعيرات.']);
      else if (k === 'ven') showInfo(['وريد رئوي', 'يجمع الدم المؤكسج (أحمر) من الشعيرات ويعيده إلى القلب.']);
    };

    const dummy = new THREE.Object3D(), cA = new THREE.Color(), cB = new THREE.Color(), tmp = new THREE.Vector3(), tan = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    cA.setRGB(BLUE[0], BLUE[1], BLUE[2]); cB.setRGB(RED[0], RED[1], RED[2]);
    const col = new THREE.Color();
    V.frame = dt => {
      if (breathing) t += dt;
      const b = K.breath((t % 5) / 5);
      root.scale.setScalar(1 + 0.045 * b);
      cutK += ((cut ? 1 : 0) - cutK) * Math.min(1, dt * 3);
      clip.constant = cutK > 0.01 ? 2.4 - cutK * 2.4 : 10;
      for (let i = 0; i < NR; i++) {
        const c = cells[i];
        c.t += dt * c.sp;
        if (c.t > 1) { c.t = 0; c.p = paths[Math.floor(Math.random() * paths.length)]; }
        c.p.curve.getPointAt(Math.min(1, c.t), tmp); c.p.curve.getTangentAt(Math.min(1, c.t), tan);
        dummy.position.copy(tmp);
        dummy.quaternion.setFromUnitVectors(up, tan); dummy.rotateX(Math.PI / 2); dummy.rotateY(c.rot);
        dummy.scale.setScalar(0.62); dummy.updateMatrix();
        rbc.setMatrixAt(i, dummy.matrix);
        col.copy(cA).lerp(cB, lab.clamp(c.p.t0 + (c.p.t1 - c.p.t0) * c.t, 0, 1));
        rbc.setColorAt(i, col);
      }
      rbc.instanceMatrix.needsUpdate = true; if (rbc.instanceColor) rbc.instanceColor.needsUpdate = true;
      if (o2.visible) {
        let io = 0, ic = 0;
        gas.forEach(g => {
          g.t += dt * 0.35;
          if (g.t > 1) { g.t = 0; g.al = sacAl[Math.floor(Math.random() * sacAl.length)]; g.d.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(); }
          const rr = g.kind === 'o' ? g.al.r * (0.45 + g.t * 0.7) : g.al.r * (1.15 - g.t * 0.7);
          dummy.position.copy(g.al.c).addScaledVector(g.d, rr);
          dummy.quaternion.identity(); dummy.scale.setScalar(Math.sin(g.t * Math.PI) * 1.2 + 0.2); dummy.updateMatrix();
          if (g.kind === 'o') o2.setMatrixAt(io++, dummy.matrix); else co2.setMatrixAt(ic++, dummy.matrix);
        });
        o2.instanceMatrix.needsUpdate = co2.instanceMatrix.needsUpdate = true;
      }
    };
    V.loading(false);
  }

  lab.ready.push(() => lab.k3.lazy(document.getElementById('alv3d'), build));
})();
