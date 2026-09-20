'use strict';

var BD_W = { circle: .14, rect: .22, photo: .28, streak: .26, mood: .16, text: .3 };
var bdSel = null, bdDrag = null;
function curBoard() { return BLOOM.boardGet(store, BLOOM.todayKey()); }
function bdMeta() {
  var pp = BLOOM.petState(store);
  var e = todayEntry();
  return { streak: pp.streak, petName: pp.name, petImg: pp.img,
    moodSrc: 'assets/moods/' + ((e && e.mood) || 'happy') + '.png' };
}
function bdItemHtml(it, meta) {
  var pos = 'left:' + (it.x * 100).toFixed(2) + '%;top:' + (it.y * 100).toFixed(2) +
    '%;width:' + (it.w * 100).toFixed(2) + '%;transform:rotate(' + (it.rot || 0) + 'deg);';
  var inner;
  if (it.kind === 'circle') inner = '<div class="bd-circle" style="background:' + it.color + '"></div>';
  else if (it.kind === 'rect') inner = '<div class="bd-rect" style="background:' + it.color + '"></div>';
  else if (it.kind === 'photo') inner = '<div class="bd-photo"><img src="' + it.src + '" alt="" draggable="false"></div>';
  else if (it.kind === 'text') inner = '<div class="bd-text" style="color:' + it.color + '">' + esc(it.text || 'a little note') + '</div>';
  else if (it.kind === 'streak') inner = '<div class="bd-streak" style="background:' + (it.color || '#ffffff') + '" title="Streak pet - ' + meta.streak + ' days">' +
    '<img src="' + meta.petImg + '" alt="' + esc(meta.petName) + '"></div>';
  else inner = '<div class="bd-mood"><img src="' + meta.moodSrc + '" alt="" draggable="false"></div>';
  return '<div class="bitem' + (it.id === bdSel ? ' sel' : '') + '" data-id="' + it.id + '" style="' + pos + '">' +
    inner + '<button class="bd-x" data-remove="' + it.id + '" aria-label="Remove">&times;</button></div>';
}
function renderStage() {
  var stage = $('#board-stage');
  if (!stage) return;
  var meta = bdMeta();
  stage.innerHTML = curBoard().items.map(function (it) { return bdItemHtml(it, meta); }).join('') ||
    '<div class="bd-empty">Tap a button below, then drag things around</div>';
}
function bdPersist() {
  var b = curBoard();
  b.savedAt = Date.now();
  persist();
}
function renderBoard() {
  var meta = bdMeta();
  var sw = BD_PALETTE
    .map(function (c) { return '<button class="sw" data-color="' + c + '" style="background:' + c + '" aria-label="Color ' + c + '"></button>'; }).join('');
  $('#view-board').innerHTML =
    '<div class="card board-card">' +
      '<h2>Mood board <span class="tiny">' + esc(BLOOM.fmtLong(BLOOM.todayKey())) + ' · changes save instantly</span></h2>' +
      '<div class="bd-tools">' +
        '<button class="pill small ghost" data-add="circle">Circle</button>' +
        '<button class="pill small ghost" data-add="rect">Rectangle</button>' +
        '<button class="pill small ghost" data-add="photo">Add image</button>' +
        '<button class="pill small ghost" data-add="streak">Streak</button>' +
        '<button class="pill small ghost" data-add="mood">Mood sticker</button>' +
        '<button class="pill small ghost" data-add="text">Text</button>' +
        '<input type="file" id="bd-file" accept="image/*" style="display:none">' +
      '</div>' +
      '<div id="board-stage">' + curBoard().items.map(function (it) { return bdItemHtml(it, meta); }).join('') + '</div>' +
      '<div class="bd-under">' +
        '<div class="bd-swatches">' + sw + '</div>' +
        '<div class="bd-itembar" id="bd-itembar" hidden>' +
          '<button class="pill small ghost" data-act="rot-l">Rotate left</button>' +
          '<button class="pill small ghost" data-act="rot-r">Rotate right</button>' +
          '<button class="pill small ghost" data-act="big">Bigger</button>' +
          '<button class="pill small ghost" data-act="small">Smaller</button>' +
          '<button class="pill small ghost" data-act="front">Front</button>' +
          '<button class="pill small ghost" data-act="edit-text" id="bd-edit-text">Edit text</button>' +
          '<button class="pill small" data-act="remove">Remove</button>' +
        '</div>' +
      '</div>' +
      '<div class="bd-actions">' +
        '<button class="pill primary" id="bd-png">Save as png</button>' +
        '<button class="pill ghost" id="bd-pdf">Save as pdf</button>' +
        '<button class="pill ghost" id="bd-clear">Clear board</button>' +
      '</div>' +
    '</div>';
  renderStage();
  bindBoard();
}
function bdFind(id) {
  var its = curBoard().items;
  for (var i = 0; i < its.length; i++) if (its[i].id === id) return its[i];
  return null;
}
function bdPaintSel() {
  var bar = $('#bd-itembar');
  if (bar) bar.hidden = !bdSel;
  $$('#board-stage .bitem').forEach(function (el) { el.classList.toggle('sel', el.dataset.id === bdSel); });
}
function bindBoard() {
  var stage = $('#board-stage');
  if (!stage) return;
  stage.addEventListener('pointerdown', function (e) {
    var rm = e.target.closest('[data-remove]');
    if (rm) {
      var its = curBoard().items;
      curBoard().items = its.filter(function (x) { return x.id !== rm.dataset.remove; });
      if (bdSel === rm.dataset.remove) bdSel = null;
      bdPersist(); renderStage(); bdPaintSel();
      return;
    }
    var el = e.target.closest('.bitem');
    if (!el) { bdSel = null; bdPaintSel(); return; }
    bdSel = el.dataset.id; bdPaintSel();
    var it = bdFind(bdSel);
    var r = stage.getBoundingClientRect();
    bdDrag = { id: bdSel, moved: false, ox: e.clientX, oy: e.clientY, sx: it.x, sy: it.y, r: r };
    if (e.pointerId !== undefined && el.setPointerCapture) { try { el.setPointerCapture(e.pointerId); } catch (err) {} }
    window.addEventListener('pointermove', bdMoveHandler);
    window.addEventListener('pointerup', bdUpHandler);
  });
  function bdMoveHandler(ev) {
    if (!bdDrag) return;
    var it = bdFind(bdDrag.id);
    if (!it) return;
    if (Math.abs(ev.clientX - bdDrag.ox) + Math.abs(ev.clientY - bdDrag.oy) > 3) bdDrag.moved = true;
    it.x = Math.min(.96, Math.max(0, bdDrag.sx + (ev.clientX - bdDrag.ox) / (bdDrag.r.width || 1)));
    it.y = Math.min(.92, Math.max(0, bdDrag.sy + (ev.clientY - bdDrag.oy) / (bdDrag.r.height || 1)));
    var el = stage.querySelector('[data-id="' + it.id + '"]');
    if (el) { el.style.left = (it.x * 100).toFixed(2) + '%'; el.style.top = (it.y * 100).toFixed(2) + '%'; }
  }
  function bdUpHandler() {
    if (bdDrag && bdDrag.moved) bdPersist();
    bdDrag = null;
    window.removeEventListener('pointermove', bdMoveHandler);
    window.removeEventListener('pointerup', bdUpHandler);
  }
  $$('#view-board [data-add]').forEach(function (b) {
    b.addEventListener('click', function () { bdAdd(b.dataset.add); });
  });
  $$('#view-board [data-color]').forEach(function (b) {
    b.addEventListener('click', function () {
      var it = bdSel && bdFind(bdSel);
      if (it && (it.kind === 'circle' || it.kind === 'rect' || it.kind === 'text' || it.kind === 'streak')) {
        it.color = b.dataset.color; bdPersist(); renderStage(); bdPaintSel();
      } else toast('Select a circle, rectangle, note or streak first');
    });
  });
  $$('#view-board [data-act]').forEach(function (b) {
    b.addEventListener('click', function () {
      var it = bdSel && bdFind(bdSel);
      if (!it) { toast('Tap something on the board first'); return; }
      var act = b.dataset.act;
      if (act === 'rot-l' || act === 'rot-r') it.rot = ((it.rot || 0) + (act === 'rot-l' ? -12 : 12)) % 360;
      else if (act === 'big') it.w = Math.min(.7, it.w * 1.18);
      else if (act === 'small') it.w = Math.max(.07, it.w / 1.18);
      else if (act === 'front') { var its = curBoard().items; its.splice(its.indexOf(it), 1); its.push(it); }
      else if (act === 'remove') { curBoard().items = curBoard().items.filter(function (x) { return x !== it; }); bdSel = null; }
      else if (act === 'edit-text') {
        (function (target) {
          uiPrompt('what should the note say?', target.text || '', function (txt) {
            target.text = txt; bdPersist(); renderStage(); bdPaintSel();
          }, 'edit the note');
        })(it);
        return;
      }
      bdPersist(); renderStage(); bdPaintSel();
    });
  });
  var fi = $('#bd-file');
  if (fi) fi.addEventListener('change', function () {
    var f = fi.files && fi.files[0];
    if (!f) return;
    bdShrink(f, function (url) {
      curBoard().items.push(bdNewItem('photo', { src: url }));
      bdPersist(); renderStage();
      toast('Picture pinned to the board');
    });
    fi.value = '';
  });
  $('#bd-clear').addEventListener('click', function () {
    uiConfirm('clear today\u2019s board? everything pinned on it goes away.', function () {
      curBoard().items = []; bdSel = null;
      bdPersist(); renderStage(); bdPaintSel();
      toast('Board wiped - fresh grid paper');
    }, 'clear the board?');
  });
  $('#bd-png').addEventListener('click', function () {
    bdCanvas(function (c) {
      var name = 'bloom-board-' + BLOOM.todayKey() + '.png';
      var send = function (blob) { blob ? bdDownload(blob, name) : bdDownload(c.toDataURL('image/png'), name); toast('Board saved as a png'); };
      c.toBlob ? c.toBlob(send, 'image/png') : send(null);
    });
  });
  $('#bd-pdf').addEventListener('click', function () {
    bdCanvas(function (c) {
      var url = c.toDataURL('image/jpeg', 0.92);
      var str = BLOOM.pdfFromJpeg(url, c.width, c.height);
      var bytes = new Uint8Array(str.length);
      for (var i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i) & 0xff;
      bdDownload(new Blob([bytes], { type: 'application/pdf' }), 'bloom-board-' + BLOOM.todayKey() + '.pdf');
      toast('Board saved as a pdf');
    });
  });
}
function bdNewItem(kind, extra) {
  var it = {
    id: 'i' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    kind: kind,
    x: .08 + Math.random() * .55, y: .08 + Math.random() * .55,
    w: BD_W[kind] || .2,
    rot: Math.round(Math.random() * 12 - 6),
    color: '#e84a8a'
  };
  for (var k in extra) it[k] = extra[k];
  return it;
}
function bdAdd(kind) {
  var b = curBoard();
  if (kind === 'photo') { $('#bd-file').click(); return; }
  if (kind === 'text') {
    uiPrompt('what should the note say?', 'coffee dates!', function (txt) {
      var bb = curBoard();
      bb.items.push(bdNewItem('text', { text: txt.slice(0, 60), color: '#39508a' }));
      bdSel = bb.items[bb.items.length - 1].id;
      bdPersist(); renderStage(); bdPaintSel();
    }, 'new note');
    return;
  } else {
    b.items.push(bdNewItem(kind, kind === 'streak' ? { color: '#ffffff' } : (kind === 'circle' || kind === 'rect') ? { color: BD_lastColor() } : {}));
  }
  bdSel = b.items[b.items.length - 1].id;
  bdPersist(); renderStage(); bdPaintSel();
}
function BD_lastColor() { return BD_COLORS_CYCLE[(BD_COLORS_CYCLE.i = (BD_COLORS_CYCLE.i || 0) + 1) % BD_COLORS_CYCLE.length]; }
var BD_PALETTE = ['#ffffff', '#000000', '#e84a8a', '#f2c94c', '#7e68b2', '#7db8ea', '#ef5a4f', '#fa8b3d', '#8fbf6f', '#39508a'];
var BD_COLORS_CYCLE = BD_PALETTE.slice(2);
function bdShrink(file, cb) {
  var fr = new FileReader();
  fr.onload = function () {
    var im = new Image();
    im.onload = function () {
      var scale = Math.min(1, 900 / Math.max(im.width, im.height));
      var c = document.createElement('canvas');
      c.width = Math.round(im.width * scale); c.height = Math.round(im.height * scale);
      var x = c.getContext('2d');
      if (!x) { cb(fr.result); return; }
      x.drawImage(im, 0, 0, c.width, c.height);
      try { cb(c.toDataURL('image/jpeg', 0.82)); } catch (e) { cb(fr.result); }
    };
    im.onerror = function () { cb(fr.result); };
    im.src = fr.result;
  };
  fr.readAsDataURL(file);
}
function bdDownload(blobOrUrl, name) {
  var url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  var temp = url.indexOf('blob:') === 0;
  var a = document.createElement('a');
  a.href = url; a.rel = 'noopener';
  if ('download' in a) a.download = name; else a.target = '_blank';
  document.body.appendChild(a);
  try { a.click(); } catch (e) { window.open(url, '_blank'); }
  setTimeout(function () { a.remove(); if (temp) URL.revokeObjectURL(url); }, 4000);
}

function bdCanvas(cb) {
  var meta = bdMeta();
  meta.W = 1200; meta.H = 900;
  var ops = BLOOM.boardOps(curBoard(), meta);
  var c = document.createElement('canvas');
  c.width = 1200; c.height = 900;
  var x = c.getContext('2d');
  if (!x) { toast('This browser cannot draw the export'); return; }
  x.fillStyle = '#fffdf4'; x.fillRect(0, 0, 1200, 900);
  x.strokeStyle = 'rgba(160, 205, 190, .5)'; x.lineWidth = 1.4;
  for (var g = 50; g < 1200; g += 50) { x.beginPath(); x.moveTo(g + .5, 0); x.lineTo(g + .5, 900); x.stroke(); }
  for (var v = 50; v < 900; v += 50) { x.beginPath(); x.moveTo(0, v + .5); x.lineTo(1200, v + .5); x.stroke(); }
  var srcs = {};
  ops.forEach(function (o) { if (o.src) srcs[o.src] = 0; if (o.img) srcs[o.img] = 0; });
  var list = Object.keys(srcs);
  var loaded = {}, pending = list.length;
  function paintAll() {
    ops.forEach(function (o) { bdPaintOp(x, o, loaded, meta); });
    cb(c);
  }
  if (!pending) { paintAll(); return; }
  list.forEach(function (src) {
    var im = new Image();
    im.onload = function () { loaded[src] = im; if (--pending === 0) paintAll(); };
    im.onerror = function () { if (--pending === 0) paintAll(); };
    im.src = src;
  });
}
function bdRoundRect(x, px, py, w, h, r) {
  x.beginPath();
  x.moveTo(px + r, py);
  x.arcTo(px + w, py, px + w, py + h, r);
  x.arcTo(px + w, py + h, px, py + h, r);
  x.arcTo(px, py + h, px, py, r);
  x.arcTo(px, py, px + w, py, r);
  x.closePath();
}
function bdTape(x, cx, ty, w) {
  x.save(); x.translate(cx, ty); x.rotate(-.05);
  x.fillStyle = 'rgba(240, 226, 178, .8)';
  x.fillRect(-w * .18, -9, w * .36, 18);
  x.restore();
}
function bdPaintOp(x, o, loaded, meta) {
  var cx = o.x + o.w / 2, cy = o.y + o.h / 2, img;
  x.save();
  x.translate(cx, cy); x.rotate((o.rot || 0) * Math.PI / 180); x.translate(-cx, -cy);
  x.shadowColor = 'rgba(70, 40, 100, .22)'; x.shadowBlur = 14; x.shadowOffsetY = 5;
  if (o.kind === 'circle') {
    x.fillStyle = o.color;
    x.beginPath(); x.arc(cx, cy, o.w / 2, 0, 7); x.fill();
    x.shadowColor = 'transparent';
    x.lineWidth = 6; x.strokeStyle = '#fffdf6'; x.stroke();
  } else if (o.kind === 'rect') {
    x.fillStyle = o.color;
    bdRoundRect(x, o.x, o.y, o.w, o.h, 10); x.fill();
    x.shadowColor = 'transparent';
    bdTape(x, cx, o.y, o.w);
  } else if (o.kind === 'photo') {
    x.fillStyle = '#ffffff';
    bdRoundRect(x, o.x - 10, o.y - 10, o.w + 20, o.h + 20, 8); x.fill();
    x.shadowColor = 'transparent';
    img = loaded[o.src];
    if (img) x.drawImage(img, o.x, o.y, o.w, o.h);
    bdTape(x, cx, o.y - 14, o.w);
  } else if (o.kind === 'mood') {
    img = loaded[o.src];
    if (img) x.drawImage(img, o.x, o.y, o.w, o.h);
  } else if (o.kind === 'streak') {
    x.fillStyle = o.color || '#ffffff';
    x.beginPath(); x.arc(cx, cy, o.w / 2, 0, 7); x.fill();
    x.shadowColor = 'transparent';
    img = loaded[o.src];
    if (img) {
      x.save();
      x.beginPath(); x.arc(cx, cy, o.w / 2 - 4, 0, 7); x.clip();
      var ps = o.w * .78;
      x.drawImage(img, cx - ps / 2, cy - ps / 2, ps, ps);
      x.restore();
    }
  } else if (o.kind === 'text') {
    x.shadowColor = 'transparent';
    x.fillStyle = o.color;
    var fs = Math.max(14, Math.round(o.w / 8.2));
    x.font = '700 ' + fs + 'px Gaegu, "Comic Sans MS", cursive';
    var words = String(o.text || '').split(/\s+/), line = '', yy = o.y + fs;
    words.forEach(function (wd) {
      if (x.measureText(line + wd).width > o.w && line) { x.fillText(line, o.x, yy); yy += fs * 1.15; line = wd + ' '; }
      else line += wd + ' ';
    });
    if (line.trim()) x.fillText(line, o.x, yy);
  }
  x.restore();
}

