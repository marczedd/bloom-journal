'use strict';

function renderProfile() {
  var avId = store.profile.avatarMood || (todayEntry() && todayEntry().mood) || null;
  var counts = BLOOM.moodCounts(store);
  var keys = BLOOM.allEntryKeys(store);
  var maxC = Math.max(1, Object.keys(counts).reduce(function (mx, k) { return Math.max(mx, counts[k]); }, 1));
  var streak = BLOOM.streak(store);

  var html =
    '<div class="card dashed" style="overflow:visible">' +
      '<div class="profile-head">' +
        '<button class="avatar-pick" id="avatar-btn" title="Choose the daisy you feel like today">' +
          (avId ? moodImg(avId) : daisyPlaceholder(52)) +
          '<span class="avatar-hint">Tap: my mood today</span>' +
        '</button>' +
        '<div style="min-width:0">' +
          '<h1 class="profile-name">' + esc(displayName()) + '</h1>' +
          '<p class="subtitle">Journaling since ' + BLOOM.fmtLong(store.profile.createdAt || BLOOM.todayKey()) + '</p>' +
          '<div class="statline">' +
            '<div class="stat"><b>' + keys.length + '</b><span>Entries</span></div>' +
            '<div class="stat"><b>' + streak + '</b><span>Streak</span></div>' +
            '<div class="stat"><b>' + BLOOM.totalMedMinutes(store) + 'm</b><span>Calm</span></div>' +
          '</div>' +
          (function () {
            var pp = BLOOM.petState(store);
            return '<div class="profile-pet"><img class="pet-img mini" src="' + pp.img + '" alt="">' +
              '<span><b>' + esc(pp.name) + '</b> - ' +
              (pp.cold ? 'Caught a cold, log today to warm up'
                        : 'a ' + pp.stages[pp.stage].label + ' · ' + pp.streak + ' day streak') +
              '</span></div>';
          })() +
        '</div>' +
      '</div>' +
      '<div id="avatar-picker" style="display:none">' +
        '<p class="subtitle" style="margin-top:8px">How are you feeling today? your daisy changes with you</p>' +
        '<div id="av-moods"></div>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<h2>Your name</h2>' +
      '<div class="name-row">' +
        '<input class="name-input" id="name-input" maxlength="24" placeholder="What should we call you?" value="' + esc(store.profile.name) + '">' +
        '<button class="pill primary small" id="name-save">Save</button>' +
      '</div>' +
    '</div>' +

    '<div class="card shelf-card">' +
      '<h2>My bookshelf <span class="tiny">' + keys.length + ' volume' + (keys.length === 1 ? '' : 's') + '</span></h2>' +
      (keys.length ?
        '<div class="shelf" id="shelf">' + keys.map(function (k) { return bookHtml(k); }).join('') + '</div>' +
        '<div class="shelf-plank"></div>' +
        '<p class="subtitle" style="margin-top:10px">Tap a book to open it</p>'
        :
        '<div class="empty">' + daisyPlaceholder(44) +
        '<p>Write a journal and watch a book appear</p></div>') +
    '</div>' +

    '<div class="card">' +
      '<h2>Mood garden</h2>' +
      (Object.keys(counts).length ?
        BLOOM.MOODS.filter(function (m) { return counts[m.id]; }).sort(function (a, b) { return counts[b.id] - counts[a.id]; }).map(function (m) {
          return '<div style="display:flex;align-items:center;gap:10px;margin:8px 0">' +
            '<img src="' + moodFile(m.id) + '" style="width:30px;height:30px" alt="">' +
            '<span style="font-size:12px;font-weight:800;width:88px">' + m.label + '</span>' +
            '<div style="flex:1;height:12px;background:var(--purple-tint);border-radius:999px;overflow:hidden">' +
            '<div style="height:100%;width:' + Math.round(counts[m.id] / maxC * 100) + '%;background:' + m.color + ';border-radius:999px"></div></div>' +
            '<b style="font-size:12px;color:var(--ink-soft)">' + counts[m.id] + '</b></div>';
        }).join('')
        : '<p class="empty">' + daisyPlaceholder(44) + '<p>Log some moods and your garden grows here</p></p>') +
    '</div>' +

    '<div class="card">' +
      '<h2>Your data</h2>' +
      '<p class="subtitle">Export now and then!</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
        '<button class="pill small" id="export-btn">Export backup</button>' +
        '<button class="pill small" id="import-btn">Import backup</button>' +
        '<button class="pill small danger" id="reset-btn">Reset everything</button>' +
        '<input type="file" id="import-file" accept="application/json" style="display:none">' +
      '</div>' +
    '</div>';

  $('#view-profile').innerHTML = html;

  $('#avatar-btn').addEventListener('click', function () {
    var p = $('#avatar-picker');
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
    if (p.style.display === 'block' && !$('#av-moods').children.length) {
      $('#av-moods').appendChild(moodRow(store.profile.avatarMood, function (id) {
        store.profile.avatarMood = (store.profile.avatarMood === id) ? '' : id;
        persist(); renderProfile();
        toast('Profile updated');
      }));
    }
  });

  bindBooks($('#shelf'), openReader);

  $('#name-save').addEventListener('click', function () {
    store.profile.name = $('#name-input').value.trim();
    persist(); renderProfile();
    toast(store.profile.name ? 'Hi, ' + store.profile.name : 'Back to "friend"');
  });
  $('#name-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('#name-save').click(); });

  $('#export-btn').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bloom-journal-backup-' + BLOOM.todayKey() + '.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    toast('Backup downloaded');
  });
  $('#import-btn').addEventListener('click', function () { $('#import-file').click(); });
  $('#import-file').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var parsed = JSON.parse(r.result);
        if (parsed && parsed.v === 1 && parsed.entries) {
          store = parsed; persist();
          renderProfile(); toast('Welcome back');
        } else uiAlert({ kind: 'warn', title: 'Not a bloom backup', msg: 'That file does not look like a journal export from this app.' });
      } catch (err) { uiAlert({ kind: 'warn', title: 'Could not open it', msg: 'The file could not be read - try exporting a fresh backup from profile.' }); }
    };
    r.readAsText(f);
  });
  $('#reset-btn').addEventListener('click', function () {
    uiConfirm('Delete ALL journal data on this device? export a backup first!', function () {
      store = BLOOM.blank(); persist();
      showView('home'); renderWelcome();
      toast('Fresh start');
    }, 'fresh start?');
  });
}

