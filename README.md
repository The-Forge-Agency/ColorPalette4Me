# ColorPalette4Me — App #07/52

> **Une image entre, ta palette sort.**
> Dépose un visuel, récupère une palette propre et exploitable : couleurs dominantes,
> rampe 50→950 façon Tailwind, contrastes WCAG, design system live et exports prêts à
> coller. **100% dans le navigateur — l'image ne quitte jamais ta machine.**

Projet #07/52 — Sprint Factory. Gratuit, sans compte, zéro upload.

---

## Stack

- **Laravel 13 / PHP 8.3+** — sert uniquement la page (pas de DB, pas d'auth, pas de back métier)
- **Alpine.js 3** + **Tailwind v4** (tokens inline) + **Vite**
- Fonts Bunny : **Space Grotesk** (titres) + **Inter** (corps)
- **Pest 4** pour les tests
- Tout le calcul couleur et les exports binaires (`.ase`, `.zip`, `.pdf`) en **JS pur**,
  zéro dépendance externe, zéro API.

## Fonctionnalités

- **Extraction client-side** (Canvas `getImageData`) — quantification MMCQ + sélection
  par diversité en **OKLCH**, 3 à 10 couleurs, marqueurs d'origine sur l'image.
- **3 modes** proposés au résultat : Dominantes / Équilibré / Vibrant.
- **Éditeur** avant extraction : recadrage, rotation, miroir.
- **Pipette zoomée** (loupe canvas, pixel-perfect) pour piocher une couleur.
- **Façon Coolors** : verrouillage, ajout harmonieux, régénération (`Espace`), drag.
- **Rampe 50→950** par couleur + **contraste WCAG** AA/AAA.
- **Design system live** : la palette appliquée à une vraie UI.
- **Exports** : Tailwind, CSS, SCSS, Bootstrap, tokens JSON (Figma), `.ase`, et visuels
  `.png` / `.svg` / `.html` / `.pdf`, ZIP « tout télécharger », + prompt **Claude / ChatGPT**.

## Architecture front

```
resources/
  css/app.css                 # tokens + design system de l'app
  js/
    app.js                    # composant Alpine paletteApp (état + interactions)
    color-engine.js           # conversions, MMCQ, WCAG, rampes (JS pur)
    exporters.js              # tailwind/css/scss/bootstrap/json/ase/svg/html/pdf/zip/prompt
  views/
    app.blade.php             # document + nav + includes
    partials/
      upload.blade.php        # écran upload (dropzone, nb couleurs)
      edit.blade.php          # écran éditeur (crop / rotation / miroir)
      result.blade.php        # barres, contrôles, cartes, rampes, contraste
      source.blade.php        # image source (marqueurs + pipette) + harmonie
      preview.blade.php        # design system live
      exports.blade.php        # exports code / visuels / IA / compatibilité
```

Parcours : **upload → edit → result**.

## Démarrage

```bash
composer install
npm install
npm run build      # ou : npm run dev (HMR)
php artisan serve
```

## Tests & qualité

```bash
php artisan test --compact
vendor/bin/pint --dirty
npm run build
```

## Documentation

Découpage détaillé dans `../tickets/` (00-plan → 10-deploy).

---

Brief produit & charte : `../brief-dev.md`. Maquettes : `../assets/maquettes/`.
