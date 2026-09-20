(function () {
  'use strict';
  var files = ['ui', 'nav', 'books', 'home', 'calendar', 'board', 'entry', 'timer', 'profile', 'boot'];
  var v = '?v=20260922b';
  document.write(files.map(function (f) {
    return '<script src="js/' + f + '.js' + v + '"><\/script>';
  }).join(''));
})();
