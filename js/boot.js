'use strict';

function renderWelcome() {
  if (store.profile.name) return;
  var ov = $('#overlay');
  ov.hidden = false;
  ov.innerHTML =
    '<div class="ov-card">' +
      '<img class="bigflower" src="assets/moods/happy.png" alt="Bloom daisy">' +
      '<h3>Hi, stranger</h3>' +
      '<p>This is your cozy corner to log moods, journal, read affirmations and breathe.<br><br>What should your daisies call you?</p>' +
      '<div class="name-row" style="margin-top:0"><input class="name-input" id="w-name" maxlength="24" placeholder="Your name" autofocus></div>' +
      '<button class="pill primary" id="w-go" style="margin-top:12px;width:100%">Enter my garden</button>' +
    '</div>';
  var go = function () {
    store.profile.name = $('#w-name').value.trim();
    if (!store.profile.name) { $('#w-name').focus(); return; }
    persist(); ov.hidden = true;
    showWelcomeLoader(store.profile.name);
    renderHome();
    toast('Welcome, ' + store.profile.name);
  };
  $('#w-go').addEventListener('click', go);
  $('#w-name').addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
}

function showWelcomeLoader(name) {
  var old = document.getElementById('load-screen');
  if (old) old.remove();
  var d = document.createElement('div');
  d.id = 'load-screen';
  var petals = '';
  for (var i = 0; i < 8; i++) petals += '<i style="--p:' + i + '"></i>';
  d.innerHTML =
    '<div class="ls-daisy" aria-hidden="true">' + petals + '<b></b></div>' +
    '<p class="ls-txt">Planting your garden, ' + esc(name) + '</p>' +
    '<div class="ls-dots" aria-hidden="true"><i></i><i></i><i></i></div>';
  document.body.appendChild(d);
  setTimeout(function () {
    d.classList.add('out');
    setTimeout(function () { if (d.parentNode) d.remove(); }, 430);
  }, 1500);
}

function placeDoodles() {
  var spots = [
    { x: '6%', y: '12%', s: 30, c: '#ffd766', cls: 'd1', svg: '<path d="M15 1 L18 12 L29 15 L18 18 L15 29 L12 18 L1 15 L12 12 Z" fill="currentColor"/>' },
    { x: '88%', y: '9%', s: 26, c: '#ff9ec6', cls: 'd2', svg: '<path d="M13 23 C4 16 1 11 1 7.5 C1 3.9 3.9 1 7.4 1 C9.9 1 11.9 2.4 13 4.2 C14.1 2.4 16.1 1 18.6 1 C22.1 1 25 3.9 25 7.5 C25 11 22 16 13 23Z" fill="currentColor"/>' },
    { x: '4%', y: '72%', s: 24, c: '#c9b3ef', cls: 'd3', svg: '<circle cx="12" cy="12" r="4" fill="currentColor"/><g stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 1v4M12 19v4M1 12h4M19 12h4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M19.8 4.2 17 7M7 17l-2.8 2.8"/></g>' },
    { x: '91%', y: '64%', s: 30, c: '#a4dcc0', cls: 'd4', svg: '<path d="M15 1 L18 12 L29 15 L18 18 L15 29 L12 18 L1 15 L12 12 Z" fill="currentColor"/>' },
    { x: '78%', y: '88%', s: 20, c: '#ffd766', cls: 'd2', svg: '<path d="M10 1 L12.4 7.6 L19 10 L12.4 12.4 L10 19 L7.6 12.4 L1 10 L7.6 7.6 Z" fill="currentColor"/>' },
    { x: '20%', y: '90%', s: 22, c: '#ff9ec6', cls: 'd3', svg: '<path d="M11 19 C3.5 13.5 1 9.5 1 6.4 C1 3.4 3.3 1 6.2 1 C8.4 1 10.1 2.1 11 3.6 C11.9 2.1 13.6 1 15.8 1 C18.7 1 21 3.4 21 6.4 C21 9.5 18.5 13.5 11 19Z" fill="currentColor"/>' }
  ];
  var petals = [
    { x: '14%', c: '#ff9ec6', cls: '', size: 13 },
    { x: '58%', c: '#c9b3ef', cls: 'p2', size: 10 },
    { x: '83%', c: '#ffd766', cls: 'p3', size: 12 }
  ];
  petals.forEach(function (pt) {
    var el = document.createElement('span');
    el.className = 'petal ' + pt.cls;
    el.style.cssText = 'left:' + pt.x + ';color:' + pt.c;
    el.innerHTML = '<svg viewBox="0 0 14 14" width="' + pt.size + '" height="' + pt.size + '"><ellipse cx="7" cy="7" rx="6" ry="3.6" fill="currentColor"/></svg>';
    document.body.appendChild(el);
  });
  spots.forEach(function (p) {
    var d = document.createElement('span');
    d.className = 'doodle ' + p.cls;
    d.style.cssText = 'left:' + p.x + ';top:' + p.y + ';width:' + p.s + 'px;color:' + p.c;
    d.innerHTML = '<svg viewBox="0 0 30 30" width="' + p.s + '" height="' + p.s + '" aria-hidden="true">' + p.svg + '</svg>';
    document.body.appendChild(d);
  });
}

function boot() {
  mountShell();
  if (LS.__fallback) setTimeout(function () { toast('Opened from a file, so this journal only lasts until reload, use the served link to save for good'); }, 900);
  $('#topdate').textContent = BLOOM.fmtLong(BLOOM.todayKey());
  buildDock();
  placeDoodles();
  showView('home');
  renderWelcome();
  checkPetEvolve();
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if ($('#alert-pop')) { uiCloseAlert(); return; }
    if (!$('#reader').hidden) { closeReader(); return; }
    closeRadial();
  });

  var lastDay = BLOOM.todayKey();
  function petTick() {
    var k = BLOOM.todayKey();
    if (k !== lastDay) { lastDay = k; checkPetEvolve(); showView(currentView); }
    else if (currentView === 'board') renderStage();
  }
  setInterval(petTick, 60000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { checkPetEvolve(); showView(currentView); }
  });
  $('#reader').addEventListener('click', function (e) {
    if (e.target === this) closeReader();
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
