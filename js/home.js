'use strict';

function petHeartSvg() {
  return '<svg viewBox="0 0 14 13" width="14" height="13" aria-hidden="true"><path d="M7 12C2 8.3.5 5.6.5 3.7.5 1.9 1.9.5 3.7.5c1.3 0 2.5.8 3.3 2 .8-1.2 2-2 3.3-2 1.8 0 3.2 1.4 3.2 3.2 0 1.9-1.5 4.6-6.5 8.3Z" fill="currentColor"/></svg>';
}
function petCardHtml() {
  var p = BLOOM.petState(store);
  var st = p.stages[p.stage];
  var chipTxt = p.cold ? 'Caught a cold' : st.label;
  var blurb = p.cold
    ? 'Sniffle… ' + esc(p.name) + ' caught a cold. one check-in today and it warms right back up.'
    : (p.fedToday ? st.blurb : 'Log today to feed ' + esc(p.name) + ' - ' + st.blurb);
  var xp = 'Streak ' + p.streak + 'd · best ' + p.best + 'd · ' +
    (p.cold ? 'Log today to recover' : p.next ? p.daysToNext + 'd to ' + p.next.label : 'Fully grown - an Adult bloom!');
  return '<div class="card pet-card' + (p.cold ? ' cold' : '') + '" id="pet-card">' +
    '<div class="pet-flex">' +
      '<button class="pet-tap" id="pet-tap" title="Pet ' + esc(p.name) + '" aria-label="Pet your streak pet">' +
        '<img class="pet-img" src="' + p.img + '" alt="' + esc(p.name) + ' the ' + chipTxt + ' streak pet" draggable="false">' +
      '</button>' +
      '<div class="pet-info">' +
        '<h2 class="pet-title"><span id="pet-name">' + esc(p.name) + '</span>' +
          '<span class="pet-stagechip' + (p.cold ? ' c' : '') + '">' + chipTxt + '</span>' +
          '<button class="pet-edit" id="pet-rename-btn" aria-label="Rename your pet">Rename</button></h2>' +
        '<div class="pet-rename" id="pet-rename" style="display:none">' +
          '<input class="name-input" id="pet-name-input" maxlength="14" placeholder="Name your pet" value="' + esc(p.name) + '">' +
          '<button class="pill primary small" id="pet-name-save">Save</button>' +
        '</div>' +
        '<p class="blurb">' + blurb + '</p>' +
        '<div class="pet-xp">' +
          '<div class="xp-bar"><i style="width:' + p.progress + '%"></i></div>' +
          '<span>' + xp + '</span>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<span class="hearts" id="pet-hearts" aria-hidden="true"></span>' +
  '</div>';
}
function bindPet() {
  var tap = $('#pet-tap');
  if (tap) tap.addEventListener('click', function () {
    var h = $('#pet-hearts');
    var p = BLOOM.petState(store);
    if (h) {
      h.innerHTML = '<i>' + petHeartSvg() + '</i><i>' + petHeartSvg() + '</i><i>' + petHeartSvg() + '</i>';
      h.classList.remove('go'); void h.offsetWidth; h.classList.add('go');
    }
    if (p.cold) { toast(p.name + ': *sniffle* a check-in today will cheer me up'); return; }
    var quips = [p.name + ' loves the attention!', 'Hehe, that tickles!', '*happy wiggles*', 'keep us both growing!'];
    toast(quips[Math.floor(Math.random() * quips.length)]);
  });
  var rb = $('#pet-rename-btn'), form = $('#pet-rename'), ni = $('#pet-name-input'), ns = $('#pet-name-save');
  if (rb && form && ni) {
    rb.addEventListener('click', function () {
      var open = form.style.display === 'flex';
      form.style.display = open ? 'none' : 'flex';
      if (!open) { ni.value = (store.profile.petName || 'Daisy'); ni.focus(); }
    });
    var saveName = function () {
      var v = (ni.value || '').trim().slice(0, 14) || 'Daisy';
      store.profile.petName = v;
      persist();
      renderHome();
      toast('Nice to meet you, ' + v + '!');
    };
    if (ns) ns.addEventListener('click', saveName);
    ni.addEventListener('keydown', function (e) { if (e.key === 'Enter') saveName(); });
  }
}
function checkPetEvolve() {
  var p = BLOOM.petState(store);
  var st = store.settings;
  if (p.streak > (st.bestStreak || 0)) st.bestStreak = p.streak;
  if (st.petStageSeen === undefined) { st.petStageSeen = p.stage; st.petCold = !!p.cold; persist(); return; }
  var msgs = [];
  var grewTo = false;
  if (p.cold && !st.petCold) msgs.push(p.name + ' caught a cold… log today to warm it back up');
  if (!p.cold && st.petCold) msgs.push(p.name + ' sniffled better - welcome back!');
  if (!p.cold && p.stage > st.petStageSeen) {
    grewTo = true;
    msgs.push(p.name + ' grew into a ' + p.stages[p.stage].label + '!');
  }
  st.petCold = !!p.cold;
  st.petStageSeen = p.stage;
  persist();
  if (msgs.length) {
    toast(msgs[msgs.length - 1]);
    var c = $('#pet-card');
    if (c) { c.classList.remove('evolve'); void c.offsetWidth; c.classList.add('evolve'); }
    if (grewTo) showEvolvePop(p);
  }
}

function sparkleSvg() {
  return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.6l2 6.6 6.6 2-6.6 2-2 6.6-2-6.6-6.6-2 6.6-2z"/></svg>';
}
function showEvolvePop(p) {
  var old = $('#evolve-pop');
  if (old) old.remove();
  var stg = p.stages[p.stage];
  var spk = '';
  for (var i = 0; i < 8; i++) spk += '<i class="spk" style="--d:' + (i * .17) + 's;--l:' + (4 + i * 12) + '%;--t:' + (6 + (i % 3) * 26) + '%">' + sparkleSvg() + '</i>';
  var d = document.createElement('div');
  d.id = 'evolve-pop';
  d.innerHTML = '<div class="ep-card">' + spk +
    '<img src="' + stg.img + '" alt="' + esc(stg.label) + ' stage">' +
    '<h2>' + esc(p.name) + ' grew into a ' + esc(stg.label) + '!</h2>' +
    '<p>' + esc(stg.blurb) + '</p>' +
    '<button class="pill primary" id="ep-close">Yay</button>' +
    '</div>';
  document.body.appendChild(d);
  var x = $('#ep-close');
  if (x) x.addEventListener('click', function () { d.remove(); });
}

function renderHome() {
  var e = todayEntry();
  var moodId = e && e.mood;
  var m = BLOOM.moodById(moodId);
  var streak = BLOOM.streak(store);
  var recent = BLOOM.allEntryKeys(store);

  var html =
    '<div class="card dashed hero-card" style="overflow:visible">' +
      (streak >= 2 ? '<span class="sticker">Streak: ' + streak + ' days</span>' : '') +
      '<div class="hero">' +
        '<div class="hero-face">' + (m ? moodImg(moodId) : daisyPlaceholder(64)) + '</div>' +
        '<div class="hero-text">' +
          '<h1>' + esc(greeting()) + ', ' + esc(displayName()) + '</h1>' +
          '<p>' + BLOOM.fmtLong(BLOOM.todayKey()) +
          (m ? ' feeling <b>' + m.label + '</b>' : ' how are you feeling today?') +
          '</p>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="card month-card">' +
      '<h2>This month</h2>' +
      '<div class="statline">' +
        '<div class="stat"><b>' + BLOOM.monthEntryCount(store, calView.y, calView.m) + '</b><span>Check-ins</span></div>' +
        '<div class="stat"><b>' + streak + '</b><span>Day streak</span></div>' +
        '<div class="stat"><b>' + ((e && e.medMinutes) || 0) + 'm</b><span>Calm today</span></div>' +
      '</div>' +
      '<div style="text-align:center;margin-top:14px"><button class="pill ghost" id="home-open-journal">Open my journal</button></div>' +
    '</div>' +

    petCardHtml() +

    '<div class="card">' +
      '<h2>Mood check-in <span class="tiny">' + (m ? 'Saved for today' : 'Tap a daisy') + '</span></h2>' +
      '<div id="home-moods"></div>' +
      (m ? '<p class="subtitle" style="margin-top:2px">Tap another anytime, your calendar updates too</p>' : '') +
    '</div>' +

    '<div class="card affirm pop">' +
      '<h2 style="justify-content:center">Today\u2019s affirmation</h2>' +
      '<p>\u201C' + esc(BLOOM.affirmationForDay(new Date(), affSalt)) + '\u201D</p>' +
      '<div class="actions"><button class="pill small ghost" id="aff-shuffle">Another one</button></div>' +
    '</div>' +

    '<div class="card">' +
      '<h2>Quick thought <span class="tiny">Optional</span></h2>' +
      '<div class="qnote">' +
        '<input id="quick-note" type="text" maxlength="140" placeholder="One tiny thing about today…" value="' + esc((e && e.note) || '') + '">' +
        '<button class="pill primary small" id="quick-save">Save</button>' +
      '</div>' +
    '</div>' +

    (recent.length ?
      '<div class="card shelf-card">' +
        '<h2>My books <span class="tiny">' + BLOOM.allEntryKeys(store).length + ' on the shelf</span></h2>' +
        '<div class="shelf" id="recent-books">' +
          recent.map(function (k) { return bookHtml(k, true); }).join('') +
        '</div>' +
        '<div class="shelf-plank"></div>' +
        '<p class="subtitle" style="margin-top:8px">Every saved journal becomes a book,  tap one to open it</p>' +
      '</div>' : '');

  $('#view-home').innerHTML = html;

  $('#home-moods').appendChild(moodRow(moodId, function (id) {
    var wasFed = BLOOM.hasContent(todayEntry());
    BLOOM.setEntry(store, BLOOM.todayKey(), { mood: id });
    persist();
    checkPetEvolve();
    renderHome();
    toast(wasFed ? 'Mood saved: ' + BLOOM.moodById(id).label
                 : 'yay - ' + BLOOM.moodById(id).label + ' logged, your pet got a snack!');
  }));
  bindPet();

  $('#aff-shuffle').addEventListener('click', function () { affSalt++; renderHome(); });
  $('#quick-save').addEventListener('click', function () {
    var v = $('#quick-note').value.trim();
    BLOOM.setEntry(store, BLOOM.todayKey(), { note: v });
    persist(); checkPetEvolve(); renderHome(); toast(v ? 'Saved' : 'Note cleared');
  });
  $('#quick-note').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') $('#quick-save').click(); });
  $('#home-open-journal').addEventListener('click', function () { editKey = BLOOM.todayKey(); showView('entry'); });
  bindBooks($('#recent-books'), openReader);
}

