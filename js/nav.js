'use strict';

var NAV = [
  { id: 'home',     file: 'home.png',     label: 'Home' },
  { id: 'calendar', file: 'calendar.png', label: 'Calendar' },
  { id: 'board',    file: 'board.png',    label: 'Board' },
  { id: 'entry',    icon: 'plus',         file: 'plus.png', label: 'Log', center: true },
  { id: 'timer',    file: 'timer.png',    label: 'Timer' },
  { id: 'profile',  file: 'profile.png',  label: 'Profile' }
];
var SVG_ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3.6 11.4 12 4.2l8.4 7.2"/><path d="M5.8 10.6V19a1.4 1.4 0 0 0 1.4 1.4h9.6A1.4 1.4 0 0 0 18.2 19v-8.4"/><path d="M9.8 20.4v-5.2h4.4v5.2"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3.4" y="5.4" width="17.2" height="15.2" rx="3"/><path d="M3.4 10h17.2M8 3.2v3.8M16 3.2v3.8"/></svg>',
  board: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3.4" y="4.6" width="17.2" height="14.8" rx="2.8"/><circle cx="9" cy="10.2" r="1.9"/><path d="M4.8 17.4 10 12.4l3.1 2.7 2.6-2.1 3.5 3.3"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5.6v12.8M5.6 12h12.8"/></svg>',
  timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13.4" r="7.6"/><path d="M12 9.6v3.8l2.6 1.8M9.6 3h4.8"/></svg>',
  profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.2" r="3.8"/><path d="M4.8 20.2c1-3.6 3.9-5.4 7.2-5.4s6.2 1.8 7.2 5.4"/></svg>'
};
function buildDock() {
  var ready = {};
  var dock = $('#dock');
  var radial = document.createElement('div');
  radial.id = 'radial';
  radial.className = 'radial';
  document.body.appendChild(radial);
  function iconHtml(n) {
    return ready[n.id] === 'ok'
      ? '<img src="assets/icons/' + n.file + '" alt="" draggable="false">'
      : svgIcon(n.icon || n.id);
  }
  function navGo(v) {
    if (v === 'entry') editKey = null;
    if (v === 'calendar') {
      var d = new Date();
      calView = { y: d.getFullYear(), m: d.getMonth() };
    }
    closeRadial();
    showView(v);
  }
  function paint() {
    dock.innerHTML = '';
    NAV.forEach(function (n) {
      var btn = document.createElement('button');
      btn.className = 'tab' + (n.center ? ' center' : '');
      btn.dataset.view = n.id;
      btn.setAttribute('aria-label', n.label);
      btn.innerHTML = '<span class="halo">' + iconHtml(n) + '</span>' +
        (n.center ? '' : '<small>' + n.label + '</small>');
      dock.appendChild(btn);
    });

    var fans = NAV.filter(function (n) { return !n.center; });
    var cen = NAV.filter(function (n) { return n.center; })[0];
    radial.innerHTML = '<div class="rad-bd" id="radial-bd"></div><div class="rad-mech">' +
      fans.map(function (n, i) {
        return '<button class="rb fan" data-view="' + n.id + '" aria-label="' + n.label +
          '" style="--a:' + (194 + i * 38) + 'deg;--i:' + i + '">' + iconHtml(n) + '</button>';
      }).join('') +
      '<button class="rb center" data-view="' + cen.id + '" aria-label="Log today">' + iconHtml(cen) + '</button>' +
      '<button class="rb fab" id="radial-fab" aria-label="Menu" aria-expanded="false">' +
        '<span class="ic-menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 8h14M5 12h10M5 16h14"/></svg></span>' +
        '<span class="ic-x"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M7 7l10 10M17 7 7 17"/></svg></span>' +
      '</button></div>';
    markDock();
  }
  function onNav(e) {
    var pick = e.target.closest('.rb[data-view], .tab');
    if (pick) navGo(pick.dataset.view);
  }
  dock.addEventListener('click', onNav);
  radial.addEventListener('click', function (e) {
    if (e.target.closest('#radial-fab')) { toggleRadial(); return; }
    if (e.target.closest('#radial-bd')) { closeRadial(); return; }
    onNav(e);
  });
  paint();
  NAV.forEach(function (n) {
    var im = new Image();
    im.onload = function () { ready[n.id] = 'ok'; paint(); };
    im.onerror = function () { ready[n.id] = 'svg'; };
    im.src = 'assets/icons/' + n.file;
  });
}
function toggleRadial() {
  var r = $('#radial');
  if (!r) return;
  var open = r.classList.toggle('open');
  var f = $('#radial-fab');
  if (f) f.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function closeRadial() {
  var r = $('#radial');
  if (!r) return;
  r.classList.remove('open');
  var f = $('#radial-fab');
  if (f) f.setAttribute('aria-expanded', 'false');
}
function svgIcon(id) {
  var wrap = document.createElement('span');
  wrap.innerHTML = SVG_ICONS[id];
  var svg = wrap.querySelector('svg');
  if (!svg) return '';
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  return svg.outerHTML;
}
function markDock() {
  $$('#dock .tab, #radial .rb[data-view]').forEach(function (t) {
    t.classList.toggle('on', t.dataset.view === currentView);
  });
}

function showView(v) {
  closeRadial();
  if (v === 'entry') { if (currentView !== 'entry') lastView = currentView; }
  currentView = v;
  ['home', 'calendar', 'board', 'entry', 'timer', 'profile'].forEach(function (id) {
    $('#view-' + id).hidden = id !== v;
  });
  if (v === 'home') renderHome();
  if (v === 'board') renderBoard();
  if (v === 'calendar') renderCalendar();
  if (v === 'entry') renderEntry();
  if (v === 'timer') renderTimer();
  if (v === 'profile') renderProfile();
  markDock();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
