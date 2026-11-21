// Rezeptbuch: Raster (#/), Rezept (#/r/<id>), Buch (#/buch/<nr>)
var rezepte = [];
function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

// ---------- Portionen-Rechner ----------
var gewaehlt = {};   // id -> gewählte Portionen (nur für diese Sitzung)
var BRUCH = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 };
var MENGE = /^(ca\.?\s*)?(\d+\s+[½¼¾⅓⅔⅛]|\d+\/\d+|\d+(?:[.,]\d+)?|[½¼¾⅓⅔⅛])(\s*[-–]\s*(\d+(?:[.,]\d+)?))?/;

function zahl(t) {
  t = t.trim();
  var m = t.match(/^(\d+)\s+([½¼¾⅓⅔⅛])$/);
  if (m) return parseInt(m[1], 10) + BRUCH[m[2]];
  if (BRUCH[t]) return BRUCH[t];
  if (t.indexOf('/') > 0) { var p = t.split('/'); return parseFloat(p[0]) / parseFloat(p[1]); }
  return parseFloat(t.replace(',', '.'));
}

function schoen(x) {
  var r = x >= 10 ? Math.round(x) : Math.round(x * 10) / 10;
  if (Math.abs(r - 0.5) < 0.01) return '½';
  if (Math.abs(r - 0.25) < 0.01 || Math.abs(x - 0.25) < 0.01) return '¼';
  return String(r).replace('.', ',');
}

// Skaliert die Mengenangabe am Anfang einer Zutat ("200 g Mehl", "1,2 l Brühe", "7–10 g Paprika")
function skaliere(z, f) {
  if (f === 1 || /pro (person|portion)|per (person|serving)|nach geschmack|etwas|prise/i.test(z)) return z;
  var m = z.match(MENGE);
  if (!m) return z;
  var neu = (m[1] || '') + schoen(zahl(m[2]) * f);
  if (m[4]) neu += '–' + schoen(zahl(m[4]) * f);
  return neu + z.slice(m[0].length);
}

function basis(r) { return r.portionen > 0 ? r.portionen : 1; }

function zutatenHTML(r) {
  var b = basis(r), n = gewaehlt[r.id] || b, f = n / b;
  return (r.zutaten || []).map(function (z) { return '<li>' + esc(skaliere(z, f)) + '</li>'; }).join('');
}

function reglerText(r) {
  var n = gewaehlt[r.id] || basis(r);
  return r.portionen > 0 ? n + (n === 1 ? ' Portion' : ' Portionen') : '× ' + n;
}

function aendern(id, d) {
  var r = rezepte.filter(function (x) { return x.id === id; })[0];
  if (!r) return;
  var n = (gewaehlt[r.id] || basis(r)) + d;
  if (n < 1) return;
  gewaehlt[r.id] = n;
  var boxen = document.querySelectorAll('[data-rezept="' + id + '"]');
  for (var i = 0; i < boxen.length; i++) {
    boxen[i].querySelector('.zutaten').innerHTML = zutatenHTML(r);
    boxen[i].querySelector('.regler-zahl').textContent = reglerText(r);
  }
}

document.addEventListener('click', function (e) {
  var t = e.target;
  if (!t.classList || !t.classList.contains('regler-knopf')) return;
  e.preventDefault();
  var box = t.closest('[data-rezept]');
  aendern(box.getAttribute('data-rezept'), parseInt(t.getAttribute('data-d'), 10));
});

// Rezept als schlichter Text
function rezeptHTML(r, mitBild) {
  var h = '<div class="text" data-rezept="' + esc(r.id) + '">';
  if (mitBild && r.bild) h += '<img src="' + esc(r.bild) + '" alt="">';
  h += '<h1>' + esc(r.titel) + '</h1>';
  if (r.zeit) h += '<p class="info">' + esc(r.zeit) + '</p>';
  if (r.zutaten && r.zutaten.length) {
    h += '<div class="zutaten-kopf"><h2>Zutaten</h2>' +
         '<span class="regler"><a href="#" class="regler-knopf" data-d="-1">−</a>' +
         '<span class="regler-zahl">' + esc(reglerText(r)) + '</span>' +
         '<a href="#" class="regler-knopf" data-d="1">+</a></span></div>' +
         '<ul class="zutaten">' + zutatenHTML(r) + '</ul>';
  }
  if (r.schritte && r.schritte.length) {
    h += '<h2>Zubereitung</h2><ol>' + r.schritte.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
  }
  if (r.hinweise) h += '<p class="hinweise">' + esc(r.hinweise) + '</p>';
  if (r.quelle) h += '<a class="quelle" href="' + esc(r.quelle) + '" target="_blank" rel="noopener">Original-Video</a>';
  return h + '</div>';
}

function zeigeRaster() {
  $('raster').innerHTML = rezepte.map(function (r) {
    var inner = r.bild ? '<img src="' + esc(r.bild) + '" alt="" loading="lazy">'
                       : '<span class="ohne-bild">' + esc(r.titel) + '</span>';
    return '<a href="#/r/' + encodeURIComponent(r.id) + '">' + inner + '</a>';
  }).join('');
}

function zeigeRezept(id) {
  var r = rezepte.filter(function (x) { return x.id === id; })[0];
  if (!r) { location.hash = '#/'; return; }
  $('rezept-inhalt').innerHTML = rezeptHTML(r, false);
}

function zeigeBuch(nr) {
  var n = rezepte.length;
  nr = Math.min(Math.max(nr || 1, 1), n);
  $('buch-seite').innerHTML = rezeptHTML(rezepte[nr - 1], true);
  $('buch-zahl').textContent = nr + ' / ' + n;
  $('buch-zurueck').href = '#/buch/' + (nr - 1);
  $('buch-weiter').href = '#/buch/' + (nr + 1);
  $('buch-zurueck').className = nr <= 1 ? 'aus' : '';
  $('buch-weiter').className = nr >= n ? 'aus' : '';
}

function route() {
  var h = location.hash.replace(/^#\/?/, '');
  var teile = h.split('/');
  var ansicht = teile[0] === 'r' ? 'rezept' : teile[0] === 'buch' ? 'buch' : 'raster';
  var leer = rezepte.length === 0;

  $('raster').hidden = ansicht !== 'raster' || leer;
  $('rezept').hidden = ansicht !== 'rezept';
  $('buch').hidden = ansicht !== 'buch' || leer;
  $('leer').hidden = !leer || ansicht === 'rezept';
  $('nav-raster').className = ansicht === 'buch' ? '' : 'aktiv';
  $('nav-buch').className = ansicht === 'buch' ? 'aktiv' : '';

  if (leer) return;
  if (ansicht === 'rezept') zeigeRezept(decodeURIComponent(teile.slice(1).join('/')));
  else if (ansicht === 'buch') zeigeBuch(parseInt(teile[1], 10) || 1);
  else zeigeRaster();
  window.scrollTo(0, 0);
}

// Buch: wischen und Pfeiltasten
function blaettern(d) {
  if ($('buch').hidden) return;
  var nr = parseInt((location.hash.split('/')[2]), 10) || 1;
  var ziel = nr + d;
  if (ziel >= 1 && ziel <= rezepte.length) location.hash = '#/buch/' + ziel;
}
var x0 = null, y0 = null;
document.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
document.addEventListener('touchend', function (e) {
  if (x0 === null) return;
  var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) blaettern(dx < 0 ? 1 : -1);
  x0 = null;
}, { passive: true });
document.addEventListener('keydown', function (e) {
  if (e.key === 'ArrowRight') blaettern(1);
  if (e.key === 'ArrowLeft') blaettern(-1);
});

fetch('rezepte.json', { cache: 'no-store' })
  .then(function (r) { return r.json(); })
  .then(function (data) { rezepte = data.slice().reverse(); route(); })   // neueste zuerst
  .catch(function () { route(); });

window.addEventListener('hashchange', route);
