/* منضدة تحضير العينات: الدم الكامل والبلازما والمصل — جهاز طرد مركزي وماصة دقيقة وحفظ */
(function () {
  'use strict';
  const lab = window.Lab, $ = lab.$;
  const T = () => window.THREE;
  const FILL = 0.42;   // ارتفاع 2.5 مل في الأنبوب

  function build(el) {
    const THREE = T(), K = lab.k3;
    const HOME = [[-0.2, 3.3, 4.6], [-0.2, 0.35, -0.1]];
    const V = new K.Viewer(el, { cam: HOME[0], target: HOME[1], minD: 0.8, maxD: 10, spin: 0, fov: 32, shadows: true, shadowSize: 3.6, exposure: 0.8, hemi: 0.3, keyI: 1.25 });
    if (!V.ok) return;
    V.loading(true);
    const sc = V.scene, root = new THREE.Group(); sc.add(root);
    const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const cyl = (r0, r1, h, seg, open) => new THREE.CylinderGeometry(r0, r1, h, seg || 32, 1, !!open);
    const plastic = (c, o) => new THREE.MeshPhysicalMaterial(Object.assign({ color: K.col(c), roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.8 }, o || {}));
    const clear = o => new THREE.MeshPhysicalMaterial(Object.assign({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.2, clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false, envMapIntensity: 1.25 }, o || {}));
    const metal = new THREE.MeshPhysicalMaterial({ color: 0xc9d0d6, metalness: 1, roughness: 0.3, envMapIntensity: 1.2 });
    const M = {
      blood: new THREE.MeshPhysicalMaterial({ color: K.col(0x5c0a14), roughness: 0.25, clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 0.6 }),
      rbc: new THREE.MeshPhysicalMaterial({ color: K.col(0x4a0710), roughness: 0.35, clearcoat: 0.3, envMapIntensity: 0.5 }),
      clot: new THREE.MeshPhysicalMaterial({ color: K.col(0x3d060d), roughness: 0.55, clearcoat: 0.2, envMapIntensity: 0.4 }),
      buffy: new THREE.MeshPhysicalMaterial({ color: K.col(0xeee6d8), roughness: 0.5, envMapIntensity: 0.6 }),
      plasma: new THREE.MeshPhysicalMaterial({ color: K.col(0xeac15a), roughness: 0.08, transparent: true, opacity: 0.78, clearcoat: 0.8, envMapIntensity: 0.9, depthWrite: false }),
      serum: new THREE.MeshPhysicalMaterial({ color: K.col(0xf0d27a), roughness: 0.08, transparent: true, opacity: 0.72, clearcoat: 0.8, envMapIntensity: 0.9, depthWrite: false }),
      water: new THREE.MeshPhysicalMaterial({ color: K.col(0xd8ecff), roughness: 0.05, transparent: true, opacity: 0.35, envMapIntensity: 1, depthWrite: false })
    };
    const basis = (xAxis, upHint) => { const x = xAxis.clone().normalize(); const y = upHint.clone().addScaledVector(x, -upHint.dot(x)).normalize(); const z = x.clone().cross(y); return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); };

    /* ---------- المنضدة ---------- */
    const bench = new THREE.Mesh(new THREE.BoxGeometry(9, 0.2, 4.4), K.tissue({ a: 0xaab5c0, b: 0xa3afba, edge: 0x98a4b0, speck: 0x7f8b98, speckAmt: 0.3, cell: 10, noise: 3, bump: 0.0006, edgeAmt: 0.05, rim: 0xffffff, rimAmt: 0.04, clearcoat: 0.3, ccr: 0.4, roughness: 0.6, env: 0.45 }));
    bench.position.set(0, -0.1, -0.3); bench.receiveShadow = true; root.add(bench);
    K.contactShadow(sc, 0.002, 8, 4, 0.25);

    /* ---------- الأنابيب ---------- */
    function labelTex(text, color) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 128;
      const x = c.getContext('2d');
      x.fillStyle = '#fbfbf8'; x.fillRect(0, 0, 256, 128); x.fillStyle = color; x.fillRect(0, 0, 256, 26);
      x.fillStyle = '#1b2733'; x.font = '700 38px Cairo, "Noto Sans Arabic", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      if (/[؀-ۿ]/.test(text)) x.direction = 'rtl';
      x.fillText(text, 128, 72);
      x.fillStyle = '#8a96a3'; for (let i = 0; i < 16; i++) x.fillRect(40 + i * 11, 102, i % 3 ? 3 : 6, 16);
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
    }
    const TO = -0.35;
    function makeTube(capColor, text, withLabel) {
      const g = new THREE.Group(), tb = new THREE.Group(); tb.position.y = -TO; g.add(tb);
      const body = new THREE.Mesh(cyl(0.062, 0.062, 0.62, 36, true), clear({ opacity: 0.22, side: THREE.DoubleSide })); body.position.y = 0.31 + TO; tb.add(body);
      const bottom = new THREE.Mesh(new THREE.SphereGeometry(0.062, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), clear({ opacity: 0.22 })); bottom.position.y = TO; tb.add(bottom);
      const cap = new THREE.Group(); cap.position.y = 0.69 + TO; tb.add(cap);
      cap.add(new THREE.Mesh(cyl(0.076, 0.076, 0.14, 32), plastic(capColor)));
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.076, 0.008, 6, 32), plastic(capColor)); rim.rotation.x = Math.PI / 2; rim.position.y = -0.07; cap.add(rim);
      if (withLabel !== false) { const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.0635, 0.0635, 0.2, 32, 1, true, -1.2, 2.4), new THREE.MeshStandardMaterial({ map: labelTex(text, '#' + capColor.toString(16).padStart(6, '0')), transparent: true })); lb.position.y = 0.5 + TO; tb.add(lb); }
      const content = new THREE.Group(); content.position.y = TO; tb.add(content);
      g.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      return { g, tb, cap, content, layers: [] };
    }
    // طبقات المحتوى: [{h, m, top:'flat'|'clot'}] من الأسفل للأعلى
    function setLayers(t, layers) {
      while (t.content.children.length) { const c = t.content.children.pop(); c.geometry.dispose(); }
      let y = 0;
      layers.forEach((L, i) => {
        if (L.h <= 0.0005) return;
        const r = L.r || 0.056;
        if (i === 0) { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 22, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), L.m); b.renderOrder = 1; t.content.add(b); }
        let geo = cyl(r, r, L.h, 30);
        if (L.top === 'clot') {
          geo = new THREE.CylinderGeometry(r * 0.93, r * 0.98, L.h, 30, 6);
          const p = geo.attributes.position;
          for (let k = 0; k < p.count; k++) {
            const yy = p.getY(k), a = Math.atan2(p.getZ(k), p.getX(k));
            if (yy > L.h / 2 - 0.001) p.setY(k, yy + 0.012 * Math.sin(a * 3 + 1) + 0.008 * Math.sin(a * 7));
            const sh = 1 - 0.06 * Math.max(0, (yy + L.h / 2) / L.h) * (1 + Math.sin(a * 5));
            p.setX(k, p.getX(k) * sh); p.setZ(k, p.getZ(k) * sh);
          }
          geo.computeVertexNormals();
        }
        const m = new THREE.Mesh(geo, L.m); m.position.y = y + L.h / 2; m.renderOrder = 1 + i;
        t.content.add(m);
        y += L.h;
      });
      t.layers = layers;
    }
    const tubes = {
      edta: makeTube(0x8a5bd6, 'EDTA'),
      plain: makeTube(0xd8343c, 'Plain'),
      bal: makeTube(0xf2f4f6, 'موازنة')
    };
    // الحامل
    const rack = new THREE.Group(); root.add(rack); rack.position.set(-1.75, 0, 0.55);
    const rackMat = plastic(0x2f8fd8, { roughness: 0.5, clearcoat: 0.3 });
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.04, 0.3), rackMat); r1.position.y = 0.36; rack.add(r1);
    const r2 = r1.clone(); r2.position.y = 0.02; rack.add(r2);
    [-0.6, 0.6].forEach(x => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.36, 0.3), rackMat); l.position.set(x, 0.19, 0); rack.add(l); });
    rack.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    const SLOT = { edta: v3(-0.38, 0.105, 0), plain: v3(0, 0.105, 0), bal: v3(0.38, 0.105, 0) };
    Object.keys(tubes).forEach(k => { rack.add(tubes[k].g); tubes[k].g.position.copy(SLOT[k]); tubes[k].home = SLOT[k].clone(); });
    setLayers(tubes.bal, [{ h: FILL, m: M.water }]);

    /* ---------- جهاز الطرد المركزي ---------- */
    const cf = new THREE.Group(); root.add(cf); cf.position.set(1.25, 0, -0.35);
    const shell = plastic(0xe3e8ee, { roughness: 0.42, clearcoat: 0.5 });
    const roundBox = (w, h, d, r) => {
      const s = new THREE.Shape(), x0 = -w / 2, z0 = -d / 2;
      s.moveTo(x0 + r, z0); s.lineTo(x0 + w - r, z0); s.quadraticCurveTo(x0 + w, z0, x0 + w, z0 + r); s.lineTo(x0 + w, z0 + d - r); s.quadraticCurveTo(x0 + w, z0 + d, x0 + w - r, z0 + d);
      s.lineTo(x0 + r, z0 + d); s.quadraticCurveTo(x0, z0 + d, x0, z0 + d - r); s.lineTo(x0, z0 + r); s.quadraticCurveTo(x0, z0, x0 + r, z0);
      return s;
    };
    {
      const s = roundBox(2.2, 0, 2.1, 0.45), hole = new THREE.Path(); hole.absarc(0, -0.08, 0.86, 0, Math.PI * 2, true); s.holes.push(hole);
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.82, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3, curveSegments: 24 });
      g.rotateX(-Math.PI / 2); g.translate(0, 0.05, 0);
      const body = new THREE.Mesh(g, shell); body.castShadow = true; body.receiveShadow = true; cf.add(body);
    }
    const well = new THREE.Mesh(cyl(0.86, 0.86, 0.62, 48, true), new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.6, side: THREE.BackSide })); well.position.set(0, 0.6, 0.08); cf.add(well);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(0.86, 48), new THREE.MeshStandardMaterial({ color: 0x1d2127, roughness: 0.7 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.3, 0.08); cf.add(floor);
    // الدوّار بزاوية ثابتة
    const rotor = new THREE.Group(); rotor.position.set(0, 0.42, 0.08); cf.add(rotor);
    const rotBody = new THREE.Mesh(cyl(0.5, 0.74, 0.26, 48), metal); rotBody.castShadow = true; rotor.add(rotBody);
    const knob = new THREE.Mesh(cyl(0.09, 0.11, 0.14, 24), plastic(0x2b3038)); knob.position.y = 0.19; rotor.add(knob);
    const SLOTS = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2, rr = 0.6;
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.075, 20), new THREE.MeshBasicMaterial({ color: 0x0c0e11 }));
      const dir = v3(-Math.cos(a) * 0.62, 0.78, -Math.sin(a) * 0.62).normalize();
      hole.position.set(Math.cos(a) * rr, 0.13 - ((rr - 0.5) / 0.24) * 0.26 + 0.004, Math.sin(a) * rr); hole.lookAt(hole.position.clone().add(dir)); hole.position.addScaledVector(dir, 0.003); rotor.add(hole);
      SLOTS.push({ a, pos: hole.position.clone(), dir });
    }
    // الغطاء بنافذة شفافة، مفصّل من الخلف
    const lid = new THREE.Group(); lid.position.set(0, 0.92, -1.0); cf.add(lid);
    {
      const s = roundBox(2.2, 0, 2.05, 0.45), hole = new THREE.Path(); hole.absarc(0, -0.1, 0.62, 0, Math.PI * 2, true); s.holes.push(hole);
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 24 });
      g.rotateX(-Math.PI / 2); g.translate(0, 0, 1.06);
      const lm = new THREE.Mesh(g, plastic(0xcfd7e0, { roughness: 0.4 })); lm.castShadow = true; lid.add(lm);
      const win = new THREE.Mesh(new THREE.CircleGeometry(0.63, 48), clear({ opacity: 0.25, color: 0xdff1ff })); win.rotation.x = -Math.PI / 2; win.position.set(0, 0.05, 1.06 + 0.1); lid.add(win);
    }
    // لوحة العرض
    const disp = document.createElement('canvas'); disp.width = 256; disp.height = 96;
    const dtex = new THREE.CanvasTexture(disp); dtex.encoding = THREE.sRGBEncoding;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.34), new THREE.MeshBasicMaterial({ map: dtex, toneMapped: false }));
    panel.position.set(-0.35, 0.5, 1.111); cf.add(panel);
    const btnG = new THREE.Mesh(cyl(0.07, 0.07, 0.03, 20), plastic(0x2fbf71)); btnG.rotation.x = Math.PI / 2; btnG.position.set(0.45, 0.5, 1.11); cf.add(btnG);
    const btnR = new THREE.Mesh(cyl(0.07, 0.07, 0.03, 20), plastic(0xe0453c)); btnR.rotation.x = Math.PI / 2; btnR.position.set(0.68, 0.5, 1.11); cf.add(btnR);
    let dispState = '';
    function drawDisplay(rpm, min, sec) {
      const s = rpm + '|' + min + '|' + sec; if (s === dispState) return; dispState = s;
      const x = disp.getContext('2d');
      x.fillStyle = '#0d1f1a'; x.fillRect(0, 0, 256, 96);
      x.fillStyle = '#5dffb0'; x.font = '700 34px "IBM Plex Mono", monospace'; x.textBaseline = 'middle';
      x.textAlign = 'left'; x.fillText(String(rpm).padStart(4, ' '), 14, 34); x.font = '600 16px "IBM Plex Mono", monospace'; x.fillText('RPM', 106, 38);
      x.font = '700 30px "IBM Plex Mono", monospace'; x.textAlign = 'right'; x.fillText(String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0'), 244, 34);
      x.font = '600 15px "IBM Plex Mono", monospace'; x.fillStyle = '#3aa77a'; x.textAlign = 'left'; x.fillText('CENTRIFUGE', 14, 76); x.textAlign = 'right'; x.fillText('MIN', 244, 76);
      dtex.needsUpdate = true;
    }
    drawDisplay(0, 10, 0);

    /* ---------- الماصة الدقيقة والأنابيب الصغيرة والصندوق ---------- */
    const pip = new THREE.Group(); root.add(pip);
    {
      const grip = plastic(0xe9edf2, { roughness: 0.45 });
      const body = new THREE.Mesh(cyl(0.085, 0.07, 0.9, 28), grip); body.position.y = 0.95; pip.add(body);
      const hook = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.16), grip); hook.position.set(0, 1.25, -0.12); hook.rotation.x = -0.3; pip.add(hook);
      const top = new THREE.Mesh(cyl(0.05, 0.05, 0.16, 20), plastic(0x2f6db3)); top.position.y = 1.47; pip.add(top);
      const btn = new THREE.Mesh(cyl(0.075, 0.075, 0.04, 24), plastic(0x2f6db3)); btn.position.y = 1.56; pip.add(btn);
      pip.userData.btn = [top, btn];
      const shaft = new THREE.Mesh(cyl(0.05, 0.022, 0.42, 24), grip); shaft.position.y = 0.3; pip.add(shaft);
      const ej = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.4, 0.05), plastic(0x9aa6b3)); ej.position.set(0.09, 0.62, 0); pip.add(ej);
      const tip = new THREE.Mesh(cyl(0.024, 0.006, 0.3, 20), clear({ opacity: 0.45, color: 0xfff0b0 })); tip.position.y = -0.04; pip.add(tip);
      const tipFill = new THREE.Mesh(cyl(0.016, 0.005, 0.2, 16), M.plasma); tipFill.position.y = -0.09; tipFill.visible = false; pip.add(tipFill);
      pip.userData.tip = tip; pip.userData.fill = tipFill;
      const disp2 = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), new THREE.MeshBasicMaterial({ color: 0x2b3038 })); disp2.position.set(0, 1.1, 0.086); pip.add(disp2);
      pip.traverse(c => { if (c.isMesh) c.castShadow = true; });
    }
    // الماصة الدقيقة: رأسها عند الأصل (y=-0.19) — نضعها على حامل
    const pipHome = { p: v3(0.05, 0.19, 0.95), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2 - 0.02)) };
    pip.position.copy(pipHome.p); pip.quaternion.copy(pipHome.q);
    const PIP_TIP = 0.19;
    // أنابيب صغيرة (Aliquots)
    const aliq = [];
    const aRack = new THREE.Group(); root.add(aRack); aRack.position.set(-0.35, 0, 0.25);
    const aBase = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.12, 0.26), plastic(0xf1c23a, { roughness: 0.5 })); aBase.position.y = 0.06; aBase.castShadow = true; aRack.add(aBase);
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group(); g.position.set(-0.22 + i * 0.22, 0.13, 0); aRack.add(g);
      const body = new THREE.Mesh(cyl(0.045, 0.045, 0.22, 24, true), clear({ opacity: 0.35, side: THREE.DoubleSide })); body.position.y = 0.16; g.add(body);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 24, 1, true), clear({ opacity: 0.35, side: THREE.DoubleSide })); cone.rotation.x = Math.PI; cone.position.y = 0.0; g.add(cone);
      const capA = new THREE.Mesh(cyl(0.05, 0.05, 0.03, 24), clear({ opacity: 0.6, color: 0xeef6ff })); capA.position.set(0, 0.285, 0); g.add(capA);
      const fill = new THREE.Mesh(cyl(0.04, 0.012, 0.16, 20), M.plasma); fill.position.y = 0.03; fill.visible = false; fill.scale.y = 0.001; g.add(fill);
      const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), new THREE.MeshBasicMaterial({ map: numTex(i + 1), transparent: true })); tag.position.set(0, 0.16, 0.047); g.add(tag);
      aliq.push({ g, fill, cap: capA });
    }
    // صندوق الحفظ
    const box = new THREE.Group(); root.add(box); box.position.set(-3.1, 0, -0.55);
    const boxMat = plastic(0x9fb0c2, { roughness: 0.55 });
    const boxB = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.32, 0.95), boxMat); boxB.position.y = 0.16; boxB.castShadow = true; box.add(boxB);
    const boxIn = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 0.85), new THREE.MeshStandardMaterial({ color: 0x3a4655 })); boxIn.position.y = 0.325; box.add(boxIn);
    const boxLbl = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false })); boxLbl.position.set(0, 0.16, 0.477); box.add(boxLbl);
    const frost = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0xeaf6ff, size: 0.035, transparent: true, opacity: 0, depthWrite: false }));
    { const a = [], r = lab.rnd(3); for (let i = 0; i < 160; i++) a.push((r() - 0.5) * 1.0, 0.32 + r() * 0.5, (r() - 0.5) * 1.0); frost.geometry.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); }
    box.add(frost);
    function setBox(kind) {
      const c = document.createElement('canvas'); c.width = 280; c.height = 80; const x = c.getContext('2d');
      x.fillStyle = kind === 'freezer' ? '#e9f4ff' : kind === 'fridge' ? '#dff0ff' : '#f2f4f6'; x.fillRect(0, 0, 280, 80);
      x.fillStyle = kind === 'freezer' ? '#1f5fbf' : '#2f6db3'; x.font = '700 38px "IBM Plex Mono", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(kind === 'freezer' ? '−20 °C' : kind === 'fridge' ? '2–8 °C' : '—', 140, 42);
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
      if (boxLbl.material.map) boxLbl.material.map.dispose();
      boxLbl.material.map = t; boxLbl.material.needsUpdate = true;
      boxMat.color.copy(K.col(kind === 'freezer' ? 0xdbe9f7 : kind === 'fridge' ? 0x7fb2e5 : 0x9fb0c2));
    }
    setBox('');

    /* ---------- أسماء الطبقات ---------- */
    const LBL = {
      rbc: V.label('', [0, 0, 0]), buffy: V.label('', [0, 0, 0]), top: V.label('', [0, 0, 0])
    };
    Object.values(LBL).forEach(l => { l.hidden = true; l.el.classList.add('v-layer'); });
    function showLayerLabels(t, kind) {
      const L = t.layers; if (!L.length) return;
      let y = 0; const pos = [];
      L.forEach(l => { pos.push(y + l.h / 2); y += l.h; });
      const at = (lb, i, text) => { lb.obj = t.content; lb.pos.set(0.1, pos[i], 0); lb.el.textContent = text; lb.hidden = false; };
      if (kind === 'plasma') { at(LBL.rbc, 0, 'كريات حمر ≈ 45%'); at(LBL.buffy, 1, 'الطبقة البيضاء: كريات بيض وصفيحات'); at(LBL.top, 2, 'البلازما ≈ 55%'); }
      else { at(LBL.rbc, 0, 'الخثرة'); LBL.buffy.hidden = true; at(LBL.top, 1, 'المصل (أصفر فاتح)'); }
    }
    const hideLabels = () => Object.values(LBL).forEach(l => (l.hidden = true));

    /* ---------- الحركة ---------- */
    const tweens = [];
    const anim = (dur, fn) => new Promise(res => tweens.push({ t: 0, dur: (lab.reduce ? Math.min(dur, 0.25) : dur) * (window.__labSpeed || 1), fn, res }));
    const camTo = (pos, tgt, dur) => { const c = V.camera, ctl = V.controls, p0 = c.position.clone(), t0 = ctl.target.clone(), t1 = v3(...tgt), f = lab.clamp(1.6 / (c.aspect || 1.6), 1, 1.45), p1 = t1.clone().add(v3(...pos).sub(t1).multiplyScalar(f)); return anim(dur || 1.1, k => { const e = lab.ease(k); c.position.lerpVectors(p0, p1, e); ctl.target.lerpVectors(t0, t1, e); }); };
    const moveW = (obj, pos, q, dur) => { const p0 = obj.position.clone(), q0 = obj.quaternion.clone(); return anim(dur || 0.9, k => { const e = lab.ease(k); obj.position.lerpVectors(p0, pos, e); if (q) obj.quaternion.slerpQuaternions(q0, q, e); }); };
    let spin = 0, spinTarget = 0;
    const DISP = v3(-2.0, 0.12, 1.15);

    const S = { tube: null, kind: 'whole' };
    function tubeWorld(t) { root.attach(t.g); }
    function resetBench(kind) {
      tweens.length = 0; hideLabels();
      S.kind = kind; spin = 0; spinTarget = 0; rotor.rotation.y = 0;
      lid.rotation.x = 0; drawDisplay(0, 10, 0);
      Object.keys(tubes).forEach(k => { const t = tubes[k]; rack.attach(t.g); t.g.position.copy(t.home); t.g.quaternion.identity(); t.tb.rotation.set(0, 0, 0); t.cap.position.set(0, 0.69 + TO, 0); t.g.visible = true; });
      setLayers(tubes.edta, kind === 'serum' ? [] : [{ h: FILL, m: M.blood }]);
      setLayers(tubes.plain, kind === 'serum' ? [{ h: FILL, m: M.blood }] : []);
      tubes.edta.g.visible = kind !== 'serum'; tubes.plain.g.visible = kind === 'serum';
      tubes.bal.g.visible = kind !== 'whole';
      S.tube = kind === 'serum' ? tubes.plain : tubes.edta;
      pip.position.copy(pipHome.p); pip.quaternion.copy(pipHome.q); pip.userData.fill.visible = false;
      aliq.forEach((a, i) => { aRack.attach(a.g); a.g.position.set(-0.22 + i * 0.22, 0.13, 0); a.g.quaternion.identity(); a.fill.visible = false; a.fill.scale.y = 0.001; a.fill.material = kind === 'serum' ? M.serum : M.plasma; });
      pip.userData.fill.material = kind === 'serum' ? M.serum : M.plasma;
      setBox(''); frost.material.opacity = 0;
      return camTo(HOME[0], HOME[1], 0.9);
    }

    const A = {
      async invert() {
        const t = S.tube, h = t.g.position.y;
        await camTo([-1.4, 1.6, 2.4], [-1.85, 0.75, 0.55], 0.8);
        await anim(0.4, k => (t.g.position.y = h + 0.55 * lab.ease(k)));
        for (let i = 0; i < 5; i++) await anim(0.55, k => (t.tb.rotation.x = Math.sin(k * Math.PI) * Math.PI * 0.98));
        t.tb.rotation.x = 0;
        await anim(0.4, k => (t.g.position.y = h + 0.55 * (1 - lab.ease(k))));
      },
      async shake() {
        const t = S.tube, h = t.g.position.y;
        await camTo([-1.4, 1.6, 2.4], [-1.85, 0.75, 0.55], 0.6);
        await anim(0.3, k => (t.g.position.y = h + 0.5 * k));
        await anim(1.2, k => { t.tb.rotation.z = Math.sin(k * Math.PI * 14) * 0.5; t.g.position.x = t.home.x + Math.sin(k * Math.PI * 14) * 0.06; });
        t.tb.rotation.z = 0; t.g.position.x = t.home.x;
        await anim(0.3, k => (t.g.position.y = h + 0.5 * (1 - k)));
      },
      async clot() {
        await camTo([-1.4, 1.4, 2.2], [-1.75, 0.55, 0.55], 0.8);
        // تسريع الزمن: 30 دقيقة — تنكمش الخثرة ويظهر قليل من المصل
        await anim(3.2, k => {
          const m = Math.round(k * 30);
          api.ro('time', m + ' دقيقة'); api.ro('state', k < 0.5 ? 'يتجلط…' : 'تكوّنت خثرة');
          if (Math.round(k * 40) !== Math.round((k - 0.02) * 40)) setLayers(tubes.plain, [{ h: FILL * (1 - 0.18 * k), m: k > 0.3 ? M.clot : M.blood, top: k > 0.3 ? 'clot' : null }, { h: FILL * 0.18 * k, m: M.serum }]);
        });
      },
      async load() {
        await camTo([1.3, 2.9, 2.2], [1.25, 0.45, -0.3], 0.9);
        await anim(0.7, k => (lid.rotation.x = -1.75 * lab.ease(k)));
        const put = async (t, slot) => {
          tubeWorld(t);
          const s = SLOTS[slot], world = rotor.localToWorld(s.pos.clone()), dirW = s.dir.clone().transformDirection(rotor.matrixWorld);
          await moveW(t.g, t.g.position.clone().add(v3(0, 0.9, 0)), null, 0.4);
          const q = basis(dirW, v3(0, 0, 1)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 2)));
          const above = world.clone().addScaledVector(dirW, 0.9);
          await moveW(t.g, above, q, 0.8);
          await moveW(t.g, world.clone().addScaledVector(dirW, -0.45), q, 0.6);
          rotor.attach(t.g);
        };
        await put(S.tube, 0);
        await put(tubes.bal, 3);
        await anim(0.7, k => (lid.rotation.x = -1.75 * (1 - lab.ease(k))));
      },
      async spin() {
        await camTo([1.6, 2.3, 2.5], [1.2, 0.5, -0.3], 0.7);
        spinTarget = 1;
        await anim(4.2, k => {
          const rpm = Math.round(3000 * Math.min(1, k * 3, (1 - k) * 4));
          const left = Math.max(0, Math.round(600 * (1 - k)));
          drawDisplay(rpm, Math.floor(left / 60), left % 60);
          api.ro('rpm', rpm + ''); api.ro('time', Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'));
          if (k > 0.75) spinTarget = 0;
        });
        spinTarget = 0;
        await anim(0.6, () => {});
        spin = 0;
        drawDisplay(0, 0, 0); api.ro('rpm', '0');
        // الفصل
        if (S.kind === 'plasma') setLayers(S.tube, [{ h: FILL * 0.45, m: M.rbc }, { h: 0.012, m: M.buffy }, { h: FILL * 0.55 - 0.012, m: M.plasma }]);
        else setLayers(S.tube, [{ h: FILL * 0.47, m: M.clot, top: 'clot' }, { h: FILL * 0.53, m: M.serum }]);
        api.ro('state', S.kind === 'plasma' ? '3 طبقات' : 'طبقتان');
        await anim(0.7, k => (lid.rotation.x = -1.75 * lab.ease(k)));
        const back = async t => {
          tubeWorld(t);
          await moveW(t.g, t.g.position.clone().add(v3(0, 0, 0)).addScaledVector(v3(0, 1, 0), 0.9), null, 0.5);
          const rw = rack.localToWorld(t.home.clone());
          await moveW(t.g, rw.clone().add(v3(0, 0.9, 0)), new THREE.Quaternion(), 0.9);
          await moveW(t.g, rw, null, 0.4);
          rack.attach(t.g); t.g.position.copy(t.home); t.g.quaternion.identity();
        };
        // نرفع أنبوب العينة أمام العين لرؤية الطبقات
        tubeWorld(S.tube);
        await moveW(S.tube.g, S.tube.g.position.clone().add(v3(0, 0.9, 0)), null, 0.5);
        await moveW(S.tube.g, DISP.clone().add(v3(0, 0.6, 0)), new THREE.Quaternion(), 0.9);
        await moveW(S.tube.g, DISP, null, 0.4);
        await back(tubes.bal);
        await anim(0.6, k => (lid.rotation.x = -1.75 * (1 - lab.ease(k))));
        await camTo([DISP.x + 0.55, DISP.y + 0.55, DISP.z + 1.25], [DISP.x + 0.18, DISP.y + 0.28, DISP.z], 1.0);
        showLayerLabels(S.tube, S.kind);
      },
      async pipette() {
        hideLabels();
        const t = S.tube, top = t.g.getWorldPosition(v3(0, 0, 0)), up = new THREE.Quaternion();
        await camTo([-0.75, 1.8, 3.0], [-1.25, 0.5, 0.65], 0.9);
        await anim(0.45, k => t.cap.position.set(0, 0.69 + TO + k * 0.3, k * 0.25));
        const L = t.layers, topLayer = L[L.length - 1];
        const yTop = () => { let y = 0; t.layers.forEach(l => (y += l.h)); return y; };
        for (let i = 0; i < 3; i++) {
          const mouth = top.clone().add(v3(0, 0.75, 0));
          await moveW(pip, mouth.clone().add(v3(0, 0.6, 0)), up, i ? 0.6 : 0.9);
          const yLiquid = top.y - 0.0 + yTop() - 0.03;
          await moveW(pip, v3(top.x, yLiquid + PIP_TIP, top.z), up, 0.6);
          // الشفط
          const take = topLayer.h * 0.27;
          const h0 = topLayer.h;
          pip.userData.fill.visible = true;
          await anim(0.8, k => { topLayer.h = h0 - take * k; setLayers(t, t.layers); pip.userData.fill.scale.y = Math.max(0.05, k); pip.position.y = top.y + yTop() - 0.03 + PIP_TIP; });
          await moveW(pip, pip.position.clone().add(v3(0, 0.8, 0)), up, 0.4);
          const a = aliq[i], aw = a.g.getWorldPosition(v3(0, 0, 0));
          await moveW(pip, aw.clone().add(v3(0, 0.75, 0)), up, 0.7);
          await moveW(pip, aw.clone().add(v3(0, 0.12 + PIP_TIP, 0)), up, 0.4);
          a.fill.visible = true;
          await anim(0.7, k => { a.fill.scale.y = Math.max(0.001, k); a.fill.position.y = -0.02 + 0.08 * k; pip.userData.fill.scale.y = Math.max(0.01, 1 - k); });
          pip.userData.fill.visible = false;
          await moveW(pip, aw.clone().add(v3(0, 0.8, 0)), up, 0.4);
        }
        await moveW(pip, pipHome.p, pipHome.q, 0.9);
        await anim(0.4, k => t.cap.position.set(0, 0.69 + TO + 0.3 * (1 - k), 0.25 * (1 - k)));
        api.ro('state', '3 أجزاء معنونة');
      },
      async store(kind) {
        await camTo([-2.2, 2.3, 2.3], [-2.6, 0.3, -0.4], 0.9);
        setBox(kind);
        for (let i = 0; i < 3; i++) {
          const a = aliq[i]; root.attach(a.g);
          const dst = box.localToWorld(v3(-0.25 + i * 0.25, 0.37, 0));
          await moveW(a.g, a.g.position.clone().add(v3(0, 0.6, 0)), null, 0.35);
          await moveW(a.g, dst.clone().add(v3(0, 0.6, 0)), null, 0.6);
          await moveW(a.g, dst, null, 0.35);
        }
        if (kind === 'freezer') await anim(1.2, k => (frost.material.opacity = 0.85 * k));
        api.ro('state', kind === 'freezer' ? 'مجمّدة −20 °C' : 'ثلاجة 2–8 °C');
      }
    };

    V.frame = dt => {
      for (let i = tweens.length - 1; i >= 0; i--) {
        const tw = tweens[i]; tw.t += dt / tw.dur; const k = Math.min(1, tw.t); tw.fn(k);
        if (k >= 1) { tweens.splice(i, 1); tw.res(); }
      }
      spin += (spinTarget * 22 - spin) * Math.min(1, dt * 1.5);
      rotor.rotation.y += spin * dt;
      if (frost.material.opacity > 0) frost.rotation.y += dt * 0.2;
    };
    Object.assign(api.scene, { ready: true, A, reset: resetBench, V });
    V.loading(false);
    api.onReady();
  }
  function numTex(n) {
    const THREE = T(), c = document.createElement('canvas'); c.width = 64; c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(32, 32, 30, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#1b2733'; x.font = '700 40px "IBM Plex Mono", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), 32, 35);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }

  /* ---------- الخطوات ---------- */
  const MIX = { t: 'اخلط الدم بمانع التخثر', x: 'الدم في أنبوب يحتوي على مانع التخثر <b>EDTA</b> (الغطاء البنفسجي). اقلب الأنبوب <b>برفق عدة مرات</b> ليختلط الدم بمانع التخثر جيداً فلا يتجلط. لا نرجّه بقوة.', btn: [['اقلب الأنبوب برفق', 'invert']], ok: 'اختلط الدم بمانع التخثر وبقي سائلاً.' };
  const LOAD = { t: 'ضع الأنبوب في جهاز الطرد المركزي', x: 'افتح الغطاء وضع الأنبوب في مكانه في الدوّار. ماذا تضع في الجهة المقابلة؟', btn: [['أنبوب موازنة بالوزن نفسه', 'load'], ['لا شيء، شغّله هكذا', 'noBal']], ok: 'وضعنا مقابله أنبوباً فيه ماء بالحجم نفسه، فالجهاز متوازن.' };
  const SPIN = { t: 'شغّل جهاز الطرد المركزي', x: 'أغلق الغطاء وشغّل الجهاز. الدوران السريع يولّد قوة طاردة <b>تُرسّب المكونات الأثقل في قاع الأنبوب</b>.', btn: [['شغّل الجهاز', 'spin']], note: 'السرعة والوقت المعروضان مثال شائع' };
  const STORE = { t: '', x: '', btn: [['2–8 °C', 'fridge'], ['−20 °C أو أقل', 'freezer']] };
  const MODES = {
    whole: { tube: 'أنبوب EDTA (بنفسجي)', steps: [
      MIX,
      { t: 'العينة جاهزة: دم كامل', x: 'هذا هو <b>الدم الكامل</b> (Whole blood): الدم كما هو بكل مكوناته دون فصل. يُستخدم في فحوصات <b>CBC</b> صورة الدم الكاملة، و<b>ESR</b> سرعة ترسيب كريات الدم الحمر، و<b>HbA1c</b> السكر التراكمي.', final: true }
    ] },
    plasma: { tube: 'أنبوب EDTA (بنفسجي)', steps: [
      MIX, LOAD, SPIN,
      { t: 'ثلاث طبقات', x: 'بعد الطرد المركزي يظهر في الأنبوب: <b>كريات الدم الحمر</b> في الأسفل (≈ 45% وتسمى الهيماتوكريت)، فوقها <b>طبقة رقيقة بيضاء</b> (Buffy coat) من كريات الدم البيض والصفيحات، وفي الأعلى <b>البلازما</b> بلون أصفر باهت (≈ 55%) وفيها الألبومين والكلوبيولين والفايبرينوجين والأملاح.', btn: [['اسحب البلازما بالماصة الدقيقة', 'pipette']] },
      Object.assign({}, STORE, { t: 'احفظ البلازما', x: 'نقلنا البلازما بالماصة الدقيقة إلى <b>أنابيب نظيفة معنونة</b>، دون الاقتراب من الطبقة البيضاء. اختر درجة الحفظ:' }),
      { t: 'البلازما محفوظة', final: true }
    ] },
    serum: { tube: 'أنبوب بلا مانع تخثر (أحمر)', steps: [
      { t: 'اترك الدم يتجلط', x: 'الدم في أنبوب <b>لا يحتوي على مانع تخثر</b>. ماذا تفعل الآن؟', btn: [['اتركه واقفاً 20–30 دقيقة', 'clot'], ['رجّه جيداً', 'shake']], ok: 'تجلط الدم: تكوّنت خثرة وبدأ المصل يظهر فوقها.' },
      LOAD, SPIN,
      { t: 'طبقتان', x: 'بعد الطرد المركزي تظهر <b>الخثرة</b> في الأسفل، وفوقها <b>المصل</b>: سائل أصفر فاتح. لا توجد طبقة بيضاء لأن الخلايا محبوسة داخل الخثرة.', btn: [['اسحب المصل بالماصة الدقيقة', 'pipette']] },
      Object.assign({}, STORE, { t: 'احفظ المصل', x: 'نقلنا المصل بالماصة الدقيقة إلى <b>أنابيب نظيفة معنونة</b>. اختر درجة الحفظ:' }),
      { t: 'المصل محفوظ', final: true }
    ] }
  };
  const api = { scene: {}, onReady: () => {} };
  let el = {}, st = { kind: 'whole', i: 0, busy: false, store: '' };
  const RO = {};
  api.ro = (k, v) => { if (RO.set) RO.set(k, v); };
  function msg(h, kind) { el.msg.hidden = !h; el.msg.innerHTML = h || ''; el.msg.className = 'status' + (kind ? ' ' + kind : ''); }
  function render() {
    const m = MODES[st.kind], s = m.steps[st.i];
    el.n.textContent = s.final ? 'اكتملت' : `الخطوة ${st.i + 1} من ${m.steps.length - 1}`;
    el.tube.textContent = m.tube;
    el.title.textContent = s.t;
    let x = s.x || '';
    if (s.final && st.kind !== 'whole') x = (st.store === 'freezer' ? 'حُفظت في <b>−20 °C أو أقل</b> للحفظ <b>طويل الأمد</b>. ' : 'حُفظت في الثلاجة بين <b>2 و8 °C</b> للحفظ <b>قصير الأمد</b>. ') + 'قسّمناها إلى أجزاء صغيرة قبل الحفظ حتى لا نكرر التجميد والإذابة، لأن ذلك يغيّر خصائص البروتينات والإنزيمات. وعند الاستعمال تُذاب العينة المجمّدة <b>تدريجياً</b> وتُمزج <b>بلطف</b>.';
    el.text.innerHTML = x + (s.note ? ` <span class="u-note">للفهم</span> <small class="muted">${s.note}</small>` : '');
    el.ctl.innerHTML = '';
    (s.btn || []).forEach(([label, act], j) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (s.btn.length === 1 ? ' primary' : ''); b.textContent = label;
      b.addEventListener('click', () => act_(act)); el.ctl.appendChild(b);
    });
    if (s.final) {
      const nx = { whole: ['plasma', 'حضّر البلازما'], plasma: ['serum', 'حضّر المصل'], serum: ['whole', 'الدم الكامل'] }[st.kind];
      el.ctl.innerHTML = `<button type="button" class="btn primary" data-k="${nx[0]}">${nx[1]}</button> <button type="button" class="btn" data-again>أعد</button>`;
      el.ctl.querySelector('[data-k]').addEventListener('click', () => setKind(nx[0]));
      el.ctl.querySelector('[data-again]').addEventListener('click', () => setKind(st.kind));
    }
    el.steps.innerHTML = m.steps.filter(z => !z.final).map((z, i) => `<li class="${i < st.i ? 'done' : i === st.i ? 'now' : ''}">${z.t}</li>`).join('');
  }
  function act_(a) {
    if (st.busy || !api.scene.A) return;
    const S = api.scene, s = MODES[st.kind].steps[st.i];
    if (a === 'noBal') return msg('<b>خطأ خطير!</b> الجهاز غير المتوازن يهتز بقوة وقد يتلف أو تنكسر الأنابيب. ضع دائماً مقابل العينة أنبوباً بالوزن نفسه. <span class="u-note">للفهم</span>', 'warn');
    const fn = { invert: () => S.A.invert(), shake: () => S.A.shake(), clot: () => S.A.clot(), load: () => S.A.load(), spin: () => S.A.spin(), pipette: () => S.A.pipette(), fridge: () => S.A.store('fridge'), freezer: () => S.A.store('freezer') }[a];
    st.busy = true; el.card.classList.add('busy'); el.ctl.querySelectorAll('button').forEach(b => (b.disabled = true));
    Promise.resolve(fn()).then(() => {
      st.busy = false; el.card.classList.remove('busy');
      if (a === 'shake') { msg('<b>لا ترجّ أنبوب المصل!</b> الرجّ يكسر كريات الدم الحمر (تحلل الدم Hemolysis)، فيخرج الهيموكلوبين ويصبح المصل وردياً أو أحمر وتفسد النتائج. اتركه واقفاً ليتجلط.', 'warn'); render(); return; }
      if (a === 'fridge' || a === 'freezer') st.store = a;
      msg(s.ok || '', s.ok ? 'ok' : '');
      st.i++; render();
    }).catch(e => { console.error(e); st.busy = false; el.card.classList.remove('busy'); render(); });
  }
  function setKind(k) {
    st.kind = k; st.i = 0; st.busy = false; st.store = '';
    if (el.setSeg) el.setSeg(k, false);
    msg('', '');
    if (RO.set) { RO.set('rpm', '0'); RO.set('time', '—'); RO.set('state', { whole: 'دم كامل', plasma: 'دم + EDTA', serum: 'دم بلا مانع تخثر' }[k]); }
    if (api.scene.reset) api.scene.reset(k);
    render();
  }

  lab.ready.push(() => {
    el = { card: $('.bench-card'), n: $('#bnN'), tube: $('#bnTube'), title: $('#bnTitle'), text: $('#bnText'), ctl: $('#bnCtl'), msg: $('#bnMsg'), steps: $('#bnSteps') };
    if (!el.card) return;
    RO.set = lab.readout($('#benchRO'), [{ k: 'rpm', label: 'سرعة الجهاز (rpm)', cls: 'ac' }, { k: 'time', label: 'الوقت' }, { k: 'state', label: 'حالة العينة' }]);
    el.setSeg = lab.seg($('#benchMode'), v => setKind(v));
    api.onReady = () => setKind(st.kind);
    setKind('whole');
    lab.k3.lazy(document.getElementById('bench3d'), build);
  });
  lab.bench = api;
})();
