'use strict';

var LS_KEY = 'bloom-journal-v1';
var LS = (function () {
  try {
    var t = '__ls_probe__';
    localStorage.setItem(t, '1');
    localStorage.removeItem(t);
    return localStorage;
  } catch (e) {
    var mem = {};
    return {
      __fallback: true,
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
      setItem: function (k, v) { mem[k] = String(v); },
      removeItem: function (k) { delete mem[k]; }
    };
  }
})();
var store = BLOOM.load(LS.getItem(LS_KEY));

var $ = function (sel, el) { return (el || document).querySelector(sel); };
var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
var esc = BLOOM.escapeHtml;

var currentView = 'home';
var lastView = 'home';
var editKey = null;
var calView = (function () { var d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; })();
var affSalt = 0;
var toastTimer = null;
var flashKey = null;

function persist() { LS.setItem(LS_KEY, BLOOM.save(store)); }
function toast(msg) {
  var t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
}
var alertOnKey = null;
function alertFlowerSvg(kind) {
  var c = kind === 'warn' ? '#e84a8a' : '#b39df5';
  var petals = '';
  for (var i = 0; i < 6; i++) {
    var a = (i * 60 - 90) * Math.PI / 180;
    petals += '<circle cx="' + (24 + Math.cos(a) * 10.4).toFixed(1) + '" cy="' + (24 + Math.sin(a) * 10.4).toFixed(1) + '" r="7.6" fill="' + c + '"/>';
  }
  var face = kind === 'warn'
    ? '<path d="M24 20v4.6M24 28v.4" stroke="#7a2b45" stroke-width="2.6" stroke-linecap="round" fill="none"/>'
    : '<path d="M20.6 23c1.2 2.6 5.6 2.6 6.8 0" stroke="#6b4a2b" stroke-width="2" fill="none" stroke-linecap="round"/>';
  return '<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">' + petals +
    '<circle cx="24" cy="24" r="6.8" fill="#ffd766"/>' + face + '</svg>';
}
function uiCloseAlert() {
  var d = $('#alert-pop');
  if (d) d.remove();
  if (alertOnKey) { document.removeEventListener('keydown', alertOnKey); alertOnKey = null; }
}
function uiAlert(opts) {
  uiCloseAlert();
  var d = document.createElement('div');
  d.id = 'alert-pop';
  d.setAttribute('role', 'dialog');
  d.setAttribute('aria-modal', 'true');
  d.innerHTML = '<div class="ap-card ' + (opts.kind || '') + '">' +
    '<div class="ap-icon">' + alertFlowerSvg(opts.kind) + '</div>' +
    '<h2>' + esc(opts.title || 'bloom says') + '</h2>' +
    (opts.msg ? '<p>' + esc(opts.msg) + '</p>' : '') +
    (opts.input !== undefined ? '<input class="ap-input" id="ap-input" maxlength="60" value="' + esc(opts.input) + '" placeholder="' + esc(opts.placeholder || 'type it…') + '">' : '') +
    '<div class="ap-row">' +
      (opts.cancel ? '<button class="pill ghost" id="ap-no">' + esc(opts.cancel) + '</button>' : '') +
      '<button class="pill primary" id="ap-ok">' + esc(opts.ok || 'okay') + '</button>' +
    '</div></div>';
  document.body.appendChild(d);
  function go(yes) {
    var v = opts.input !== undefined ? (d.querySelector('#ap-input').value || '').trim() : null;
    uiCloseAlert();
    if (yes) { if (opts.onOk) opts.onOk(v); }
    else if (opts.onCancel) opts.onCancel();
  }
  d.querySelector('#ap-ok').addEventListener('click', function () { go(true); });
  var no = d.querySelector('#ap-no');
  if (no) no.addEventListener('click', function () { go(false); });
  d.addEventListener('click', function (e) { if (e.target === d) go(false); });
  alertOnKey = function (e) {
    if (e.key === 'Escape') go(false);
    else if (e.key === 'Enter') go(true);
  };
  document.addEventListener('keydown', alertOnKey);
  var inp = d.querySelector('#ap-input');
  if (inp) { inp.focus(); inp.select(); }
}
function uiConfirm(msg, onYes, title) {
  uiAlert({ title: title || 'are you sure?', kind: 'warn', msg: msg, ok: 'Yes, do it', cancel: 'Nope', onOk: onYes });
}
function uiPrompt(msg, def, cb, title) {
  uiAlert({ title: title || 'what should it be?', msg: msg, input: def || '', ok: 'Save', cancel: 'Later',
    onOk: function (v) { if (v) cb(v.slice(0, 60)); } });
}

function mountShell() {
  var app = $('#app');
  if (!app) return;
  var views = ['home', 'calendar', 'board', 'entry', 'timer', 'profile'].map(function (v) {
    return '<section class="view" id="view-' + v + '"' + (v === 'home' ? '' : ' hidden') + '></section>';
  }).join('');
  app.innerHTML =
    '<header class="topbar"><div class="brand"><img id="brand-logo" src="assets/logo.png" alt="Bloom"></div>' +
    '<div class="topdate" id="topdate">Today</div></header>' +
    '<main>' + views + '</main>' +
    '<footer class="credit">Only for my pretty baby!</b></footer>';
  function add(tag, id, html, hidden) {
    if (document.getElementById(id)) return;
    var el = document.createElement(tag);
    el.id = id;
    if (html) el.innerHTML = html;
    if (hidden) el.hidden = true;
    document.body.appendChild(el);
    return el;
  }
  add('nav', 'dock', '', false).setAttribute('aria-label', 'main navigation');
  add('div', 'toast').setAttribute('role', 'status');
  $('#toast').setAttribute('aria-live', 'polite');
  add('div', 'overlay', '', true);
  add('div', 'reader', '<div class="reader-stage"><div class="reader-page" id="reader-page"></div><div id="reader-cover"></div></div>', true)
    .setAttribute('aria-label', 'journal book reader');
}

function moodFile(id) {
  var m = BLOOM.moodById(id);
  return m ? 'assets/moods/' + m.id + '.png' : null;
}
function moodImg(id, cls) {
  var f = moodFile(id);
  if (!f) return '';
  return '<img class="' + (cls || '') + '" src="' + f + '" alt="' + esc(BLOOM.moodById(id).label) + ' face" draggable="false">';
}
function daisyPlaceholder(size) {
  return '<svg viewBox="0 0 48 48" width="' + (size || 40) + '" height="' + (size || 40) + '" aria-hidden="true">' +
    '<g fill="none" stroke="#c9b3ef" stroke-width="2.4">' +
    '<circle cx="24" cy="12" r="7.6"/><circle cx="35.4" cy="20.2" r="7.6"/><circle cx="31" cy="33.1" r="7.6"/>' +
    '<circle cx="17" cy="33.1" r="7.6"/><circle cx="12.6" cy="20.2" r="7.6"/></g>' +
    '<circle cx="24" cy="24" r="5.4" fill="#e6dcf7"/></svg>';
}
function todayEntry() { return BLOOM.getEntry(store, BLOOM.todayKey()); }
function displayName() { return store.profile.name || 'friend'; }
function shortDate(key) {
  var d = BLOOM.parseKey(key);
  var mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return mo[d.getMonth()] + ' ' + d.getDate();
}

function greeting() {
  var h = new Date().getHours();
  if (h < 5) return 'Up late, huh?';
  if (h < 11) return 'Good morning';
  if (h < 14) return 'Good noon';
  if (h < 18) return 'Good afternoon';
  if (h < 22) return 'Good evening';
  return 'Sweet night';
}

function moodRow(selected, onPick) {
  var wrap = document.createElement('div');
  wrap.className = 'moodrow';
  BLOOM.MOODS.forEach(function (m) {
    var b = document.createElement('button');
    b.className = 'moodbtn' + (selected === m.id ? ' on' : '');
    if (selected === m.id) { b.style.background = m.tint; b.style.borderColor = m.color; }
    b.innerHTML = moodImg(m.id) + '<span class="mname">' + m.label + '</span>';
    b.title = m.label;
    b.setAttribute('aria-label', 'mood: ' + m.label);
    b.addEventListener('click', function () { onPick(m.id); });
    wrap.appendChild(b);
  });
  return wrap;
}

