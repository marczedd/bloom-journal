'use strict';

var timerState = { minutes: 15, total: 15 * 60, remaining: 15 * 60, running: false, deadline: 0, tick: null, breathTo: null, audio: null };
var RING_C = 2 * Math.PI * 103;

function fmtTime(s) {
  s = Math.max(0, Math.round(s));
  return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
}
function renderTimer() {
  var frac = timerState.total ? timerState.remaining / timerState.total : 0;
  var e = todayEntry();
  var html =
    '<div class="card timer-card' + (timerState.running ? ' running' : '') + '" id="tcard">' +
      '<h2 style="justify-content:center">Sit with yourself</h2>' +
      '<p class="subtitle">Breathe in when the daisy opens, out when it closes' +
      (e && e.medMinutes ? ' - today: <b>' + e.medMinutes + ' min</b> of calm' : '') + '</p>' +
      '<div class="breath-wrap">' +
        '<svg class="breath-ring" viewBox="0 0 216 216">' +
          '<circle class="trk" cx="108" cy="108" r="103" stroke-dasharray="' + RING_C + '"></circle>' +
          '<circle class="prg" id="ring" cx="108" cy="108" r="103" stroke-dasharray="' + RING_C + '" stroke-dashoffset="' + (RING_C * (1 - frac)) + '"></circle>' +
        '</svg>' +
        '<div class="breath-core">' + moodImg('happy') + '</div>' +
        '<span class="breath-caption" id="bcaption">' + (timerState.running ? 'Breathe in' : 'Ready?') + '</span>' +
      '</div>' +
      '<div class="presets">' +
        [10, 15, 20].map(function (p) {
          return '<button class="preset' + (!timerState.running && timerState.minutes === p ? ' on' : '') + '" data-p="' + p + '">' + p + ' min</button>';
        }).join('') +
      '</div>' +
      '<div class="min-slider"><span>5m</span><input type="range" min="5" max="30" step="1" id="mslider" value="' + timerState.minutes + '"><span>30m</span></div>' +
      '<div class="time-box">' +
        '<div class="time-readout" id="big-readout">' +
          '<b id="t-mm">' + fmtTime(timerState.remaining).split(':')[0] + '</b><i>:</i><b id="t-ss">' + fmtTime(timerState.remaining).split(':')[1] + '</b>' +
        '</div>' +
        '<div class="time-labels"><span>Minutes</span><span></span><span>Seconds</span></div>' +
      '</div>' +
      '<div class="timer-actions">' +
        '<button class="pill primary" id="t-start" style="min-width:120px">' + (timerState.running ? 'Pause' : timerState.remaining < timerState.total ? 'Resume' : 'Start') + '</button>' +
        '<button class="pill ghost" id="t-reset">Reset</button>' +
      '</div>' +
      '<p class="subtitle" style="margin-top:10px;font-size:11px">' +
        (BLOOM.totalMedMinutes(store) ? 'Lifetime calm: ' + BLOOM.totalMedMinutes(store) + ' min' : 'completed sessions are saved into today\u2019s entry') +
      '</p>' +
    '</div>';
  $('#view-timer').innerHTML = html;

  if (timerState.running) startBreathCaption(); else stopBreathCaption();

  $$('#view-timer .preset').forEach(function (b) {
    b.addEventListener('click', function () { if (timerState.running) return; timerState.minutes = +b.dataset.p; setTimerLen(timerState.minutes); renderTimer(); });
  });
  $('#mslider').addEventListener('input', function () {
    if (timerState.running) return;
    timerState.minutes = +this.value; setTimerLen(timerState.minutes);
    var t = fmtTime(timerState.remaining).split(':');
    var mm = $('#t-mm'), ss = $('#t-ss');
    if (mm && ss) { mm.textContent = t[0]; ss.textContent = t[1]; }
    $$('#view-timer .preset').forEach(function (p) { p.classList.toggle('on', +p.dataset.p === timerState.minutes); });
  });
  $('#t-start').addEventListener('click', function () { timerState.running ? pauseTimer() : startTimer(); renderTimer(); });
  $('#t-reset').addEventListener('click', function () { pauseTimer(true); timerState.remaining = timerState.total; renderTimer(); });
}
function setTimerLen(min) { timerState.total = min * 60; timerState.remaining = timerState.total; }

function updateRing() {
  var r = $('#ring'); if (!r) return;
  var frac = timerState.total ? timerState.remaining / timerState.total : 0;
  r.setAttribute('stroke-dashoffset', RING_C * (1 - frac));
  var t = fmtTime(timerState.remaining).split(':');
  var mm = $('#t-mm'), ss = $('#t-ss');
  if (mm && ss) { mm.textContent = t[0]; ss.textContent = t[1]; }
}
function startTimer() {
  ensureAudio();
  if (timerState.remaining <= 0) timerState.remaining = timerState.total;
  timerState.deadline = Date.now() + timerState.remaining * 1000;
  timerState.running = true;
  timerState.tick = setInterval(function () {
    timerState.remaining = Math.max(0, (timerState.deadline - Date.now()) / 1000);
    updateRing();
    if (timerState.remaining <= 0) finishTimer();
  }, 200);
}
function pauseTimer(silent) {
  timerState.running = false;
  if (timerState.tick) { clearInterval(timerState.tick); timerState.tick = null; }
  if (!silent && timerState.remaining > 0) toast('Paused - no pressure');
}
function finishTimer() {
  pauseTimer(true);
  chime();
  var mins = Math.round(timerState.total / 60);
  var key = BLOOM.todayKey();
  var e = store.entries[key] || {};
  BLOOM.setEntry(store, key, { medMinutes: (e.medMinutes || 0) + mins });
  persist();
  checkPetEvolve();
  timerState.remaining = 0;
  var card = $('#tcard');
  if (card) card.classList.add('pop');
  toast('Beautiful. +' + mins + ' min of calm saved to today');
  renderTimer();
}
var PHASES = [
  { txt: 'Breathe in', ms: 4000 },
  { txt: 'Hold', ms: 1000 },
  { txt: 'Breathe out', ms: 5000 }
];
function startBreathCaption() {
  stopBreathCaption();
  var i = 0;
  (function step() {
    var el = $('#bcaption');
    if (el) el.textContent = PHASES[i].txt;
    timerState.breathTo = setTimeout(function () { i = (i + 1) % PHASES.length; step(); }, PHASES[i].ms);
  })();
}
function stopBreathCaption() { if (timerState.breathTo) { clearTimeout(timerState.breathTo); timerState.breathTo = null; } }

function ensureAudio() {
  if (!timerState.audio) {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC) timerState.audio = new AC();
  }
  if (timerState.audio && timerState.audio.state === 'suspended') timerState.audio.resume();
}
function chime() {
  if (!timerState.audio) return;
  var ctx = timerState.audio, t0 = ctx.currentTime;
  [[523.25, 0], [659.25, .3], [783.99, .6], [1046.5, .95]].forEach(function (pair) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = pair[0];
    g.gain.setValueAtTime(0, t0 + pair[1]);
    g.gain.linearRampToValueAtTime(.16, t0 + pair[1] + .03);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + pair[1] + 1.4);
    o.connect(g).connect(ctx.destination);
    o.start(t0 + pair[1]); o.stop(t0 + pair[1] + 1.5);
  });
}

