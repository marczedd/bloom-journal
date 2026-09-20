'use strict';

var curPrompt = null;
var draft = { key: null, mood: null, note: '', journal: '', moodDirty: false };

function freshDraft(key) {
  var e = BLOOM.getEntry(store, key);
  return {
    key: key,
    mood: (e && e.mood) || null,
    note: (e && e.note) || '',
    journal: (e && e.journal) || '',
    moodDirty: false
  };
}

function renderEntry() {
  var key = editKey || BLOOM.todayKey();
  if (draft.key !== key) draft = freshDraft(key);
  var e = BLOOM.getEntry(store, key);
  var isNew = !BLOOM.hasContent(e);
  var shownMood = BLOOM.moodById(draft.mood);

  var html =
    '<div class="card" style="overflow:visible">' +
      '<span class="sticker pinky">' + (isNew ? 'New entry' : 'Editing') + '</span>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px">' +
        '<div><span class="editor-date">' + BLOOM.fmtLong(key) + '</span>' +
        '<h2 style="margin-bottom:0">' + (isNew ? "What's on your mind today?" : 'Edit this day') + '</h2></div>' +
        (key !== BLOOM.todayKey() ? '<button class="pill small ghost" id="go-today">Go to today</button>' : '') +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<h2>Mood <span class="tiny">' + (shownMood ? shownMood.label : 'Optional - tap to pick, tap again to remove') + '</span></h2>' +
      '<div id="entry-moods"></div>' +
    '</div>' +

    '<div class="card">' +
      '<h2>Note & journal</h2>' +
      '<div class="field"><label>Quick note <span style="font-weight:600;color:var(--ink-soft)">Optional</span></label>' +
        '<input type="text" id="f-note" maxlength="140" placeholder="One line about this day…" value="' + esc(draft.note) + '"></div>' +
      '<div class="field"><label>Journal <button class="pill small" id="prompt-btn" type="button" style="padding:3px 10px;font-size:11px">Writing prompt</button></label>' +
        '<textarea id="f-journal" placeholder="Dear diary… type anything. no rules, no judge.">' + esc(draft.journal) + '</textarea></div>' +
      (curPrompt ? '<span class="prompt-chip">' + esc(curPrompt) + '</span>' : '') +
      '<div class="entry-actions">' +
        (!isNew ? '<button class="pill danger" id="del-entry">Clear this day</button>' : '') +
        '<button class="pill primary" id="save-entry">Save entry</button>' +
      '</div>' +
    '</div>';

  $('#view-entry').innerHTML = html;

  function rebuildMoodRow() {
    var holder = $('#entry-moods');
    if (!holder) return;
    holder.innerHTML = '';
    holder.appendChild(moodRow(draft.mood, function (id) {
      draft.mood = (draft.mood === id) ? null : id;
      draft.moodDirty = true;
      rebuildMoodRow();
    }));
  }
  rebuildMoodRow();

  var ta = $('#f-journal');
  ta.addEventListener('input', function () { draft.journal = ta.value; autoGrow(ta); });
  autoGrow(ta);
  $('#f-note').addEventListener('input', function () { draft.note = this.value; });

  var pb = $('#prompt-btn');
  if (pb) pb.addEventListener('click', function () {
    curPrompt = BLOOM.randomPrompt(curPrompt);
    var chip = $('.prompt-chip');
    if (chip) chip.textContent = curPrompt;
    else renderEntry();
    toast('A little nudge');
  });

  var gt = $('#go-today');
  if (gt) gt.addEventListener('click', function () { editKey = null; draft = freshDraft(BLOOM.todayKey()); renderEntry(); });

  $('#save-entry').addEventListener('click', function () {
    var hadJournal = !!(e && e.journal);
    var patch = {
      note: $('#f-note').value.trim(),
      journal: $('#f-journal').value.trim()
    };
    if (draft.moodDirty) patch.mood = draft.mood;
    BLOOM.setEntry(store, key, patch);
    persist();
    draft = freshDraft(key);
    var addedBook = !hadJournal && patch.journal;
    curPrompt = null;
    flashKey = key;
    toast(addedBook ? 'Saved - a new book joins your shelf' : 'Saved to your garden');
    checkPetEvolve();
    showView(lastView === 'entry' ? 'home' : lastView);
  });

  var del = $('#del-entry');
  if (del) del.addEventListener('click', function () {
    uiConfirm('Clear the mood, note and journal saved for ' + BLOOM.fmtLong(key) + '?', function () {
      delete store.entries[key];
      persist();
      draft = freshDraft(key);
      toast('Cleared - this day is blank again');
      renderEntry();
    }, 'wipe this day?');
  });
}
function autoGrow(ta) { ta.style.height = 'auto'; ta.style.height = Math.max(190, ta.scrollHeight) + 'px'; }

