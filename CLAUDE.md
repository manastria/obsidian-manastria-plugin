# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commandes courantes

```bash
npm run build      # Vérifie les types (tsc), bundle avec esbuild (production), copie vers dist/ et le vault de test
npm run deploy     # Copie dist/main.js + manifest.json + styles.css vers dist/ et le vault de test local
npm run zip        # Build puis génère releases/manastria-plugin-v<version>.zip
npm run release    # Release complète : build, zip, tag Git, push, création de la release GitHub
npm run version    # Bump de version via npm version (met à jour manifest.json, package.json, versions.json)
eslint src/        # Lint des sources TypeScript
```

> `npm run dev` est un alias de `npm run build` — il n'y a pas de mode watch distinct.

Le vault de test local est configuré dans `copy-files.js` : `d:/tmp/obs_test/test/.obsidian/plugins/manastria-plugin`. Adapter ce chemin à l'environnement de développement.

## Architecture

Plugin Obsidian en TypeScript, bundlé par esbuild vers `dist/main.js`. Toutes les dépendances Obsidian, Electron et `@codemirror/*` sont déclarées `external` (fournies par Obsidian à l'exécution).

**Point d'entrée :** `src/main.ts` — classe `FrontmatterUpdaterPlugin` (extends `Plugin`), enregistre les quatre commandes dans `onload()`.

**Commandes** (dans `src/commands/`) :

- **`updateFrontmatter.ts`** — API vault (`vault.read` / `vault.modify`). Parse le frontmatter YAML avec `js-yaml`, injecte ou initialise les champs standards (`id`, `id36`/`id62` via conversion UUID→base36/base62, `created`, `updated`, `nature`, `status`, etc.), puis réécrit le fichier sur disque.

- **`convertToMoc.ts`** — API éditeur (`mdView.editor.getValue` / `setValue`). Prompt le nom du MOC via un `Modal`, ajoute `moc_self` et le tag `moc` au frontmatter, puis insère un bloc Dataview en bas de note. Modifie le tampon en mémoire sans sauvegarder.

- **`discardNote.ts`** — API vault (`vault.read` / `vault.modify` / `fileManager.renameFile`). Ouvre un `Modal` avec plusieurs options (état du cycle de vie, note de remplacement via `SuggestModal`, date, callout, déplacement vers `90-Archives/`). Met à jour les champs `status`, `lifecycle`, `deprecated_since`, `replaced_by` et place/remplace un callout `[!warning]` ou `[!danger]` en tête de corps. Seuls les fichiers `.md` et `.mdx` sont acceptés.

- **`insertNoteLink.ts`** — API éditeur (`editor.replaceSelection`) et metadata cache (`metadataCache.getFileCache`). Ouvre un `FuzzySuggestModal` listant toutes les notes `.md` du vault, lit `title` et `description` depuis le frontmatter de la note choisie (sans I/O disque), puis insère à la position du curseur un lien wiki enrichi. Disponible dès qu'un éditeur est actif.

**Point d'attention :** `parseFrontmatter` est dupliquée dans `updateFrontmatter.ts`, `convertToMoc.ts` et `discardNote.ts` avec des signatures légèrement différentes. Toute évolution du parsing YAML doit être répercutée dans chacun. `insertNoteLink.ts` n'en a pas besoin car il passe par `metadataCache`.

**Pipeline de build** (`esbuild.config.mjs`) : `src/main.ts` → `dist/main.js`, format CommonJS, cible ES2018, minifié en production. TypeScript n'est utilisé que pour la vérification de types (`tsc -noEmit`), pas pour la transpilation.

**Release** (`release.mjs`) : valide la présence du zip et de `dist/main.js`, crée le tag Git si absent, push, publie sur GitHub via `gh release create` avec les assets `dist/main.js` (renommé `main.js`), `manifest.json`, `styles.css` et le zip. BRAT requiert les fichiers détachés, pas uniquement le zip.
