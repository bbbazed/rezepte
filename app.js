// Rezeptbuch: lädt rezepte.json und zeigt Liste bzw. Detail (#id).
var rezepte = [];
var $ = function (id) { return document.getElementById(id); };

function text(v) { return v == null ? '' : String(v); }

function treffer(r, q, kat) {
  if (kat && r.kategorie !== kat) return false;
  if (!q) return true;
  var hay = [r.titel, r.kategorie, (r.zutaten || []).join(' '), (r.tags || []).join(' ')].join(' ').toLowerCase();
  return hay.indexOf(q) !== -1;
}

function zeigeListe() {
  var q = $('suche').value.trim().toLowerCase();
  var kat = $('kategorie').value;
  var box = $('liste');
  box.innerHTML = '';
  rezepte.filter(function (r) { return treffer(r, q, kat); })
    .slice().reverse()   // neueste zuerst
    .forEach(function (r) {
      var a = document.createElement('a');
      a.href = '#' + encodeURIComponent(r.id);
      a.className = 'karte';
      if (r.bild) {
        var img = document.createElement('img');
        img.src = r.bild; img.alt = ''; img.loading = 'lazy';
        a.appendChild(img);
      }
      var h = document.createElement('h2');
      h.textContent = text(r.titel);
      a.appendChild(h);
      box.appendChild(a);
    });
}

function liste(el, items) {
  el.innerHTML = '';
  (items || []).forEach(function (t) {
    var li = document.createElement('li');
    li.textContent = text(t);
    el.appendChild(li);
  });
}

function zeigeDetail(id) {
  var r = rezepte.filter(function (x) { return x.id === id; })[0];
  if (!r) { location.hash = ''; return; }
  $('d-bild').src = r.bild || '';
  $('d-bild').hidden = !r.bild;
  $('d-titel').textContent = text(r.titel);
  $('d-info').textContent = [r.kategorie, r.zeit, r.portionen && (r.portionen + ' Portionen')].filter(Boolean).join(' · ');
  liste($('d-zutaten'), r.zutaten);
  liste($('d-schritte'), r.schritte);
  $('d-hinweise').textContent = text(r.hinweise);
  $('d-quelle').href = r.quelle || '#';
  $('d-quelle').hidden = !r.quelle;
}

function route() {
  var id = decodeURIComponent(location.hash.slice(1));
  $('detail').hidden = !id;
  $('liste').hidden = !!id;
  $('suche').parentNode.hidden = !!id;
  if (id) zeigeDetail(id); else zeigeListe();
  window.scrollTo(0, 0);
}

fetch('rezepte.json', { cache: 'no-store' })
  .then(function (r) { return r.json(); })
  .then(function (data) {
    rezepte = data;
    var kats = {};
    rezepte.forEach(function (r) { if (r.kategorie) kats[r.kategorie] = 1; });
    Object.keys(kats).sort().forEach(function (k) {
      var o = document.createElement('option'); o.value = k; o.textContent = k;
      $('kategorie').appendChild(o);
    });
    route();
  });

$('suche').addEventListener('input', zeigeListe);
$('kategorie').addEventListener('change', zeigeListe);
window.addEventListener('hashchange', route);
