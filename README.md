# Manastria Plugin

Plugin [Obsidian](https://obsidian.md) fournissant des commandes pour gérer le frontmatter YAML, convertir des notes en MOC (_Map of Content_), archiver des notes obsolètes et insérer des liens enrichis.

---

## Manuel utilisateur

### Installation

1. Télécharger la dernière release depuis GitHub.
2. Copier `main.js`, `manifest.json` et `styles.css` dans `.obsidian/plugins/manastria-plugin/` de votre vault.
3. Activer le plugin dans **Paramètres → Plugins communautaires**.

> Compatible avec Obsidian ≥ 1.7.7.

---

### Commande : Update Frontmatter

**Palette de commandes :** `Manastria Plugin: Update Frontmatter`

Met à jour le frontmatter YAML de la note active. Disponible uniquement si un fichier est ouvert.

#### Champs gérés

| Champ | Comportement |
|---|---|
| `id` | UUID v4 généré automatiquement si absent |
| `id36` | Représentation base-36 de l'UUID (10 caractères) ; calculé depuis `id` |
| `id62` | Représentation base-62 de l'UUID (11 caractères) ; calculé depuis `id` |
| `created` | Date de création du fichier (ISO avec fuseau horaire) ; jamais écrasée |
| `updated` | Mis à jour à l'heure actuelle à chaque exécution |
| `nature` | Valeur par défaut : `fiche` |
| `status` | Valeur par défaut : `wip` |
| `publish` | Valeur par défaut : `false` |
| `private` | Valeur par défaut : `false` |
| `disabled rules` | Valeur par défaut : `["capitalize-headings"]` |
| `aliases`, `tags`, `audience`, `topics`, `level`, `option`, `target`, `slug`, `keywords`, `permalink` | Initialisés à une liste vide si absents |

Les champs déjà présents ne sont jamais écrasés, à l'exception de `updated`.

---

### Commande : Convert to MOC

**Palette de commandes :** `Manastria Plugin: Convert to MOC`

Transforme la note active en MOC (_Map of Content_). Disponible uniquement si un fichier markdown est ouvert dans l'éditeur.

1. Une boîte de dialogue demande le **nom du MOC** (ex. : `Science`).
2. Le frontmatter est enrichi :
   - `moc_self` est défini à `MOC/<nom saisi>`
   - `moc` est ajouté à la liste `tags`
3. Un bloc Dataview est inséré en bas de la note pour lister les notes liées qui ne sont pas encore explicitement référencées :

```
TABLE WITHOUT ID
file.link as "Note", title as "Titre"
FROM ""
WHERE contains(mocs, this.moc_self) AND !contains(this.file.outlinks, file.link)
```

> La modification est appliquée dans l'éditeur sans sauvegarde automatique. Utilisez `Ctrl+S` pour enregistrer.

---

### Commande : Mettre au rebut la note courante

**Palette de commandes :** `Manastria Plugin: Mettre au rebut la note courante`

Archive une note devenue obsolète ou remplacée. Disponible uniquement sur les fichiers `.md` et `.mdx`.

Une fenêtre de dialogue s'ouvre avec les options suivantes :

| Option | Description |
|---|---|
| **Déplacer dans 90-Archives/** | Si activé, déplace le fichier dans le dossier `90-Archives/` (créé s'il n'existe pas) |
| **État** | `Remplacée (deprecated)` ou `Obsolète (obsolete)` |
| **Note de remplacement** | (Visible uniquement pour "Remplacée") Recherche et sélection d'une note existante dans le vault |
| **Date de mise au rebut** | Date au format `YYYY-MM-DD`, initialisée à aujourd'hui |
| **Ajouter / mettre à jour le callout** | Si activé, insère ou remplace un callout en tête de corps de note |

#### Modifications apportées au frontmatter

| Champ | Valeur |
|---|---|
| `status` | `archive` |
| `lifecycle` | `deprecated` ou `obsolete` |
| `deprecated_since` | Date choisie |
| `replaced_by` | `[[chemin/vers/note]]` (uniquement pour "Remplacée" ; supprimé pour "Obsolète") |

Les champs `id`, `id36`, `id62` et les autres champs existants ne sont pas modifiés.

#### Callouts insérés

- **Remplacée :** `> [!warning] Fiche dépréciée` avec le lien vers la note de remplacement
- **Obsolète :** `> [!danger] Fiche obsolète` avec le texte "Ne pas utiliser."

Si un callout `[!warning]` ou `[!danger]` est déjà présent en tête de note, il est remplacé plutôt qu'ajouté.

---

### Commande : Insérer un lien vers une fiche

**Palette de commandes :** `Manastria Plugin: Insérer un lien vers une fiche`

Insère à la position du curseur un lien wiki vers une note du vault. Disponible uniquement si un éditeur est actif.

1. Un sélecteur fuzzy liste toutes les notes `.md` du vault (recherche sur le chemin complet).
2. La note sélectionnée est lue depuis le cache de métadonnées pour extraire `title` et `description`.
3. Le lien est inséré à la position du curseur.

#### Format inséré

Avec une `description` dans le frontmatter :
```
- [[dossier/ma-note|Titre de la fiche]]
   Description de la fiche
```

Sans `description` :
```
- [[dossier/ma-note|Titre de la fiche]]
```

Le texte visible du lien est le champ `title` du frontmatter (fallback : nom du fichier sans extension). La description est indentée de 3 espaces (alignée après `- `), sans puce ni marqueur Markdown.

---

## Guide développeur

### Prérequis

- Node.js ≥ 16
- npm
- GitHub CLI (`gh`) pour les releases (`gh auth login`)

### Installation

```bash
npm install
```

### Build et déploiement

```bash
npm run build    # Vérification des types, bundle esbuild (production), copie vers dist/ et vault de test
npm run deploy   # Copie uniquement les artefacts (sans rebuild)
eslint src/      # Analyse statique du code
```

Le vault de test local est configuré en dur dans `copy-files.js` (`d:/tmp/obs_test/test/.obsidian/plugins/manastria-plugin`). Adapter ce chemin à votre environnement. Après chaque build, rechargez le plugin dans Obsidian (`Ctrl+P` → "Reload app without saving").

> `npm run dev` est un alias de `npm run build` — il n'y a pas de mode watch.

### Architecture du code

```
src/
  main.ts                    # Point d'entrée — FrontmatterUpdaterPlugin
  commands/
    updateFrontmatter.ts     # Commande "Update Frontmatter"
    convertToMoc.ts          # Commande "Convert to MOC"
    discardNote.ts           # Commande "Mettre au rebut la note courante"
    insertNoteLink.ts        # Commande "Insérer un lien vers une fiche"
```

**`main.ts`** — Étend `Plugin`. Enregistre les quatre commandes dans `onload()`.

**`updateFrontmatter.ts`** — Utilise l'API vault (`vault.read` / `vault.modify`) : lit, transforme et réécrit le fichier sur disque. Dates formatées avec `moment-timezone` (fuseau horaire local détecté automatiquement). Conversion UUID → base-36/base-62 via arithmétique entière.

**`convertToMoc.ts`** — Utilise l'API éditeur (`mdView.editor.getValue` / `setValue`) : modifie le tampon en mémoire sans écriture disque. `Modal` natif Obsidian pour la saisie du nom.

**`discardNote.ts`** — Utilise l'API vault (`vault.read` / `vault.modify` / `fileManager.renameFile`). `Modal` composé avec `Setting` (toggle, dropdown, text), `SuggestModal` pour la recherche de note de remplacement. La logique `addOrUpdateTopCallout` détecte et remplace un callout existant plutôt que d'en ajouter un second.

**`insertNoteLink.ts`** — Utilise `metadataCache.getFileCache` (lecture sans I/O) et `editor.replaceSelection`. `FuzzySuggestModal<TFile>` pour la sélection de note ; Obsidian gère nativement le fuzzy-search sur `getItemText`.

**Point d'attention :** `parseFrontmatter` est dupliquée dans `updateFrontmatter.ts`, `convertToMoc.ts` et `discardNote.ts` avec des signatures légèrement différentes. Toute évolution du parsing YAML doit être répercutée dans chacun. `insertNoteLink.ts` n'en a pas besoin (passe par `metadataCache`).

**Pipeline de build** (`esbuild.config.mjs`) — Bundle `src/main.ts` → `dist/main.js`, format CommonJS, cible ES2018. Les packages `obsidian`, `electron` et `@codemirror/*` sont `external` (fournis par Obsidian). TypeScript n'est utilisé que pour la vérification de types (`tsc -noEmit`).

### Processus de release

#### Bumper la version

```bash
# 1. Vérifier / ajuster minAppVersion dans manifest.json si nécessaire
# 2. Bumper (met à jour manifest.json, package.json, versions.json et crée un tag Git local)
npm version patch   # ou minor, major
git push && git push --tags
```

#### Release automatisée (recommandée)

```bash
npm run release
```

Enchaîne : build → zip → tag Git (si absent) → push → création de la release GitHub avec :
- `dist/main.js` (publié sous le nom `main.js`)
- `manifest.json`
- `styles.css`
- `releases/manastria-plugin-v<version>.zip`

> BRAT requiert les fichiers détachés (`main.js`, `manifest.json`), pas uniquement le zip.

#### Release manuelle

```bash
npm run zip   # Génère releases/manastria-plugin-v<version>.zip
```

Créer ensuite la release GitHub manuellement et uploader les assets listés ci-dessus.

### Dépendances notables

| Package | Usage |
|---|---|
| `obsidian` | API Obsidian (types + runtime) |
| `js-yaml` | Parsing et sérialisation du frontmatter YAML |
| `moment` + `moment-timezone` | Formatage des dates avec fuseau horaire |
| `esbuild` | Bundler |
| `bestzip` | Création du zip de release |
