# Rezepte

Rezeptbuch aus Koch-Videos (GitHub Pages). Wird automatisch befüllt.

## Ablauf
1. social_dl erkennt Koch-Videos (Caption/Hashtags) und legt sie in Dropbox ab:
   `DODNET/REZEPTE/eingang/<id>/` mit `video.mp4`, `cover.jpg` (erster Frame, quadratisch), `meta.json`.
2. Ein geplanter Claude-Durchlauf liest `meta.json` und schreibt `rezept.json` dazu
   (oder `kein_rezept.json`, wenn in der Caption kein Rezept steht). Es wird nichts transkribiert.
3. Der social_dl-Server übernimmt `rezept.json` + Cover in dieses Repo, committet, pusht
   und löscht den Eingangs-Ordner samt Video.

## Dateien
- `rezepte.json` – alle Rezepte (Liste, neueste zuletzt)
- `bilder/<id>.jpg` – quadratische Cover
- `index.html`, `app.js`, `style.css` – die Seite (Design folgt)
- `robots.txt` + `noindex` – nicht in Suchmaschinen

## Format `rezept.json` (von Claude geschrieben)
```json
{
  "titel": "Cremige Tomatenpasta",
  "kategorie": "Pasta",
  "portionen": 2,
  "zeit": "20 Min",
  "zutaten": ["200 g Spaghetti", "1 Dose Tomaten", "2 Knoblauchzehen"],
  "schritte": ["Pasta kochen.", "Knoblauch anbraten, Tomaten dazu.", "Alles mischen."],
  "hinweise": "",
  "tags": ["vegetarisch", "schnell"],
  "sprache": "de"
}
```
Pflicht: `titel`, `zutaten`, `schritte`. Der Server ergänzt beim Übernehmen `id`, `bild`, `quelle`, `account`, `plattform`, `hinzugefuegt`.

`kein_rezept.json`: `{"grund": "Caption enthält kein Rezept"}`
