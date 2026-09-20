'use strict';

function bookHeight(key) {
  var e = store.entries[key] || {};
  var len = (e.journal || '').length + (e.note || '').length;
  return 96 + Math.min(56, Math.round(len / 9));
}
function bookHtml(key, mini) {
  var e = store.entries[key] || {};
  var m = BLOOM.moodById(e.mood);
  var color = m ? m.color : '#b9aecf';
  var h = bookHeight(key);
  return '<button class="book' + (mini ? ' mini' : '') + '" data-key="' + key + '" ' +
    'style="--bc:' + color + ';--bh:' + h + 'px" aria-label="Open journal for ' + BLOOM.fmtLong(key) + '">' +
    '<span class="spine"><span class="bdate">' + shortDate(key) + '</span>' +
    '<span class="bflower">' + (m ? moodImg(m.id) : daisyPlaceholder(14)) + '</span></span>' +
    '</button>';
}
function bindBooks(root, onOpen) {
  $$('.book', root).forEach(function (b) {
    b.addEventListener('click', function () { onOpen(b.dataset.key); });
  });
}
function openReader(key) {
  var e = store.entries[key] || {};
  var m = BLOOM.moodById(e.mood);
  var body = [];
  if (e.note) body.push('<p class="r-note">' + esc(e.note) + '</p>');
  if (e.journal) body.push('<p class="r-text">' + esc(e.journal).replace(/\n/g, '<br>') + '</p>');
  if (!e.note && !e.journal && !m) body.push('<p class="r-text dim">No words for this day yet, it is still a day you showed up for.</p>');

  var ov = $('#reader');
  ov.hidden = false;
  ov.dataset.key = key;
  $('#reader-page').innerHTML =
    '<div class="r-head">' +
      (m ? moodImg(m.id, 'r-mood') : daisyPlaceholder(44)) +
      '<div><b>' + BLOOM.fmtLong(key) + '</b>' +
      (m ? '<span>Feeling ' + m.label + '</span>' : '<span>No mood tagged</span>') + '</div>' +
    '</div>' +
    '<div class="r-body">' + body.join('') + '</div>' +
    '<div class="r-meta">' +
      (e.medMinutes ? '<span class="tag">Calm ' + e.medMinutes + ' min</span>' : '') +
      (e.updatedAt ? '<span class="tag">Edited ' + shortDate(BLOOM.keyOf(new Date(e.updatedAt))) + '</span>' : '') +
    '</div>' +
    '<div class="r-actions">' +
      '<button class="pill primary small" id="reader-edit">Edit this page</button>' +
      '<button class="pill ghost small" id="reader-close">Close book</button>' +
    '</div>';

  var cover = $('#reader-cover');
  cover.style.setProperty('--cc', m ? m.color : '#b9aecf');
  cover.innerHTML = '<span class="cover-face">' + (m ? moodImg(m.id) : daisyPlaceholder(54)) + '</span>' +
    '<span class="cover-date">' + BLOOM.fmtLong(key) + '</span>';
  cover.classList.remove('swing');
  void cover.offsetWidth;
  cover.classList.add('swing');
  $('#reader').classList.add('show');

  $('#reader-close').addEventListener('click', closeReader);
  $('#reader-edit').addEventListener('click', function () {
    closeReader();
    editKey = key;
    showView('entry');
  });
}
function closeReader() {
  var ov = $('#reader');
  ov.classList.remove('show');
  ov.hidden = true;
  ov.dataset.key = '';
}

