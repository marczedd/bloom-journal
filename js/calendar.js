'use strict';

function renderCalendar() {
  var cells = BLOOM.monthGrid(calView.y, calView.m);
  var todayK = BLOOM.todayKey();
  var html =
    '<div class="card cal-card">' +
      '<div class="cal-head">' +
        '<button class="cal-arrow" id="cal-prev" aria-label="Previous month"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg></button>' +
        '<b>' + BLOOM.monthLabel(calView.y, calView.m) + '</b>' +
        '<div class="cal-nav">' +
          '<button class="pill small ghost" id="cal-today">Today</button>' +
          '<button class="cal-arrow" id="cal-next" aria-label="Next month"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg></button>' +
        '</div>' +
      '</div>' +
      '<div class="cal-grid">' +
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(function (d) { return '<span class="dow">' + d + '</span>'; }).join('');

  cells.forEach(function (c) {
    if (!c) { html += '<span class="day pad"></span>'; return; }
    var e = store.entries[c.key];
    var mm = e && BLOOM.moodById(e.mood);
    html += '<button class="day' + (c.key === todayK ? ' today' : '') + (mm ? ' logged' : '') + '"' +
      (c.future ? ' disabled' : '') +
      ' data-key="' + c.key + '" title="' + BLOOM.fmtLong(c.key) + (mm ? ' - ' + mm.label : '') + '"' +
      (mm ? ' style="--mc:' + mm.tint + ';--me:' + mm.color + '"' : '') + '>' +
      '<span class="num">' + c.day + '</span>' +
      '<span class="bloom">' + (mm ? moodImg(mm.id) : '') + '</span>' +
      '</button>';
  });

  html += '</div>' +
      '<p class="subtitle" style="text-align:center;margin-top:12px">Tap a day to view or change its mood</p>' +
    '</div>' +

    '<div class="card legend-card">' +
      '<h2>Mood key</h2>' +
      '<div class="cal-legend">' +
      BLOOM.MOODS.map(function (m) {
        return '<span class="lg"><img src="' + moodFile(m.id) + '" alt="">' + m.label + '</span>';
      }).join('') +
      '</div>' +
      '<div class="month-stats">' +
        '<span class="ms"><b>' + BLOOM.monthEntryCount(store, calView.y, calView.m) + '</b> days logged this month</span>' +
        '<span class="ms"><b>' + BLOOM.streak(store) + '</b> day streak</span>' +
      '</div>' +
    '</div>';

  $('#view-calendar').innerHTML = html;

  $('#cal-prev').addEventListener('click', function () {
    calView.m--; if (calView.m < 0) { calView.m = 11; calView.y--; } renderCalendar();
  });
  $('#cal-next').addEventListener('click', function () {
    if (calView.y * 12 + calView.m >= new Date().getFullYear() * 12 + new Date().getMonth()) {
      calView = { y: new Date().getFullYear(), m: new Date().getMonth() }; renderCalendar();
      toast('The future is still a blank page');
      return;
    }
    calView.m++; if (calView.m > 11) { calView.m = 0; calView.y++; } renderCalendar();
  });
  $('#cal-today').addEventListener('click', function () {
    var d = new Date(); calView = { y: d.getFullYear(), m: d.getMonth() }; renderCalendar();
  });
  $$('#view-calendar .day[data-key]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.disabled) return;
      editKey = b.dataset.key;
      showView('entry');
    });
  });
  if (flashKey) {
    var fcell = $('#view-calendar .day[data-key="' + flashKey + '"]');
    if (fcell) fcell.classList.add('flash');
    flashKey = null;
  }
}

