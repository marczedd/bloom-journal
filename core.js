(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BLOOM = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  var MOODS = [
    { id: 'energetic', label: 'Energetic', color: '#f2c94c', tint: '#fdf3d3' },
    { id: 'happy',     label: 'Happy',     color: '#e84a8a', tint: '#fbe0ec' },
    { id: 'love',      label: 'Loved',     color: '#b39df5', tint: '#ece6fd' },
    { id: 'sleepy',    label: 'Sleepy',    color: '#7db8ea', tint: '#e2effb' },
    { id: 'tired',     label: 'Tired',     color: '#a9a4ae', tint: '#eceaec' },
    { id: 'low',       label: 'Feeling Low', color: '#b8d9f5', tint: '#e6f2fb' },
    { id: 'cramps',    label: 'Cramps',    color: '#fa8b3d', tint: '#fdeadd' },
    { id: 'ovu',       label: 'Ovu',       color: '#f6a8ad', tint: '#fde9ea' },
    { id: 'lutheal',   label: 'Lutheal',   color: '#7e68b2', tint: '#e9e2f6' },
    { id: 'angry',     label: 'Angry',     color: '#ef5a4f', tint: '#fbe3e1' }
  ];

  var AFFIRMATIONS = [
    "Remember that small steps are still steps.",
    "You didn't have to be perfect today, just here. And you already are!",
    "Proud na proud ako sayo, kahit maliit lang ang natapos mo today or wala 'man ><.",
    "It's okay to rest. Flowers don't bloom all year and that's fine (:.",
    "Feel them, then choose.",
    "Kaya mo 'to. And if not today, kaya mo rin bukas at bukas.",
    "You are allowed to take up space, be soft, and be difficult all at once, always heree.",
    "One kind thought about yourself counts as self-care too, remember thatt.",
    "The version of you that got through yesterday is someone to be proud of.",
    "You can always ask zed to kiss and hug you. You deserve it.",
    "Your pace is still a pace, pace be with you!.",
    "Drink water, unclench your jaw, you're doing great.",
    "Mood is weather, you are the whole sky.",
    "I see you!",
    "You notice tiny good things,  that's a superpower, actually.",
    "Being gentle with yourself is productive ><.",
    "You don't owe anyone an explanation for a quiet day.",
    "I know everyday for you is a win.",
    "You are enough, just as you are, right now.",
    "Today you get to be a work in progress AND a masterpiece.",
    "Good day, my sunshine!",
    "You are the main character and the softest one!",
    "Rest now, rise later (_o_).",
    "My favorite thing about you is your heart.",
    "Good job today! Just waking up is already a good job.",
    "You can do hard things. And you can also put them down."
  ];

  var PROMPTS = [
    "Today, something small that made me smile was...",
    "I'm feeling heavy because..",
    "List the wins today, no matter how small...",
    "Right now, i need...",
    "If today had a color, it would be...",
    "Kumusta si self??",
    "Something i want to remember about today...",
    "I'm proud of myself for..."
  ];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function keyOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayKey() { return keyOf(new Date()); }
  function parseKey(key) {
    var p = String(key).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function fmtLong(key) {
    var d = parseKey(key);
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var mo = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
              'August', 'September', 'October', 'November', 'December'];
    return days[d.getDay()] + ', ' + mo[d.getMonth()].slice(0, 3) + ' ' + d.getDate() + ', ' + d.getFullYear();
  }
  function monthLabel(y, m) {
    var mo = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
              'August', 'September', 'October', 'November', 'December'];
    return mo[m] + ' ' + y;
  }

  function monthGrid(y, m) {
    var first = new Date(y, m, 1);
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var lead = first.getDay();
    var cells = [];
    var i;
    for (i = 0; i < lead; i++) cells.push(null);
    var todayK = todayKey();
    for (i = 1; i <= daysInMonth; i++) {
      var key = y + '-' + pad(m + 1) + '-' + pad(i);
      cells.push({ key: key, day: i, future: key > todayK });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }

  function blank() {
    return { v: 1, profile: { name: '', avatarMood: '', createdAt: todayKey() }, entries: {}, boards: {}, settings: {} };
  }
  function load(store) {
    if (!store) return blank();
    try {
      var s = JSON.parse(store);
      if (!s || typeof s !== 'object' || s.v !== 1) return blank();
      if (!s.entries) s.entries = {};
      if (!s.boards) s.boards = {};
      if (!s.profile) s.profile = { name: '', avatarMood: '', createdAt: todayKey() };
      if (!s.settings) s.settings = {};
      return s;
    } catch (e) { return blank(); }
  }
  function save(s) { return JSON.stringify(s); }

  function getEntry(s, key) { return s.entries[key] || null; }
  function setEntry(s, key, patch) {
    var e = s.entries[key] || {};
    for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) e[k] = patch[k];
    e.updatedAt = Date.now();
    s.entries[key] = e;
    return e;
  }
  function deleteEntry(s, key) {
    var e = s.entries[key];
    if (e && (e.note || e.journal || e.medMinutes)) {
      delete e.mood;
      if (Object.keys(e).length > 1) { s.entries[key] = e; return 'kept'; }
    }
    delete s.entries[key];
    return 'removed';
  }
  function hasContent(e) { return !!(e && (e.mood || e.note || e.journal || e.medMinutes)); }

  function streak(s) {
    var d = new Date();
    var n = 0;
    if (!hasContent(s.entries[keyOf(d)])) d = addDays(d, -1);
    while (hasContent(s.entries[keyOf(d)])) { n++; d = addDays(d, -1); }
    return n;
  }
  function allEntryKeys(s) {
    return Object.keys(s.entries)
      .filter(function (k) { return hasContent(s.entries[k]); })
      .sort().reverse();
  }
  function moodCounts(s) {
    var c = {};
    allEntryKeys(s).forEach(function (k) {
      var m = s.entries[k].mood;
      if (m) c[m] = (c[m] || 0) + 1;
    });
    return c;
  }
  function monthEntryCount(s, y, m) {
    var pre = y + '-' + pad(m + 1);
    return Object.keys(s.entries).filter(function (k) {
      return k.indexOf(pre) === 0 && hasContent(s.entries[k]);
    }).length;
  }
  function totalMedMinutes(s) {
    return allEntryKeys(s).reduce(function (sum, k) { return sum + (s.entries[k].medMinutes || 0); }, 0);
  }

  function affirmationForDay(d, salt) {
    var doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
    var seed = (d.getFullYear() * 372 + doy + (salt || 0) * 7) % AFFIRMATIONS.length;
    return AFFIRMATIONS[seed];
  }
  function randomPrompt(exclude) {
    var pool = PROMPTS.filter(function (p) { return p !== exclude; });
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function moodById(id) {
    for (var i = 0; i < MOODS.length; i++) if (MOODS[i].id === id) return MOODS[i];
    return null;
  }
  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  /* ---------- mood board (per-day drag & drop collage) ---------- */
  function boardGet(s, key) {
    if (!s.boards) s.boards = {};
    if (!s.boards[key]) s.boards[key] = { items: [] };
    return s.boards[key];
  }
  var BD_DEFAULT_W = { circle: .14, rect: .22, photo: .28, streak: .26, mood: .16, text: .3 };
  /* pure draw-spec for a board in a WxH export frame — one source of truth
     for the DOM editor, the PNG painter and the PDF painter */
  function boardOps(board, meta) {
    var items = (board && board.items) || [];
    var ops = [];
    items.forEach(function (it) {
      var w = Math.round((it.w || BD_DEFAULT_W[it.kind] || .2) * meta.W);
      var op = {
        kind: it.kind, id: it.id,
        x: Math.round((it.x || 0) * meta.W),
        y: Math.round((it.y || 0) * meta.H),
        w: w, rot: it.rot || 0,
        color: it.color || (it.kind === 'streak' ? '#ffffff' : '#e84a8a')
      };
      if (it.kind === 'circle') op.h = w;
      else if (it.kind === 'rect') { op.h = Math.round(w * .72); op.tape = true; }
      else if (it.kind === 'photo') { op.src = it.src || ''; op.h = Math.round(w * .78); op.tape = true; }
      else if (it.kind === 'text') { op.text = String(it.text || ''); op.h = Math.round(w * .24); }
      else if (it.kind === 'streak') { op.src = meta.petImg || ''; op.h = w; }
      else if (it.kind === 'mood') { op.src = meta.moodSrc || 'assets/moods/happy.png'; op.h = w; }
      ops.push(op);
    });
    return ops;
  }
  /* minimal single-page landscape-letter PDF wrapping one JPEG (no libraries) */
  function pdfFromJpeg(dataUrl, imgW, imgH) {
    var b64 = String(dataUrl).replace(/^[^,]*,/, '');
    var bin = (typeof atob === 'function') ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    var fit = Math.min(792 / imgW, 612 / imgH);
    var pageW = Math.round(imgW * fit), pageH = Math.round(imgH * fit);
    var content = 'q\n' + pageW + ' 0 0 ' + pageH + ' 0 0 cm\n/Im0 Do\nQ\n';
    var objs = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pageW + ' ' + pageH + '] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>',
      '<< /Length ' + content.length + ' >>\nstream\n' + content + 'endstream',
      '<< /Type /XObject /Subtype /Image /Width ' + imgW + ' /Height ' + imgH + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + bin.length + ' >>\nstream\n' + bin + 'endstream'
    ];
    var pdf = '%PDF-1.4\n', offsets = [], i;
    for (i = 0; i < objs.length; i++) { offsets.push(pdf.length); pdf += (i + 1) + ' 0 obj\n' + objs[i] + '\nendobj\n'; }
    var xrefAt = pdf.length;
    pdf += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
    for (i = 0; i < offsets.length; i++) pdf += ('0000000000' + offsets[i]).slice(-10) + ' 00000 n \n';
    pdf += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefAt + '\n%%EOF';
    return pdf;
  }

  /* ---------- streak pet: grows with your streak, catches a cold when it breaks ---------- */
  var PET_STAGES = [
    { min: 0,  name: 'baby',  label: 'Baby',  img: 'assets/pet/baby.png',  blurb: 'A curious little sprout-daisy. check in daily and it will grow!' },
    { min: 7,  name: 'child', label: 'Child', img: 'assets/pet/child.png', blurb: 'Bouncing with energy — a whole week of showing up!' },
    { min: 14, name: 'teen',  label: 'Teen',  img: 'assets/pet/teen.png',  blurb: 'Growing fast, a tiny bit dramatic, very proud of you.' },
    { min: 20, name: 'adult', label: 'Adult', img: 'assets/pet/adult.png', blurb: 'A fully grown bloom, sparkling because of you.' }
  ];
  var PET_COLD_IMG = 'assets/pet/cold.png';
  function petState(s) {
    var todayK = keyOf(new Date());
    var stk = streak(s);
    var fed = hasContent(s.entries[todayK]);
    var yestK = keyOf(addDays(new Date(), -1));
    var cold = !fed && !hasContent(s.entries[yestK]);
    var stage = 0, i;
    for (i = 0; i < PET_STAGES.length; i++) if (stk >= PET_STAGES[i].min) stage = i;
    var next = stage < PET_STAGES.length - 1 ? PET_STAGES[stage + 1] : null;
    return {
      stage: stage,
      stages: PET_STAGES,
      streak: stk,
      best: s.settings.bestStreak || 0,
      fedToday: fed,
      cold: cold,
      next: next,
      name: (s.profile && s.profile.petName) || 'Daisy',
      img: cold ? PET_COLD_IMG : PET_STAGES[stage].img,
      daysToNext: next ? Math.max(0, next.min - stk) : 0,
      progress: next ? Math.min(100, Math.round(stk / next.min * 100)) : 100
    };
  }
  return {
    MOODS: MOODS, AFFIRMATIONS: AFFIRMATIONS, PROMPTS: PROMPTS,
    boardGet: boardGet, boardOps: boardOps, pdfFromJpeg: pdfFromJpeg,
    keyOf: keyOf, todayKey: todayKey, parseKey: parseKey, addDays: addDays,
    fmtLong: fmtLong, monthLabel: monthLabel, monthGrid: monthGrid,
    blank: blank, load: load, save: save,
    getEntry: getEntry, setEntry: setEntry, deleteEntry: deleteEntry, hasContent: hasContent,
    streak: streak, allEntryKeys: allEntryKeys, moodCounts: moodCounts,
    monthEntryCount: monthEntryCount, totalMedMinutes: totalMedMinutes,
    affirmationForDay: affirmationForDay, randomPrompt: randomPrompt,
    moodById: moodById, escapeHtml: escapeHtml,
    PET_STAGES: PET_STAGES, petState: petState
  };
});
