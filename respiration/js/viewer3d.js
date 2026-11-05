/* أدوات العرض ثلاثي الأبعاد المشتركة (Three.js r128):
   إضاءة واقعية (بيئة + ظلال + تدرج لوني سينمائي)، خامة نسيج حي إجرائية، وبناء سطوح عضوية من دوال المسافة */
(function () {
  'use strict';
  const lab = window.Lab;
  const T = () => window.THREE;
  const K = (lab.k3 = {});

  function webgl() {
    try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl'))); }
    catch (e) { return false; }
  }
  K.col = hex => new (T().Color)(hex).convertSRGBToLinear();
  K.rgb = hex => { const c = K.col(hex); return [c.r, c.g, c.b]; };
  K.v3 = (x, y, z) => new (T().Vector3)(x, y, z);
  K.breath = p => (p < 0.4 ? lab.ease(p / 0.4) : 1 - lab.ease((p - 0.4) / 0.6));

  /* ---------- دوال المسافة ---------- */
  const S = (K.sdf = {});
  S.ellipsoid = (x, y, z, rx, ry, rz) => {
    const k0 = Math.sqrt((x / rx) ** 2 + (y / ry) ** 2 + (z / rz) ** 2);
    const k1 = Math.sqrt((x / (rx * rx)) ** 2 + (y / (ry * ry)) ** 2 + (z / (rz * rz)) ** 2) || 1e-6;
    return (k0 * (k0 - 1)) / k1;
  };
  S.sphere = (x, y, z, r) => Math.sqrt(x * x + y * y + z * z) - r;
  S.capsule = (px, py, pz, ax, ay, az, bx, by, bz, r) => {
    const pax = px - ax, pay = py - ay, paz = pz - az, bax = bx - ax, bay = by - ay, baz = bz - az;
    const h = Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
    return Math.sqrt((pax - bax * h) ** 2 + (pay - bay * h) ** 2 + (paz - baz * h) ** 2) - r;
  };
  S.smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  S.smax = (a, b, k) => -S.smin(-a, -b, k);
  S.ss = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

  /* ---------- سطح من دالة مسافة (Surface Nets) ---------- */
  K.surfaceNets = function (sdf, bmin, bmax, step, opt) {
    const THREE = T();
    const nx = Math.ceil((bmax[0] - bmin[0]) / step) + 1, ny = Math.ceil((bmax[1] - bmin[1]) / step) + 1, nz = Math.ceil((bmax[2] - bmin[2]) / step) + 1;
    const F = new Float32Array(nx * ny * nz);
    let q = 0;
    const cf = (opt && opt.coarse) || 0;
    if (cf > 1) {
      // شبكة خشنة أولاً، ثم لا تُحسب الدالة بدقة إلا قرب السطح
      const cs = step * cf, mx = Math.ceil((nx - 1) / cf) + 1, my = Math.ceil((ny - 1) / cf) + 1, mz = Math.ceil((nz - 1) / cf) + 1;
      const Fc = new Float32Array(mx * my * mz);
      let r = 0;
      for (let k = 0; k < mz; k++) for (let j = 0; j < my; j++) for (let i = 0; i < mx; i++) Fc[r++] = sdf(bmin[0] + i * cs, bmin[1] + j * cs, bmin[2] + k * cs);
      const band = cs * 1.9;
      for (let k = 0; k < nz; k++) {
        const z = bmin[2] + k * step, ck = Math.round(k / cf);
        for (let j = 0; j < ny; j++) {
          const y = bmin[1] + j * step, cj = Math.round(j / cf);
          for (let i = 0; i < nx; i++) {
            const dc = Fc[Math.round(i / cf) + mx * (cj + my * ck)];
            F[q++] = Math.abs(dc) > band ? dc : sdf(bmin[0] + i * step, y, z);
          }
        }
      }
    } else {
      for (let k = 0; k < nz; k++) {
        const z = bmin[2] + k * step;
        for (let j = 0; j < ny; j++) {
          const y = bmin[1] + j * step;
          for (let i = 0; i < nx; i++) F[q++] = sdf(bmin[0] + i * step, y, z);
        }
      }
    }
    const id = (i, j, k) => i + nx * (j + ny * k);
    const cx = nx - 1, cy = ny - 1, cz = nz - 1;
    const cell = new Int32Array(cx * cy * cz).fill(-1);
    const CO = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
    const ED = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    const v = new Float32Array(8), pos = [];
    let vc = 0;
    for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
      let mask = 0;
      for (let c = 0; c < 8; c++) { v[c] = F[id(i + CO[c][0], j + CO[c][1], k + CO[c][2])]; if (v[c] < 0) mask |= 1 << c; }
      if (mask === 0 || mask === 255) continue;
      let sx = 0, sy = 0, sz = 0, n = 0;
      for (let e = 0; e < 12; e++) {
        const a = ED[e][0], b = ED[e][1];
        if ((v[a] < 0) === (v[b] < 0)) continue;
        const t = v[a] / (v[a] - v[b]);
        sx += CO[a][0] + t * (CO[b][0] - CO[a][0]); sy += CO[a][1] + t * (CO[b][1] - CO[a][1]); sz += CO[a][2] + t * (CO[b][2] - CO[a][2]); n++;
      }
      pos.push(bmin[0] + (i + sx / n) * step, bmin[1] + (j + sy / n) * step, bmin[2] + (k + sz / n) * step);
      cell[i + cx * (j + cy * k)] = vc++;
    }
    const C = (i, j, k) => cell[i + cx * (j + cy * k)];
    const ind = [];
    const quad = (a, b, c, d, inside, ax) => {
      if (a < 0 || b < 0 || c < 0 || d < 0) return;
      // اتجاه الوجه: يخرج من الداخل إلى الخارج
      const ux = pos[b * 3] - pos[a * 3], uy = pos[b * 3 + 1] - pos[a * 3 + 1], uz = pos[b * 3 + 2] - pos[a * 3 + 2];
      const wx = pos[c * 3] - pos[a * 3], wy = pos[c * 3 + 1] - pos[a * 3 + 1], wz = pos[c * 3 + 2] - pos[a * 3 + 2];
      const nn = ax === 0 ? uy * wz - uz * wy : ax === 1 ? uz * wx - ux * wz : ux * wy - uy * wx;
      if ((nn > 0) === inside) ind.push(a, b, c, a, c, d); else ind.push(a, c, b, a, d, c);
    };
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = F[id(i, j, k)] < 0;
      if (i < cx && j > 0 && k > 0 && j < ny && k < nz && (F[id(i + 1, j, k)] < 0) !== a) quad(C(i, j - 1, k - 1), C(i, j, k - 1), C(i, j, k), C(i, j - 1, k), a, 0);
      if (j < cy && i > 0 && k > 0 && (F[id(i, j + 1, k)] < 0) !== a) quad(C(i - 1, j, k - 1), C(i - 1, j, k), C(i, j, k), C(i, j, k - 1), a, 1);
      if (k < cz && i > 0 && j > 0 && (F[id(i, j, k + 1)] < 0) !== a) quad(C(i - 1, j - 1, k), C(i, j - 1, k), C(i, j, k), C(i - 1, j, k), a, 2);
    }
    // تنعيم خفيف للسطح ثم حساب الاتجاهات من تدرج الدالة
    const P = new Float32Array(pos);
    const smooth = opt && opt.smooth !== undefined ? opt.smooth : 1;
    if (smooth) {
      const nb = Array.from({ length: vc }, () => []);
      for (let t = 0; t < ind.length; t += 3) { const a = ind[t], b = ind[t + 1], c = ind[t + 2]; nb[a].push(b, c); nb[b].push(a, c); nb[c].push(a, b); }
      for (let it = 0; it < smooth; it++) {
        const Q = P.slice();
        for (let vI = 0; vI < vc; vI++) {
          const L = nb[vI]; if (!L.length) continue;
          let x = 0, y = 0, z = 0; for (const u of L) { x += Q[u * 3]; y += Q[u * 3 + 1]; z += Q[u * 3 + 2]; }
          const m = 0.5 / L.length; P[vI * 3] = Q[vI * 3] * 0.5 + x * m; P[vI * 3 + 1] = Q[vI * 3 + 1] * 0.5 + y * m; P[vI * 3 + 2] = Q[vI * 3 + 2] * 0.5 + z * m;
        }
      }
    }
    const N = new Float32Array(vc * 3), h = step * 0.5;
    for (let vI = 0; vI < vc; vI++) {
      const x = P[vI * 3], y = P[vI * 3 + 1], z = P[vI * 3 + 2];
      let gx = sdf(x + h, y, z) - sdf(x - h, y, z), gy = sdf(x, y + h, z) - sdf(x, y - h, z), gz = sdf(x, y, z + h) - sdf(x, y, z - h);
      const l = Math.hypot(gx, gy, gz) || 1; N[vI * 3] = gx / l; N[vI * 3 + 1] = gy / l; N[vI * 3 + 2] = gz / l;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    g.setIndex(vc > 65535 ? new THREE.Uint32BufferAttribute(ind, 1) : new THREE.Uint16BufferAttribute(ind, 1));
    g.computeBoundingSphere();
    return g;
  };

  /* ---------- دمج أشكال ---------- */
  K.merge = function (list) {
    const THREE = T();
    let vc = 0, ic = 0;
    const hasCol = list.some(g => g.attributes.color);
    list.forEach(g => { vc += g.attributes.position.count; ic += g.index ? g.index.count : g.attributes.position.count; });
    const pos = new Float32Array(vc * 3), nor = new Float32Array(vc * 3), col = hasCol ? new Float32Array(vc * 3) : null, idx = new Uint32Array(ic);
    let vo = 0, io = 0;
    list.forEach(g => {
      if (!g.attributes.normal) g.computeVertexNormals();
      const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color;
      pos.set(p.array, vo * 3); nor.set(n.array, vo * 3);
      if (col) { if (c) col.set(c.array, vo * 3); else col.fill(1, vo * 3, (vo + p.count) * 3); }
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
    out.computeBoundingSphere();
    return out;
  };
  /* أنبوب يضيق من بدايته إلى نهايته، مع لون متدرج اختياري */
  K.tube = function (curve, seg, r0, r1, radial, c0, c1) {
    const THREE = T();
    const g = new THREE.TubeGeometry(curve, seg, 1, radial || 10, false);
    const p = g.attributes.position, n = g.attributes.normal;
    const frames = curve.computeFrenetFrames(seg, false);
    const col = c0 ? new Float32Array(p.count * 3) : null;
    for (let i = 0; i <= seg; i++) {
      const t = i / seg, r = r0 + (r1 - r0) * t, c = curve.getPointAt(t);
      for (let j = 0; j <= (radial || 10); j++) {
        const k = i * ((radial || 10) + 1) + j;
        p.setXYZ(k, c.x + n.getX(k) * r, c.y + n.getY(k) * r, c.z + n.getZ(k) * r);
        if (col) { col[k * 3] = c0[0] + (c1[0] - c0[0]) * t; col[k * 3 + 1] = c0[1] + (c1[1] - c0[1]) * t; col[k * 3 + 2] = c0[2] + (c1[2] - c0[2]) * t; }
      }
    }
    if (col) g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    void frames;
    return g;
  };
  K.cap = function (pt, r, c) {
    const THREE = T();
    const g = new THREE.SphereGeometry(r, 10, 8);
    g.translate(pt.x, pt.y, pt.z);
    if (c) { const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set(c, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
    return g;
  };

  /* ---------- خامة النسيج الحي الإجرائية ---------- */
  const GLSL_NOISE = `
  vec3 k3h(vec3 p){ p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6))); return fract(sin(p)*43758.5453123); }
  float k3n(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(k3h(i).x,k3h(i+vec3(1.,0.,0.)).x,f.x),mix(k3h(i+vec3(0.,1.,0.)).x,k3h(i+vec3(1.,1.,0.)).x,f.x),f.y),
               mix(mix(k3h(i+vec3(0.,0.,1.)).x,k3h(i+vec3(1.,0.,1.)).x,f.x),mix(k3h(i+vec3(0.,1.,1.)).x,k3h(i+vec3(1.,1.,1.)).x,f.x),f.y),f.z); }
  float k3f(vec3 p){ float a=0.5,s=0.0; for(int i=0;i<4;i++){ s+=a*k3n(p); p=p*2.03+vec3(17.1,9.2,4.7); a*=0.5; } return s; }
  vec2 k3w(vec3 p){ vec3 i=floor(p), f=fract(p); float d1=9.0, d2=9.0;
    for(int x=-1;x<=1;x++) for(int y=-1;y<=1;y++) for(int z=-1;z<=1;z++){ vec3 g=vec3(float(x),float(y),float(z)); vec3 r=g+k3h(i+g)-f; float d=dot(r,r); if(d<d1){ d2=d1; d1=d; } else if(d<d2){ d2=d; } }
    return vec2(sqrt(d1), sqrt(d2)); }`;

  K.tissue = function (o) {
    const THREE = T();
    o = o || {};
    const m = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: o.roughness !== undefined ? o.roughness : 0.5, metalness: 0,
      clearcoat: o.clearcoat !== undefined ? o.clearcoat : 0.55, clearcoatRoughness: o.ccr !== undefined ? o.ccr : 0.28,
      transparent: !!o.transparent, opacity: o.opacity !== undefined ? o.opacity : 1, side: o.side !== undefined ? o.side : THREE.FrontSide,
      vertexColors: !!o.vertexColors, depthWrite: o.depthWrite !== undefined ? o.depthWrite : true,
      envMapIntensity: o.env !== undefined ? o.env : 0.7
    });
    const U = {
      uA: { value: K.col(o.a || 0xe8a3a3) }, uB: { value: K.col(o.b || o.a || 0xd88a8f) }, uEdge: { value: K.col(o.edge || 0x9c5866) },
      uSpeck: { value: K.col(o.speck || 0x2f2a33) }, uCell: { value: o.cell || 6 }, uNoise: { value: o.noise || 3 },
      uBump: { value: o.bump !== undefined ? o.bump : 0.012 }, uEdgeW: { value: o.edgeW || 0.08 }, uEdgeAmt: { value: o.edgeAmt !== undefined ? o.edgeAmt : 0.5 },
      uSpeckAmt: { value: o.speckAmt || 0 }, uFiber: { value: o.fiber || 0 }, uFiberDir: { value: o.fiberDir || new THREE.Vector3(0, 1, 0) },
      uRim: { value: K.col(o.rim || 0xff9a9a) }, uRimAmt: { value: o.rimAmt !== undefined ? o.rimAmt : 0.3 },
      uSel: { value: -1 }, uSelCol: { value: K.col(o.selCol || 0xffd27a) }, uGlow: { value: 0 },
      uF1: { value: new THREE.Vector4(0, 0, 0, 0) }, uF2: { value: new THREE.Vector4(0, 0, 0, 0) }, uF2Side: { value: 0 }, uFissW: { value: o.fissW || 0.03 }
    };
    m.userData.u = U;
    m.extensions = { derivatives: true };
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;\nattribute float lobe;\nvarying float vLobe;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjPos = position;\nvLobe = lobe;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
varying vec3 vObjPos; varying float vLobe;
uniform vec3 uA, uB, uEdge, uSpeck, uRim, uSelCol, uFiberDir;
uniform float uCell, uNoise, uBump, uEdgeW, uEdgeAmt, uSpeckAmt, uRimAmt, uSel, uFissW, uF2Side, uFiber, uGlow;
uniform vec4 uF1, uF2;
${GLSL_NOISE}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
  vec3 kP = vObjPos;
  float n1 = k3f(kP * uNoise);
  vec2 wv = k3w(kP * uCell + vec3(n1 * 0.9));
  float edge = 1.0 - smoothstep(0.0, uEdgeW, wv.y - wv.x);
  float fine = k3n(kP * uNoise * 7.0);
  float speck = smoothstep(0.62, 0.86, k3n(kP * uCell * 2.7 + 3.1)) * smoothstep(0.2, 0.9, edge) * uSpeckAmt;
  float fib = uFiber > 0.0 ? 0.5 + 0.5 * sin(dot(kP, uFiberDir) * 90.0 + fine * 4.0) : 0.0;
  float fiss = 0.0;
  if (dot(uF1.xyz, uF1.xyz) > 0.0) {
    float s1 = dot(kP, uF1.xyz) - uF1.w;
    float fd = abs(s1);
    if (dot(uF2.xyz, uF2.xyz) > 0.0 && (uF2Side == 0.0 || s1 * uF2Side > 0.0)) fd = min(fd, abs(dot(kP, uF2.xyz) - uF2.w));
    fiss = 1.0 - smoothstep(0.0, uFissW, fd);
  }
  vec3 base = mix(uA, uB, smoothstep(0.28, 0.75, n1));
  #ifdef USE_COLOR
    base = mix(base, vColor * mix(0.85, 1.12, n1), 0.85);
  #endif
  base = mix(base, uEdge, edge * uEdgeAmt);
  base = mix(base, uSpeck, clamp(speck, 0.0, 1.0));
  base *= 1.0 - fib * uFiber * 0.25;
  base = mix(base, base * 0.28, fiss);
  if (uSel > -0.5 && abs(vLobe - uSel) < 0.5) base = mix(base, uSelCol, 0.42);
  diffuseColor.rgb = base;
  float hgt = -edge * 0.7 + n1 * 0.55 + fine * 0.12 - fiss * 2.4 + fib * uFiber * 0.5;`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  {
    vec3 kDpx = dFdx(-vViewPosition), kDpy = dFdy(-vViewPosition);
    float kHx = dFdx(hgt) * uBump, kHy = dFdy(hgt) * uBump;
    vec3 kR1 = cross(kDpy, normal), kR2 = cross(normal, kDpx);
    float kDet = dot(kDpx, kR1);
    vec3 kGr = sign(kDet) * (kHx * kR1 + kHy * kR2);
    normal = normalize(abs(kDet) * normal - kGr);
  }`)
        .replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );', `
  float fres = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 2.4);
  outgoingLight += uRim * fres * uRimAmt + diffuseColor.rgb * uGlow;
  gl_FragColor = vec4( outgoingLight, diffuseColor.a );`);
    };
    m.customProgramCacheKey = () => 'k3tissue' + (o.vertexColors ? 'c' : '');
    return m;
  };

  /* ظل ناعم تحت المجسم */
  K.contactShadow = function (scene, y, sx, sz, op) {
    const THREE = T();
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, 'rgba(20,24,32,0.55)'); g.addColorStop(0.55, 'rgba(20,24,32,0.18)'); g.addColorStop(1, 'rgba(20,24,32,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, opacity: op || 0.6, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = y; m.renderOrder = -1;
    scene.add(m);
    return m;
  };

  /* ---------- العارض ---------- */
  function Viewer(el, o) {
    this.el = el;
    el.__v = this;
    this.ok = false;
    if (!T() || !webgl()) {
      el.insertAdjacentHTML('beforeend', '<div class="v-fallback">تعذّر تشغيل المجسم ثلاثي الأبعاد في هذا المتصفح. جرّب Chrome أو Safari حديثاً.</div>');
      return;
    }
    const THREE = T();
    this.ok = true;
    const R = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }));
    R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    R.outputEncoding = THREE.sRGBEncoding;
    R.toneMapping = THREE.ACESFilmicToneMapping;
    R.toneMappingExposure = o.exposure || 1.05;
    R.physicallyCorrectLights = false;
    if (o.shadows) { R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; }
    if (o.clip) R.localClippingEnabled = true;
    el.prepend(R.domElement);
    const S = (this.scene = new THREE.Scene());
    if (THREE.RoomEnvironment) {
      try { const pm = new THREE.PMREMGenerator(R); S.environment = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture; pm.dispose(); } catch (e) {}
    }
    this.camera = new THREE.PerspectiveCamera(o.fov || 32, 1, 0.05, 200);
    this.camera.position.set(o.cam[0], o.cam[1], o.cam[2]);
    const tg = o.target || [0, 0, 0];
    if (THREE.OrbitControls) {
      const c = (this.controls = new THREE.OrbitControls(this.camera, R.domElement));
      c.enableDamping = true; c.dampingFactor = 0.08; c.enablePan = false; c.rotateSpeed = 0.8;
      c.minDistance = o.minD || 3; c.maxDistance = o.maxD || 14;
      c.target.set(tg[0], tg[1], tg[2]);
      c.autoRotate = !lab.reduce && o.spin !== 0; c.autoRotateSpeed = o.spin || 0.6;
      let tm = 0;
      c.addEventListener('start', () => { c.autoRotate = false; clearTimeout(tm); });
      c.addEventListener('end', () => { clearTimeout(tm); tm = setTimeout(() => (c.autoRotate = !lab.reduce && o.spin !== 0), 8000); });
      R.domElement.style.touchAction = 'pan-y';
    } else this.camera.lookAt(tg[0], tg[1], tg[2]);
    // إضاءة استوديو: مفتاحية بظل، تعبئة، وحافة خلفية
    S.add(new THREE.HemisphereLight(0xfff4ec, 0x40363a, o.hemi !== undefined ? o.hemi : 0.35));
    const key = (this.key = new THREE.DirectionalLight(0xfff1e6, o.keyI || 1.55));
    key.position.set(3.5, 6, 5.5);
    if (o.shadows) {
      key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0006; key.shadow.normalBias = 0.025; key.shadow.radius = 4;
      const sc = key.shadow.camera, s = o.shadowSize || 4; sc.left = -s; sc.right = s; sc.top = s; sc.bottom = -s; sc.near = 0.5; sc.far = 25;
    }
    S.add(key);
    const rim = new THREE.DirectionalLight(0xb8ccff, o.rimI || 0.9); rim.position.set(-4, 3, -5); S.add(rim);
    const fill = new THREE.DirectionalLight(0xffe0d6, 0.35); fill.position.set(-5, -1, 3); S.add(fill);
    this.labelBox = document.createElement('div'); this.labelBox.className = 'v-labels'; el.appendChild(this.labelBox);
    this.labels = []; this.showLabels = true;
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      R.setSize(w, h, false);
      this.camera.aspect = w / h;
      if (o.fitW) { const need = o.fitW / (2 * Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.aspect); this.camera.zoom = Math.min(1, (this.camera.position.distanceTo(new THREE.Vector3(...tg)) / need)); }
      this.camera.updateProjectionMatrix();
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
      const hits = rc.intersectObjects(this.pickables, false).filter(h => h.object.visible && (!h.object.material || h.object.material.opacity > 0.25));
      this.onPick(hits[0] || null);
    });
    this.frame = null;
    this._v = new THREE.Vector3();
    lab.loop(el, (dt, t) => {
      if (this.hold || (lab.navigating && Date.now() - lab.navigating < 700)) return;
      if (this.frame) this.frame(dt, t);
      if (this.controls) this.controls.update();
      R.render(S, this.camera);
      this.updateLabels();
    });
  }
  Viewer.prototype.label = function (text, pos, obj, facing) {
    const THREE = T();
    const d = document.createElement('div');
    d.className = 'v-label'; d.textContent = text;
    this.labelBox.appendChild(d);
    const item = { el: d, pos: new THREE.Vector3(pos[0], pos[1], pos[2]), obj: obj || null, hidden: false, n: facing ? new THREE.Vector3(...facing).normalize() : null };
    this.labels.push(item);
    return item;
  };
  Viewer.prototype.updateLabels = function () {
    const w = this.el.clientWidth, h = this.el.clientHeight, v = this._v;
    this.labels.forEach(l => {
      if (!this.showLabels || l.hidden || (l.obj && !l.obj.visible)) { if (l.el.style.display !== 'none') l.el.style.display = 'none'; return; }
      v.copy(l.pos);
      if (l.obj) l.obj.localToWorld(v);
      if (l.n) {
        const cx = this.camera.position.x - v.x, cy = this.camera.position.y - v.y, cz = this.camera.position.z - v.z;
        if ((l.n.x * cx + l.n.y * cy + l.n.z * cz) / (Math.hypot(cx, cy, cz) || 1) < -0.05) { if (l.el.style.display !== 'none') l.el.style.display = 'none'; return; }
      }
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
        it.cb(on, b);
      });
      it.btn = b;
      bar.appendChild(b);
    });
    this.el.appendChild(bar);
    return bar;
  };
  Viewer.prototype.badge = function () { const b = document.createElement('div'); b.className = 'v-badge'; this.el.appendChild(b); return b; };
  Viewer.prototype.info = function () { const b = document.createElement('div'); b.className = 'v-info'; b.hidden = true; this.el.appendChild(b); return b; };
  Viewer.prototype.loading = function (on) {
    this.hold = !!on && !this._built;
    if (!on) this._built = true;
    if (on) { if (!this._ld) { this._ld = document.createElement('div'); this._ld.className = 'v-loading'; this._ld.textContent = 'جارٍ بناء المجسم…'; this.el.appendChild(this._ld); } }
    else if (this._ld) { this._ld.remove(); this._ld = null; }
  };
  K.Viewer = Viewer;

  /* بناء مؤجل: لا يُبنى المجسم إلا عند اقتراب القسم من الشاشة */
  K.lazy = function (el, build) {
    if (!el) return;
    let done = false;
    const go = () => { if (done) return; done = true; setTimeout(async () => { const t0 = performance.now(); try { await build(el); } catch (e) { console.error(e); } if (window.__k3debug) console.info('k3 build ' + el.id + ' ' + Math.round(performance.now() - t0) + 'ms'); }, 30); };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); go(); } }, { rootMargin: '700px 0px' });
      io.observe(el);
    } else go();
  };
})();
