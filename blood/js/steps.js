/* محرك خطوات المختبر العملي: صندوق الأدوات، بطاقة الخطوة، التغذية الراجعة والمساعدة */
(function () {
  'use strict';
  const lab = window.Lab, $ = lab.$;
  const api = lab.bloodLab;

  const ICON = {
    tourniquet: '<path d="M4 16c0-5 4-8 10-8s10 3 10 8-4 8-10 8S4 21 4 16z" fill="none" stroke="currentColor" stroke-width="3.2"/><path d="M17 8l5-4" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    alcohol: '<rect x="8" y="9" width="12" height="17" rx="3" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M11 9V5h6v4" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M9 17h10" stroke="currentColor" stroke-width="2"/><text x="14" y="23.5" text-anchor="middle" font-size="5.5" font-weight="700" fill="currentColor">70%</text>',
    cotton: '<path d="M7 20a5 5 0 0 1 2-9 6 6 0 0 1 11 0 5 5 0 0 1 1 9z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
    syringe: '<path d="M3 25l4-4M7 21l3 3M9 19l9-9 4 4-9 9zM16 8l6 6M20 6l4 4M22 4l4 4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 16l3-3" stroke="currentColor" stroke-width="1.6"/>',
    tubes: '<rect x="6" y="4" width="6" height="5" rx="1" fill="#d8343c"/><rect x="16" y="4" width="6" height="5" rx="1" fill="#8a5bd6"/><path d="M7 9v13a2 2 0 0 0 4 0V9M17 9v13a2 2 0 0 0 4 0V9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7.5 17h3v5a1.5 1.5 0 0 1-3 0zM17.5 15h3v7a1.5 1.5 0 0 1-3 0z" fill="#a51d2d"/>',
    sharps: '<rect x="5" y="10" width="18" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M4 10h20M12 7h4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="14" cy="17.5" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    lancet: '<rect x="9" y="3" width="10" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M11 18h6v3h-6zM14 21v5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
    captube: '<path d="M5 22L22 5" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity=".35"/><path d="M5 22l7-7" stroke="#a51d2d" stroke-width="2.6" stroke-linecap="round"/><path d="M19 8l3-3" stroke="#d8343c" stroke-width="4" stroke-linecap="round"/>'
  };
  const TOOLS = [
    ['tourniquet', 'الرباط الضاغط'], ['alcohol', 'كحول 70%'], ['cotton', 'قطن جاف'], ['syringe', 'الحقنة'],
    ['tubes', 'الأنابيب'], ['sharps', 'حاوية الإبر'], ['lancet', 'الواخزة'], ['captube', 'أنبوب شعري']
  ];
  const TNAME = Object.fromEntries(TOOLS);
  const ORDER = {
    tourniquet: 'الرباط يُربط في البداية لإظهار الوريد، ويُفك قبل إخراج الإبرة.',
    alcohol: 'الكحول للتعقيم: بعد اختيار المكان وقبل الوخز.',
    cotton: 'القطن الجاف يُستعمل في النهاية: للضغط على المكان بعد إخراج الإبرة.',
    syringe: 'الحقنة تأتي بعد ربط الرباط واختيار الوريد وتعقيمه.',
    tubes: 'الأنابيب بعد أن تسحب الدم وتخرج الإبرة.',
    sharps: 'حاوية الإبر في النهاية للتخلص من الإبرة.',
    lancet: 'الواخزة للدم الشعيري من رأس الإصبع، لا للسحب الوريدي.',
    captube: 'الأنبوب الشعري يجمع قطرات الدم من الإصبع بعد الوخز.'
  };
  const WHERE = {
    upperArm: 'العضد، أعلى المرفق بنحو 7–10 سم',
    site: 'مكان السحب على الوريد المرفقي الأوسط',
    mcub: 'الوريد المرفقي الأوسط في باطن المرفق',
    finger: 'جانب رأس الإصبع الذي اخترته',
    drop: 'قطرة الدم على رأس الإصبع'
  };

  let S = null; // واجهة المشهد
  const st = { mode: 'vein', i: 0, busy: false, help: 0, sel: null, angle: 45, done: false, tubes: { plain: 0, edta: 0 } };

  /* ---------- الخطوات ---------- */
  const VEIN = [
    { t: 'التحضير والتعريف', x: 'تأكد من هوية المريض واشرح له ما ستفعل. اغسل يديك والبس القفازات، واجعل الذراع ممدودة على المسند والكف للأعلى، وجهّز الأدوات على الطاولة.', ui: 'go', go: 'جهّزت كل شيء' },
    { t: 'اربط الرباط الضاغط', x: 'اختر <b>الرباط الضاغط</b> ثم اضغط على مكان ربطه في الذراع. الرباط يمنع رجوع الدم في الأوردة نحو القلب فتنتفخ وتظهر بوضوح. لا يُترك مربوطاً أكثر من دقيقة.', tool: 'tourniquet', target: 'upperArm', run: () => S.A.tourniquet(),
      wrong: c => (c.forearm || c.elbow || c.hand ? 'لا يُربط على الساعد أو المرفق: اربطه على <b>العضد</b> أعلى المرفق بنحو 7–10 سم (عرض 4 أصابع).' : null),
      ok: 'الأوردة انتفخت تحت الجلد. لاحظ بروزها ولونها المزرق.' },
    { t: 'اقبض اليد', x: 'اطلب من المريض أن يقبض يده بثبات، دون فتح وغلق متكرر. انقباض عضلات الساعد يدفع الدم إلى الأوردة فتصبح أوضح.', ui: 'go', go: 'اطلب قبض اليد', target: 'hand', run: () => S.A.fist(), ok: 'اليد مقبوضة والأوردة أوضح الآن.' },
    { t: 'اختر الوريد', x: 'تحسّس باطن المرفق (الحفرة المرفقية) واضغط على <b>الوريد الأنسب</b> للسحب.', target: 'mcub', run: () => S.A.palpate(),
      wrong: c => c.vein === 'ceph' ? '<b>الوريد الرأسي</b> (جهة الإبهام): بديل جيد إذا لم يظهر المرفقي الأوسط، لكنه ليس الخيار الأول.'
        : c.vein === 'bas' ? '<b>الوريد القاعدي</b> (جهة الخنصر): آخر خيار، لأنه قريب من الشريان العضدي والعصب الأوسط ويتحرك تحت الجلد.'
        : c.vein === 'mant' ? 'هذا وريد صغير في الساعد. ابحث في <b>باطن المرفق</b> عن وريد أكبر وأثبت.'
        : c.upperArm ? 'لا نسحب من العضد. ابحث في <b>باطن المرفق</b>.' : null,
      ok: 'اخترت <b>الوريد المرفقي الأوسط</b>: كبير وثابت لا يتحرك، وبعيد عن الأعصاب والشرايين، فالسحب منه أقل ألماً وأكثر أماناً.' },
    { t: 'عقّم مكان السحب', x: 'اختر <b>الكحول 70%</b> ثم اضغط على مكان السحب. امسح بحركة دائرية من المركز إلى الخارج، واتركه يجف نحو 30 ثانية، ولا تلمس المكان بعد التعقيم.', tool: 'alcohol', target: 'site', run: () => S.A.swab(),
      wrong: () => 'عقّم <b>مكان السحب</b> نفسه على الوريد الذي اخترته.', ok: 'جفّ الكحول. الجلد جاهز للوخز.' },
    { t: 'جهّز الحقنة', x: 'اختر <b>الحقنة</b>: افحص الإبرة وانزع غطاءها، واجعل الفتحة المائلة للإبرة (Bevel) إلى الأعلى.', tool: 'syringe', run: () => S.A.uncap(st.angle), ok: 'الإبرة جاهزة فوق الوريد. الآن اضبط الزاوية.' },
    { t: 'زاوية الإدخال', x: 'ثبّت الوريد بسحب الجلد أسفل المكان بإبهامك، ثم اضبط <b>الزاوية بين الإبرة والجلد</b> وأدخل الإبرة باتجاه الوريد نحو القلب.', ui: 'angle' },
    { t: 'اسحب الدم ببطء', x: 'ظهر الدم في قاعدة الإبرة (Flashback): أنت داخل الوريد. اسحب المكبس <b>ببطء</b> حتى 5 مل. السحب السريع يكسر كريات الدم الحمر (تحلل الدم) وقد ينخمص الوريد.', ui: 'draw' },
    { t: 'فك الرباط', x: 'امتلأت الحقنة. <b>قبل إخراج الإبرة</b>: فك الرباط الضاغط واطلب من المريض فتح يده.', tool: 'tourniquet', run: () => S.A.release(),
      wrongTool: { cotton: '<b>فك الرباط أولاً!</b> إخراج الإبرة والرباط مربوط يجعل الدم المحتبس يندفع من الثقب فيتكوّن ورم دموي (كدمة) تحت الجلد.' }, ok: 'الرباط مفكوك واليد مفتوحة. الأوردة رجعت لحجمها.' },
    { t: 'أخرج الإبرة واضغط', x: 'اختر <b>القطن الجاف</b> وضعه على المكان، ثم أخرج الإبرة بحركة واحدة واضغط 2–3 دقائق والذراع ممدودة. لا تثنِ المرفق.', tool: 'cotton', target: 'site', run: () => S.A.withdraw(),
      wrong: () => 'ضع القطن على <b>مكان دخول الإبرة</b>.', ok: 'توقف النزف ووضعنا لاصقاً طبياً.' },
    { t: 'انقل الدم إلى الأنابيب', x: 'انزع غطاء الأنبوب ودع الدم ينساب على جداره ببطء دون ضغط قوي على المكبس. املأ <b>الأنبوبين</b>:', ui: 'tubes' },
    { t: 'تخلّص من الإبرة', x: 'ضع الحقنة مع الإبرة مباشرة في <b>حاوية الأدوات الحادة</b>، ولا تُعد الغطاء على الإبرة بيدك (خطر وخز نفسك). ثم اكتب على كل أنبوب: الاسم، التاريخ، الوقت.', tool: 'sharps', run: () => S.A.dispose() }
  ];
  const CAP = [
    { t: 'التحضير', x: 'نأخذ الدم الشعيري عندما نحتاج كمية قليلة، مثل قياس الهيموكلوبين وعدّ كريات الدم الحمر والبيض والصفيحات. دفّئ اليد ودلّكها بلطف ليزيد تدفق الدم إلى الأصابع.', ui: 'go', go: 'ابدأ' },
    { t: 'اختر الإصبع', x: 'اضغط على <b>رأس الإصبع الأنسب</b> للوخز في اليد.', target: 'finger', pick: true,
      wrong: c => c.finger === 'thumb' ? '<b>الإبهام</b>: جلده أسمك وفيه نبض شرياني، فلا يُفضّل.'
        : c.finger === 'index' ? '<b>السبابة</b>: أكثر الأصابع إحساساً بالألم وجلدها أسمك من كثرة الاستعمال.'
        : c.finger === 'little' ? '<b>الخنصر</b>: نسيجه رقيق والعظم قريب من الجلد.'
        : 'اضغط على رأس أحد <b>الأصابع</b>.',
      ok: 'اخترت الإصبع المناسب. الوسطى والبنصر هما الأفضل.' },
    { t: 'عقّم رأس الإصبع', x: 'اختر <b>الكحول</b> ثم اضغط على رأس الإصبع. اتركه يجف تماماً: بقايا الكحول تحلل الكريات وتمنع تكوّن قطرة مستديرة.', tool: 'alcohol', target: 'finger', run: () => S.A.swabFinger(), ok: 'المكان نظيف وجاف.' },
    { t: 'اوخز الإصبع', x: 'اختر <b>الواخزة المعقمة</b> (لانسيت) واوخز جانب وسادة رأس الإصبع بحركة سريعة واحدة.', tool: 'lancet', target: 'finger', run: () => S.A.prick(), ok: 'تكوّنت قطرة دم. الواخزة تُستعمل مرة واحدة فقط.' },
    { t: 'امسح القطرة الأولى', x: 'امسح القطرة الأولى <b>بقطن جاف</b>، لأنها تختلط بسائل الأنسجة فتعطي نتائج غير دقيقة.', tool: 'cotton', target: 'drop', run: () => S.A.wipe(), note: true, ok: 'تكوّنت قطرة جديدة نظيفة.' },
    { t: 'اجمع الدم', x: 'المس القطرة بطرف <b>الأنبوب الشعري</b> وهو أفقي تقريباً، فيمتلئ وحده بالخاصية الشعرية. لا تعصر الإصبع بقوة: العصر يخلط الدم بسائل الأنسجة.', tool: 'captube', target: 'drop', run: () => S.A.collect(), ok: 'امتلأ الأنبوب الشعري.' },
    { t: 'اضغط على المكان', x: 'ضع <b>قطناً جافاً</b> واضغط على رأس الإصبع حتى يتوقف النزف.', tool: 'cotton', target: 'finger', run: () => S.A.pressFinger() }
  ];
  const STEPS = { vein: VEIN, cap: CAP, artery: [] };
  const MODE_NAME = { vein: 'سحب الدم من الوريد', cap: 'الدم الشعيري من الإصبع', artery: 'سحب الدم من الشريان' };

  /* ---------- واجهة ---------- */
  let el = {};
  function fb(html, kind) {
    el.fb.hidden = !html; el.fb.innerHTML = html || '';
    el.fb.className = 'status' + (kind ? ' ' + kind : '');
    // نسخة مختصرة فوق المجسم للشاشات الصغيرة
    const t = el.toast;
    if (!t) return;
    clearTimeout(t._tm);
    if (!html) { t.hidden = true; return; }
    t.innerHTML = html.replace(/<span class="hint2">[\s\S]*?<\/span>/, ''); t.className = 'lab-toast' + (kind ? ' ' + kind : ''); t.hidden = false;
    t._tm = setTimeout(() => (t.hidden = true), kind === 'warn' ? 6500 : 4500);
  }
  function steps() { return STEPS[st.mode]; }
  function cur() { return steps()[st.i]; }

  function renderTray() {
    el.tray.innerHTML = TOOLS.map(([k, n]) => `<button type="button" class="tool" data-t="${k}" aria-pressed="false"><svg viewBox="0 0 28 28" aria-hidden="true">${ICON[k]}</svg><span>${n}</span></button>`).join('');
    el.tray.querySelectorAll('.tool').forEach(b => b.addEventListener('click', () => chooseTool(b.dataset.t)));
  }
  function markTray() { el.tray.querySelectorAll('.tool').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === st.sel))); }

  function renderList() {
    el.list.innerHTML = steps().map((s, i) => `<li class="${i < st.i || st.done ? 'done' : i === st.i ? 'now' : ''}">${s.t}</li>`).join('');
  }
  function render() {
    const s = cur(), list = steps();
    el.mode.textContent = MODE_NAME[st.mode];
    el.tray.hidden = st.mode === 'artery';
    el.listWrap.hidden = st.mode === 'artery';
    if (st.mode === 'artery') return renderArtery();
    if (st.done) return renderDone();
    el.n.textContent = `الخطوة ${st.i + 1} من ${list.length}`;
    el.bar.style.width = ((st.i / list.length) * 100).toFixed(1) + '%';
    el.title.textContent = s.t;
    if (el.pill) el.pill.textContent = `${st.i + 1}/${list.length} · ${s.t}`;
    el.text.innerHTML = s.x + (s.note ? ' <span class="u-note">للفهم</span>' : '');
    el.ctl.innerHTML = '';
    el.help.hidden = false; el.help.disabled = false;
    if (s.ui === 'go') {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn primary'; b.textContent = s.go;
      b.addEventListener('click', () => runStep()); el.ctl.appendChild(b);
    } else if (s.ui === 'angle') uiAngle();
    else if (s.ui === 'draw') uiDraw();
    else if (s.ui === 'tubes') uiTubes();
    if (S && S.guideAt) S.guideAt(null);
    renderList();
  }
  function renderDone() {
    el.n.textContent = 'اكتملت الخطوات';
    if (el.pill) el.pill.textContent = 'اكتملت الخطوات ✓';
    el.bar.style.width = '100%';
    el.help.hidden = true;
    renderList();
    if (st.mode === 'vein') {
      el.title.textContent = 'أحسنت! سحبت 5 مل من الوريد';
      el.text.innerHTML = 'في الأنبوب الأحمر (بلا مانع تخثر) سيتجلط الدم لنحصل على <b>المصل</b>، وفي الأنبوب البنفسجي (EDTA) يبقى الدم سائلاً: <b>دم كامل</b>، أو نفصل منه <b>البلازما</b> بالطرد المركزي.';
      el.ctl.innerHTML = '<a class="btn primary" href="#prep">حضّر العينات الآن</a> <button type="button" class="btn" data-go="cap">جرّب الدم الشعيري</button> <button type="button" class="btn" data-again>أعد التجربة</button>';
    } else {
      el.title.textContent = 'أحسنت! جمعت الدم الشعيري';
      el.text.innerHTML = 'الأنبوب الشعري جاهز لقياس الهيموكلوبين أو عدّ الكريات. عند <b>المواليد والرضّع</b> نوخز <b>جانب الكعب</b> بدل الإصبع، وقد يُستعمل أيضاً <b>شحمة الأذن</b>.';
      el.ctl.innerHTML = '<button type="button" class="btn primary" data-go="vein">جرّب السحب الوريدي</button> <button type="button" class="btn" data-again>أعد التجربة</button>';
    }
    el.ctl.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.go)));
    el.ctl.querySelectorAll('[data-again]').forEach(b => b.addEventListener('click', () => setMode(st.mode)));
    fb('', '');
  }
  function renderArtery() {
    el.n.textContent = 'معلومة';
    if (el.pill) el.pill.textContent = 'الشريان الكعبري عند الرسغ';
    el.bar.style.width = '0%';
    el.title.textContent = 'السحب من الشريان';
    el.text.innerHTML = `<ul class="st-ul">
      <li>يُسحب غالباً من <b>الشريان الكعبري</b> عند الرسغ جهة الإبهام، حيث نتحسس النبض.</li>
      <li>الغرض الرئيس: قياس <b>غازات الدم</b> (الأوكسجين وثاني أوكسيد الكاربون) والأس الهيدروجيني.</li>
      <li>يقوم به <b>طبيب أو مختص مدرّب</b> فقط، بحقنة فيها مانع تخثر (هيبارين).</li>
      <li>الإبرة بزاوية أكبر (نحو 45°)، والدم أحمر فاتح يدفع المكبس بنفسه لأن ضغطه عالٍ.</li>
      <li>بعد السحب يُضغط على المكان <b>5 دقائق على الأقل</b> لمنع النزف.</li>
    </ul><span class="u-note">للفهم</span> المحاضرة تذكر الشريان كأحد أماكن السحب فقط.`;
    el.ctl.innerHTML = '';
    el.help.hidden = true;
    fb('', '');
  }

  /* ---------- أدوات واجهة خاصة ---------- */
  function uiAngle() {
    el.ctl.innerHTML = `<div class="range"><label for="angR">زاوية الإبرة مع الجلد<b id="angRV">${st.angle}°</b></label><input id="angR" type="range" min="5" max="60" step="1" value="${st.angle}"></div>
      <button type="button" class="btn primary" id="insBtn">أدخل الإبرة</button>`;
    const r = $('#angR'), out = $('#angRV');
    r.addEventListener('input', () => { st.angle = +r.value; out.textContent = st.angle + '°'; if (S) S.aimSyringe(st.angle); });
    $('#insBtn').addEventListener('click', () => tryInsert());
    if (S) S.aimSyringe(st.angle);
  }
  function tryInsert() {
    if (st.busy) return;
    const a = st.angle;
    if (a < 15) return fb(`<b>${a}° زاوية صغيرة:</b> الإبرة ستسير موازية للجلد تحت سطحه ولن تصل إلى الوريد. ارفعها قليلاً.`, 'warn');
    if (a > 30) return fb(`<b>${a}° زاوية كبيرة:</b> قد تخترق الإبرة الوريد من جداره الأمامي والخلفي معاً فيتسرب الدم ويتكوّن ورم دموي. اخفضها.`, 'warn');
    run(() => S.A.insert(a), `<b>${a}°</b> زاوية صحيحة (بين 15° و30°). ظهر الدم في قاعدة الإبرة.`);
  }
  function uiDraw() {
    el.ctl.innerHTML = `<div class="range"><label for="drawR">حجم الدم في الحقنة<b id="drawRV">0.0 مل</b></label><input id="drawR" type="range" min="0" max="5" step="0.1" value="0"></div>
      <button type="button" class="btn primary hold" id="holdBtn">اضغط مطوّلاً لسحب المكبس</button>`;
    const r = $('#drawR'), out = $('#drawRV');
    let lastT = performance.now(), lastV = 0, warnT = 0;
    const set = (v, src) => {
      const now = performance.now(), vol = S.vol();
      if (v < vol - 0.05) { r.value = vol; fb('<b>لا تدفع المكبس للأمام</b> والإبرة داخل الوريد: قد تدفع هواءً أو تعيد الدم إلى الوريد.', 'warn'); return; }
      const rate = (v - lastV) / Math.max(0.016, (now - lastT) / 1000);
      if (src === 'slider' && v - lastV > 0.25 && rate > 2.5 && now - warnT > 1500) { warnT = now; fb('<b>ببطء!</b> السحب السريع يكسر كريات الدم الحمر (تحلل الدم Hemolysis) فيصبح المصل أحمر، وقد ينخمص جدار الوريد.', 'warn'); }
      lastT = now; lastV = v;
      S.setVol(v); out.textContent = lab.f(v, 1) + ' مل'; r.value = v;
      if (v >= 4.95 && !st.busy) { r.disabled = true; hold.disabled = true; stopHold(); st.busy = true; fb('امتلأت الحقنة: <b>5 مل</b> من الدم الوريدي القاتم.', 'ok'); setTimeout(() => { st.busy = false; next(); }, 900); }
    };
    r.addEventListener('input', () => set(+r.value, 'slider'));
    const hold = $('#holdBtn');
    let tm = 0;
    const stopHold = () => { clearInterval(tm); tm = 0; hold.classList.remove('on'); };
    const startHold = e => { e.preventDefault(); if (tm || hold.disabled) return; hold.classList.add('on'); lastT = performance.now(); lastV = S.vol(); tm = setInterval(() => set(Math.min(5, S.vol() + 0.05), 'hold'), 50); };
    hold.addEventListener('pointerdown', startHold);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => hold.addEventListener(ev, stopHold));
    hold.addEventListener('contextmenu', e => e.preventDefault());
  }
  function uiTubes() {
    const done = st.tubes;
    el.ctl.innerHTML = `<div class="tube-btns">
      <button type="button" class="btn tube-b" data-k="plain" ${done.plain ? 'disabled' : ''}><i style="background:#d8343c"></i>الأنبوب العادي (أحمر)<small>بلا مانع تخثر · للمصل</small></button>
      <button type="button" class="btn tube-b" data-k="edta" ${done.edta ? 'disabled' : ''}><i style="background:#8a5bd6"></i>أنبوب EDTA (بنفسجي)<small>مانع تخثر · دم كامل وبلازما</small></button></div>`;
    el.ctl.querySelectorAll('.tube-b').forEach(b => b.addEventListener('click', () => fillTube(b.dataset.k)));
  }
  function fillTube(k) {
    if (st.busy || st.tubes[k]) return;
    const msg = k === 'plain'
      ? '<b>الأنبوب الأحمر:</b> لا تهزّه. اتركه واقفاً 20–30 دقيقة ليتجلط الدم، ثم نفصل منه المصل.'
      : '<b>أنبوب EDTA:</b> قلبناه برفق عدة مرات ليختلط الدم بمانع التخثر فلا يتجلط. لا نرجّه بقوة.';
    st.busy = true; lock(true);
    S.A.fillTube(k).then(() => {
      st.busy = false; lock(false); st.tubes[k] = 1;
      if (st.tubes.plain && st.tubes.edta) { fb(msg, 'ok'); setTimeout(next, 1200); }
      else { fb(msg + ' الآن املأ الأنبوب الآخر.', 'ok'); uiTubes(); }
    });
  }

  /* ---------- منطق الخطوات ---------- */
  function lock(on) { el.card.classList.toggle('busy', on); el.ctl.querySelectorAll('button,input').forEach(b => { if (on) b.disabled = true; }); }
  function run(fn, okMsg) {
    if (st.busy) return Promise.resolve();
    st.busy = true; lock(true); select(null);
    if (S.guideAt) S.guideAt(null);
    return Promise.resolve(fn()).then(() => {
      st.busy = false; lock(false);
      const s = cur();
      fb(okMsg || (s && s.ok) || '', 'ok');
      next();
    }).catch(e => { console.error(e); st.busy = false; lock(false); });
  }
  function runStep() {
    const s = cur();
    if (s.run) return run(s.run);
    // خطوة بدون فعل ثلاثي الأبعاد
    fb(s.ok || '', s.ok ? 'ok' : ''); next();
  }
  function next() {
    st.help = 0;
    if (st.i < steps().length - 1) st.i++;
    else st.done = true;
    render();
  }
  function select(k) { st.sel = k; markTray(); if (S && S.select) S.select(k); }

  function chooseTool(k) {
    if (!S || st.busy || st.done || st.mode === 'artery') return;
    const s = cur();
    if (s.ui === 'tubes' && k === 'tubes') return fillTube(st.tubes.plain ? 'edta' : 'plain');
    if (s.tool === k) {
      select(k);
      if (!s.target) return run(s.run);
      fb(`اخترت <b>${TNAME[k]}</b>. اضغط الآن على مكان استعماله في المجسم.`, '');
      return;
    }
    select(null);
    const w = (s.wrongTool && s.wrongTool[k]) || null;
    if (w) return fb(w, 'warn');
    if (!s.tool && s.ui === 'draw') return fb('أكمل سحب الدم أولاً، والإبرة ما زالت في الوريد.', 'warn');
    fb(`<b>ليس الآن.</b> ${ORDER[k]}`, 'warn');
  }

  const MATCH = {
    upperArm: c => c.upperArm,
    hand: c => c.hand || (c.finger && c.finger !== 'none'),
    mcub: c => c.vein === 'mcub' || (c.site && !c.vein),
    site: c => c.site,
    finger: c => !!c.finger && c.finger === S.finger(),
    drop: c => c.drop || (!!c.finger && c.finger === S.finger())
  };
  function onPick(c) {
    if (!S || st.busy || st.done || st.mode === 'artery') return;
    if (c.tool) return chooseTool(c.tool);
    if (c.none) return;
    const s = cur();
    // اختيار الإصبع
    if (s.pick) {
      if (c.finger === 'middle' || c.finger === 'ring') {
        S.setFinger(c.finger);
        return run(() => S.view('finger', 1.0).then(() => S.guideAt('finger')), s.ok);
      }
      return fb(s.wrong(c), 'warn');
    }
    if (!s.target) {
      if (s.tool && !st.sel) return fb(`اختر الأداة المناسبة أولاً من صندوق الأدوات.`, '');
      return;
    }
    if (s.tool && st.sel !== s.tool) return fb(st.sel ? `<b>${TNAME[st.sel]}</b> ليست الأداة المناسبة لهذه الخطوة.` : 'اختر الأداة المناسبة أولاً من صندوق الأدوات.', st.sel ? 'warn' : '');
    if (MATCH[s.target](c)) return run(s.run);
    const w = s.wrong && s.wrong(c);
    fb(w || `ليس هنا. استعملها على <b>${WHERE[s.target] || 'المكان المناسب'}</b>.`, 'warn');
  }
  function help() {
    if (!S || st.busy || st.done) return;
    const s = cur();
    st.help++;
    if (st.help === 1) {
      let h = '';
      if (s.ui === 'go') h = `اضغط الزر «${s.go}».`;
      else if (s.ui === 'angle') h = 'حرّك المؤشر حتى تصبح الزاوية بين <b>15° و30°</b> (القوس يصير أخضر)، ثم اضغط «أدخل الإبرة».';
      else if (s.ui === 'draw') h = 'اضغط مطوّلاً على الزر، أو حرّك المؤشر ببطء حتى 5 مل.';
      else if (s.ui === 'tubes') h = 'اضغط على زر كل أنبوب: الأحمر للمصل، والبنفسجي للدم الكامل والبلازما.';
      else if (s.pick) h = 'اختر <b>الوسطى</b> أو <b>البنصر</b>.';
      else h = (s.tool ? `الأداة: <b>${TNAME[s.tool]}</b>` : '') + (s.target ? (s.tool ? ' ثم اضغط على ' : 'اضغط على ') + `<b>${WHERE[s.target]}</b>` : '') + '.';
      fb(h + ' <span class="hint2">اضغط «ساعدني» مرة أخرى لأقوم بها عنك.</span>', '');
      if (s.target && S.guideAt) S.guideAt(s.target === 'mcub' ? 'site' : s.target);
      else if (s.tool && S.guideAt) S.guideAt(s.tool);
      if (s.tool) { select(s.tool); }
      return;
    }
    // تنفيذ تلقائي
    if (s.ui === 'go') return runStep();
    if (s.ui === 'angle') { st.angle = 20; const r = $('#angR'); if (r) { r.value = 20; $('#angRV').textContent = '20°'; } S.aimSyringe(20); return tryInsert(); }
    if (s.ui === 'draw') { st.busy = true; lock(true); const v0 = S.vol(); let t = 0; const tm = setInterval(() => { t += 0.05; const v = Math.min(5, v0 + t * 1.6); S.setVol(v); const o = $('#drawRV'); if (o) o.textContent = lab.f(v, 1) + ' مل'; if (v >= 5) { clearInterval(tm); st.busy = false; lock(false); fb('امتلأت الحقنة: <b>5 مل</b>.', 'ok'); next(); } }, 50); return; }
    if (s.ui === 'tubes') { const k = st.tubes.plain ? 'edta' : 'plain'; return fillTube(k); }
    if (s.pick) { S.setFinger('middle'); return run(() => S.view('finger', 1.0).then(() => S.guideAt('finger')), s.ok); }
    return run(s.run);
  }

  function setMode(m) {
    st.mode = m; st.i = 0; st.done = false; st.help = 0; st.busy = false; st.angle = 45; st.tubes = { plain: 0, edta: 0 };
    if (el.setSeg) el.setSeg(m, false);
    select(null); fb('', '');
    if (S && S.reset) S.reset(m);
    render();
  }

  lab.ready.push(() => {
    el = { card: $('#stepCard'), n: $('#stN'), mode: $('#stMode'), bar: $('#stBar'), title: $('#stTitle'), text: $('#stText'), ctl: $('#stCtl'), fb: $('#stFb'), help: $('#stHelp'), list: $('#stList'), listWrap: $('#stListWrap'), tray: $('#tray'), toast: $('#labToast'), pill: $('#labPill') };
    if (!el.card) return;
    renderTray();
    el.setSeg = lab.seg($('#labMode'), v => setMode(v));
    el.help.addEventListener('click', help);
    $('#stReset').addEventListener('click', () => setMode(st.mode));
    render();
    api.pick = onPick;
    lab.bloodSteps = { setMode };
    document.querySelectorAll('[data-labmode]').forEach(b => b.addEventListener('click', () => { setMode(b.dataset.labmode); if (lab.go) lab.go('lab'); }));
    api.onReadyFns.push(() => { S = api.scene; S.reset(st.mode); render(); });
    const lb = $('#labLabels'); if (lb) lb.addEventListener('click', () => { const on = lb.getAttribute('aria-pressed') !== 'true'; lb.setAttribute('aria-pressed', String(on)); if (S && S.showLabels) S.showLabels(on); });
  });
})();
