# UFO Archive

Site web pour explorer 8 documents + 1 documentaire vidéo (The Age of Disclosure) via une timeline (1945-2026), des filtres thématiques, une vidéothèque et un graphe de relations personnes/incidents/programmes.

## Déploiement

- **Live** : [uap-timeline.netlify.app](https://uap-timeline.netlify.app)
- **Netlify** : [incredible-mousse-cfff92](https://app.netlify.com/projects/incredible-mousse-cfff92) — déploiement automatique depuis GitHub.

## Lancer le site

```bash
npm install
npm run dev
```

Ouvrir http://localhost:4321

## Build

```bash
npm run build
npm run preview
```

## Structure

- **content/** — Données JSON (docs-meta, timeline-events, documentary-chapters, people, incidents, programs, videos, links, themes)
- **doc/md/** — 8 documents Markdown sources
- **doc/video/** — SRT et analyse du documentaire
- **public/video/** — Vidéo MP4 et sous-titres VTT (à fournir)

## Documents (PDF/EPUB)

Les fichiers sources sont dans `doc/src/`. Exécuter `npm run copy-docs` pour les copier vers `public/docs/` et mettre à jour les métadonnées. Les PDF s'affichent dans le navigateur ; les EPUB sont téléchargeables.

## Documentaire

1. Placer le fichier vidéo `The.Age.Of.Disclosure.2025.mkv` dans `doc/video/` ou `public/video/`
2. Si dans `doc/video/` : `npm run prepare-video` (copie vers public)
3. Convertir les sous-titres : `npm run srt-to-vtt`
4. Index recherche sous-titres : `npm run subtitles-index`

## Pages

- Accueil, Timeline, Thèmes, Documents (8), Documentaire (47 chapitres), Personnes, Incidents, Programmes, Vidéothèque, Sources, Recherche
