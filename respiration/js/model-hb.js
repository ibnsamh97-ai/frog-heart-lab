/* جزيئة الهيموكلوبين من بنيتها البلورية الحقيقية (PDB 4HHB): أشرطة السلاسل الأربع، مجاميع الهيم مع الحديد، وارتباط O₂ */
(function () {
  'use strict';
  const lab = window.Lab;
  const T = () => window.THREE;

  /* واجهة التحكم: تعمل حتى قبل بناء المجسم أو بدون WebGL */
  const api = (lab.hb = { count: 0, target: 0, busy: false, listeners: [], scene: false });
  const emit = () => api.listeners.forEach(f => f(api.count));
  api.add = () => { if (api.target < 4) { api.target++; if (!api.scene) { api.count = api.target; emit(); } } };
  api.remove = () => { if (api.target > 0) { api.target--; if (!api.scene) { api.count = api.target; emit(); } } };
  api.setTarget = n => { api.target = Math.max(0, Math.min(4, n)); if (!api.scene) { api.count = api.target; emit(); } };

  const A2U = 0.058; // 1 أنغستروم بوحدات المشهد

  function build(el) {
    const THREE = T(), K = lab.k3, D = window.HB_DATA;
    if (!D) return;
    const V = new K.Viewer(el, { cam: [0.2, 0.6, 9.2], target: [0, 0, 0], minD: 4.2, maxD: 16, spin: 0.45, fov: 30, exposure: 0.9, keyI: 1.3, hemi: 0.2 });
    if (!V.ok) return;
    V.loading(true);
    const sc = V.scene, root = new THREE.Group(); sc.add(root);
    const v = a => new THREE.Vector3(a[0] * A2U, a[1] * A2U, a[2] * A2U);
    const CH = {
      A: { name: 'α1', col: 0xc8283f, grp: 0 }, B: { name: 'β1', col: 0x2f56c9, grp: 0 },
      C: { name: 'α2', col: 0xe0606d, grp: 1 }, D: { name: 'β2', col: 0x5f80e0, grp: 1 }
    };
    const dimers = [new THREE.Group(), new THREE.Group()];
    dimers.forEach(g => root.add(g));

    /* ---------- أشرطة السلاسل (Cartoon) ---------- */
    function ribbon(ch) {
      const c = D.chains[ch], n = c.ca.length;
      const P = c.ca.map(v), O = c.o.map(v);
      const curve = new THREE.CatmullRomCurve3(P, false, 'centripetal');
      // اتجاه الشريط لكل حمض أميني
      const nr = [];
      for (let i = 0; i < n; i++) {
        let d;
        if (c.ss[i] === 'H' && i > 0 && i < n - 1) d = P[i].clone().sub(P[i - 1].clone().add(P[i + 1]).multiplyScalar(0.5));
        else d = O[i].clone().sub(P[i]);
        if (d.lengthSq() < 1e-8) d.set(0, 1, 0);
        d.normalize();
        if (i && d.dot(nr[i - 1]) < 0) d.negate();
        nr.push(d);
      }
      const w = [];
      for (let i = 0; i < n; i++) { let s = 0, k = 0; for (let j = -1; j <= 1; j++) { const q = c.ss[i + j]; if (q) { s += q === 'H' ? 1 : 0; k++; } } w.push(s / k); }
      const SPR = 7, M = (n - 1) * SPR, RAD = 12;
      const pos = [], nor = [], ind = [];
      const pt = new THREE.Vector3(), tg = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3();
      for (let s = 0; s <= M; s++) {
        const u = s / M, fi = u * (n - 1), i0 = Math.floor(fi), i1 = Math.min(n - 1, i0 + 1), f = fi - i0;
        curve.getPoint(u, pt); curve.getTangent(u, tg);
        N.copy(nr[i0]).lerp(nr[i1], f); N.addScaledVector(tg, -N.dot(tg)).normalize();
        B.crossVectors(tg, N).normalize();
        const wh = w[i0] + (w[i1] - w[i0]) * f;
        const W = (0.38 + 0.62 * wh) * 1.45 * A2U, H = (0.38 - 0.1 * wh) * 1.0 * A2U;
        for (let k = 0; k < RAD; k++) {
          const a = (k / RAD) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
          const ex = Math.sign(ca) * Math.pow(Math.abs(ca), 0.55), ey = Math.sign(sa) * Math.pow(Math.abs(sa), 0.55);
          pos.push(pt.x + B.x * ex * W + N.x * ey * H, pt.y + B.y * ex * W + N.y * ey * H, pt.z + B.z * ex * W + N.z * ey * H);
          const nx = B.x * ca * H + N.x * sa * W, ny = B.y * ca * H + N.y * sa * W, nz = B.z * ca * H + N.z * sa * W, l = Math.hypot(nx, ny, nz) || 1;
          nor.push(nx / l, ny / l, nz / l);
        }
      }
      for (let s = 0; s < M; s++) for (let k = 0; k < RAD; k++) { const a = s * RAD + k, b = s * RAD + ((k + 1) % RAD), c2 = a + RAD, d = b + RAD; ind.push(a, c2, b, b, c2, d); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setIndex(ind);
      const m = new THREE.MeshPhysicalMaterial({ color: K.col(CH[ch].col), roughness: 0.38, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.25, side: THREE.DoubleSide, envMapIntensity: 0.55 });
      const mesh = new THREE.Mesh(g, m); mesh.userData = { kind: 'chain', ch };
      return mesh;
    }
    const chains = {};
    Object.keys(CH).forEach(ch => { chains[ch] = ribbon(ch); dimers[CH[ch].grp].add(chains[ch]); });

    /* ---------- مجاميع الهيم ---------- */
    const EL = { C: [0.46, 0x5b1f2b], N: [0.5, 0x3c64e0], O: [0.48, 0xe0453f], FE: [0.95, 0xe08a2a] };
    const sites = {};
    const hemeMat = new THREE.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.8 });
    const sphG = new THREE.SphereGeometry(1, 14, 10), cylG = new THREE.CylinderGeometry(1, 1, 1, 8, 1);
    const ringC = [];
    Object.keys(D.heme).forEach(ch => {
      const atoms = D.heme[ch].map(a => ({ name: a[0], el: a[1].toUpperCase(), p: v([a[2], a[3], a[4]]) }));
      const grp = new THREE.Group(); dimers[CH[ch].grp].add(grp);
      const balls = new THREE.InstancedMesh(sphG, hemeMat.clone(), atoms.length);
      const dm = new THREE.Object3D(), cc = new THREE.Color();
      atoms.forEach((a, i) => {
        const e = EL[a.el] || EL.C;
        dm.position.copy(a.p); dm.scale.setScalar(e[0] * A2U * (a.el === 'FE' ? 1 : 1)); dm.updateMatrix();
        balls.setMatrixAt(i, dm.matrix); balls.setColorAt(i, cc.copy(K.col(e[1])));
      });
      grp.add(balls);
      const bonds = [];
      for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) {
        const d = atoms[i].p.distanceTo(atoms[j].p) / A2U, fe = atoms[i].el === 'FE' || atoms[j].el === 'FE';
        if (d < (fe ? 2.3 : 1.9)) bonds.push([atoms[i].p, atoms[j].p]);
      }
      const sticks = new THREE.InstancedMesh(cylG, new THREE.MeshPhysicalMaterial({ color: K.col(0x6b3a42), roughness: 0.4, clearcoat: 0.4 }), bonds.length);
      const yv = new THREE.Vector3(0, 1, 0);
      bonds.forEach(([a, b], i) => {
        const d = b.clone().sub(a), l = d.length();
        dm.position.copy(a).addScaledVector(d, 0.5); dm.quaternion.setFromUnitVectors(yv, d.normalize()); dm.scale.set(0.2 * A2U, l, 0.2 * A2U); dm.updateMatrix();
        sticks.setMatrixAt(i, dm.matrix);
      });
      grp.add(sticks);
      const fe = atoms.find(a => a.el === 'FE');
      // اتجاه الجهة البعيدة (عكس الهستيدين القريب F8)
      const prox = v(D.prox[ch]);
      const dist = fe.p.clone().sub(prox).normalize();
      const nIdx = atoms.map((a, i) => (a.el === 'C' ? i : -1)).filter(i => i >= 0);
      sites[ch] = { fe: fe.p, dir: dist, grp, balls, carbons: nIdx, feIdx: atoms.indexOf(fe), o2: null, k: 0 };
      ringC.push(sites[ch]);
    });

    /* ---------- جزيئات O₂ ---------- */
    const o2Mat = new THREE.MeshPhysicalMaterial({ color: K.col(0xff3b4d), emissive: K.col(0x5a0c14), roughness: 0.28, clearcoat: 0.7 });
    const makeO2 = () => {
      const g = new THREE.Group();
      const s1 = new THREE.Mesh(sphG, o2Mat), s2 = new THREE.Mesh(sphG, o2Mat);
      s1.scale.setScalar(0.62 * A2U * 1.4); s2.scale.copy(s1.scale);
      s1.position.set(0, 0, 0); s2.position.set(0, 1.21 * A2U * 1.25, 0.6 * A2U);
      const bd = new THREE.Mesh(cylG, new THREE.MeshPhysicalMaterial({ color: K.col(0xffd0d4), roughness: 0.4 }));
      bd.scale.set(0.16 * A2U, 1.35 * A2U, 0.16 * A2U); bd.position.copy(s2.position).multiplyScalar(0.5); bd.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), s2.position.clone().normalize());
      g.add(s1, s2, bd);
      return g;
    };

    /* ---------- السطح الجزيئي (اختياري) ---------- */
    let surf = null;
    function buildSurface() {
      const pts = [];
      Object.keys(CH).forEach(ch => D.chains[ch].ca.forEach(a => pts.push({ p: v(a), ch })));
      const CS = 9 * A2U, bmin = [-40 * A2U, -40 * A2U, -40 * A2U], bmax = [40 * A2U, 40 * A2U, 40 * A2U];
      const g0 = Math.ceil((bmax[0] - bmin[0]) / CS);
      const grid = new Map();
      pts.forEach((q, i) => { const key = Math.floor((q.p.x - bmin[0]) / CS) + ',' + Math.floor((q.p.y - bmin[1]) / CS) + ',' + Math.floor((q.p.z - bmin[2]) / CS); if (!grid.has(key)) grid.set(key, []); grid.get(key).push(i); });
      const s2 = (3.4 * A2U) ** 2 * 2;
      const field = (x, y, z) => {
        const i = Math.floor((x - bmin[0]) / CS), j = Math.floor((y - bmin[1]) / CS), k = Math.floor((z - bmin[2]) / CS);
        let s = 0;
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
          const L = grid.get((i + a) + ',' + (j + b) + ',' + (k + c)); if (!L) continue;
          for (const n of L) { const p = pts[n].p, dx = x - p.x, dy = y - p.y, dz = z - p.z; s += Math.exp(-(dx * dx + dy * dy + dz * dz) / s2); }
        }
        return (0.9 - s) * A2U * 3;
      };
      void g0;
      const g = K.surfaceNets(field, bmin, bmax, 1.25 * A2U, { coarse: 2, smooth: 2 });
      const p = g.attributes.position, col = new Float32Array(p.count * 3), tmp = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        tmp.set(p.getX(i), p.getY(i), p.getZ(i));
        let best = 1e9, bc = 'A';
        for (let n = 0; n < pts.length; n += 2) { const d = pts[n].p.distanceToSquared(tmp); if (d < best) { best = d; bc = pts[n].ch; } }
        col.set(K.rgb(CH[bc].col), i * 3);
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const m = new THREE.MeshPhysicalMaterial({ vertexColors: true, transparent: true, opacity: 0.3, roughness: 0.35, clearcoat: 0.3, clearcoatRoughness: 0.2, depthWrite: false, side: THREE.FrontSide, envMapIntensity: 0.4 });
      surf = new THREE.Mesh(g, m); surf.renderOrder = 2;
      root.add(surf);
    }

    /* ---------- عناوين وتحكم ---------- */
    const lbl = {};
    Object.keys(CH).forEach(ch => {
      const c = new THREE.Vector3(); D.chains[ch].ca.forEach(a => c.add(v(a))); c.multiplyScalar(1 / D.chains[ch].ca.length);
      c.normalize().multiplyScalar(2.05);
      lbl[ch] = V.label('سلسلة ' + CH[ch].name, [c.x, c.y, c.z], dimers[CH[ch].grp]);
    });
    const sA = sites.A;
    const hl = V.label('هيم وذرة حديد', [sA.fe.x + sA.dir.x * 0.75, sA.fe.y + 0.35, sA.fe.z + sA.dir.z * 0.75], dimers[0]);
    void hl;
    const badge = V.badge(), info = V.info();
    let infoTimer = 0;
    const showInfo = x => { clearTimeout(infoTimer); if (!x) { info.hidden = true; return; } info.innerHTML = `<b>${x[0]}</b>${x[1]}`; info.hidden = false; infoTimer = setTimeout(() => (info.hidden = true), 8000); };
    V.controlsBar([
      { label: 'السطح الجزيئي', on: false, cb: on => { if (on && !surf) { V.loading(true); setTimeout(() => { buildSurface(); V.loading(false); }, 20); } else if (surf) surf.visible = on; } },
      { label: 'الأسماء', on: true, cb: on => (V.showLabels = on) }
    ]);
    V.pickables.push(...Object.values(chains));
    V.onPick = hit => {
      if (!hit) return showInfo(null);
      const ch = hit.object.userData.ch;
      if (!ch) return;
      const a = ch === 'A' || ch === 'C';
      showInfo([`سلسلة ${CH[ch].name} (${a ? 'ألفا: 141 حامضاً أمينياً' : 'بيتا: 146 حامضاً أمينياً'})`, 'سلسلة ببتيدية ملتفة بحلزونات، تحتضن جزيئة هيم واحدة في جيب بين حلزوناتها.']);
    };

    /* ---------- الحركة: ارتباط O₂ وتحوّل T ← R ---------- */
    const order = ['A', 'D', 'B', 'C'];
    const bound = { A: null, B: null, C: null, D: null };
    let anim = null, relax = 0;
    const deoxy = K.col(0x4a1830), oxy = K.col(0xff3045), cTmp = new THREE.Color();
    api.scene = true;
    function startNext() {
      if (anim) return;
      const nb = order.filter(c => bound[c]).length;
      if (api.target > nb) {
        const ch = order.find(c => !bound[c]); const s = sites[ch];
        const m = makeO2(); s.grp.add(m);
        const to = s.fe.clone().addScaledVector(s.dir, 1.9 * A2U * 1.35);
        const from = to.clone().addScaledVector(s.dir, 2.6).add(new THREE.Vector3(0, 0.8, 0));
        m.position.copy(from); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), s.dir);
        bound[ch] = m;
        anim = { ch, m, from, to, t: 0, dur: nb === 0 ? 1.6 : 0.65, add: true };
        api.busy = true;
      } else if (api.target < nb) {
        const ch = [...order].reverse().find(c => bound[c]); const s = sites[ch], m = bound[ch];
        bound[ch] = null;
        anim = { ch, m, from: m.position.clone(), to: m.position.clone().addScaledVector(s.dir, 2.4).add(new THREE.Vector3(0, 0.6, 0)), t: 0, dur: 0.9, add: false };
        api.busy = true;
      }
    }
    V.frame = dt => {
      startNext();
      if (anim) {
        anim.t += dt / anim.dur;
        const k = lab.ease(Math.min(1, anim.t));
        anim.m.position.lerpVectors(anim.from, anim.to, k);
        if (!anim.add) anim.m.scale.setScalar(1 - k * 0.9);
        if (anim.t >= 1) {
          const a = anim; anim = null; api.busy = false;
          if (!a.add) a.m.parent.remove(a.m);
          api.count = order.filter(c => bound[c] && !(anim && anim.ch === c)).length;
          emit();
        }
      }
      const want = api.count > 0 || (anim && anim.add) ? 1 : 0;
      relax += (want - relax) * Math.min(1, dt * 2);
      dimers[1].rotation.x = 0.13 * relax; dimers[1].rotation.y = -0.04 * relax;
      Object.keys(sites).forEach(ch => {
        const s = sites[ch], on = bound[ch] && !(anim && anim.add && anim.ch === ch && anim.t < 0.92) ? 1 : 0;
        const prev = s.k; s.k += (on - s.k) * Math.min(1, dt * 4);
        if (Math.abs(prev - s.k) > 0.002 || s.k === 0 && !s.init) {
          s.init = true;
          cTmp.copy(deoxy).lerp(oxy, s.k);
          s.carbons.forEach(i => s.balls.setColorAt(i, cTmp));
          s.balls.instanceColor.needsUpdate = true;
        }
      });
      const txt = relax > 0.5 ? 'الشكل R (مرتخٍ) · ألفة أعلى' : 'الشكل T (مشدود) · غير مؤكسج';
      if (badge.textContent !== txt) badge.textContent = txt;
    };
    V.loading(false);
  }

  lab.ready.push(() => lab.k3.lazy(document.getElementById('hb3d'), build));
})();
