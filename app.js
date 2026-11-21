// Rezeptbuch: Raster (#/), Rezept (#/r/<id>), Buch (#/buch/<nr>)
var rezepte = [];
function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

// Rezept als schlichter Text
function rezeptHTML(r, mitBild) {
  var info = [r.zeit, r.portionen ? r.portionen + ' Portionen' : ''].filter(Boolean).join(' · ');
  var h = '<div class="text">';
  if (mitBild && r.bild) h += '<img src="' + esc(r.bild) + '" alt="">';
  h += '<h1>' + esc(r.titel) + '</h1>';
  if (info) h += '<p class="info">' + esc(info) + '</p>';
  if (r.zutaten && r.zutaten.length) {
    h += '<h2>Zutaten</h2><ul>' + r.zutaten.map(function (z) { return '<li>' + esc(z) + '</li>'; }).join('') + '</ul>';
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
