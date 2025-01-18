# Gestion des versions

Ce document explique le processus de gestion des versions pour ce projet.

## **1. Structure des versions**
Nous utilisons la norme [SemVer](https://semver.org/lang/fr/) pour gérer les versions :
- **MAJOR** : Incrémenté pour des changements incompatibles ou majeurs.
- **MINOR** : Incrémenté pour des fonctionnalités ajoutées, rétrocompatibles.
- **PATCH** : Incrémenté pour des corrections de bugs.

Exemple de version : `1.2.3`
- `1` : Changement majeur
- `2` : Nouvelle fonctionnalité rétrocompatible
- `3` : Correction de bug

## **2. Mise à jour automatique des fichiers**
Deux fichiers sont mis à jour automatiquement avec le script `version-bump.mjs` :

### **manifest.json**
- Le champ `version` est mis à jour avec la nouvelle version définie dans `package.json`.

### **versions.json**
Ce fichier garde un historique des versions du plugin et de leurs compatibilités avec les versions d'Obsidian.

Exemple de contenu :
```json
{
  "1.0.0": "0.15.0",
  "1.1.0": "0.16.0",
  "1.2.0": "0.16.2"
}
```
- **Clé** : Version du plugin.
- **Valeur** : Version minimale d’Obsidian requise.

## **3. Workflow de mise à jour**
Pour mettre à jour la version :
1. Mettez à jour la version dans `package.json` :
   ```bash
   npm version patch   # Ou minor/major selon le cas
   ```
2. Exécutez le script `version-bump.mjs` pour mettre à jour `manifest.json` et `versions.json` :
   ```bash
   npm run version
   ```
3. Créez un fichier ZIP avec la version dans le nom :
   ```bash
   npm run zip
   ```
4. Publiez la nouvelle version sur GitHub :
   ```bash
   npm run release
   ```

## **4. Recommandations**
- **Utilisez des tags Git :** Assurez-vous que chaque version est taguée avec `vX.Y.Z`.
- **Publiez des releases sur GitHub :** Ajoutez un fichier ZIP et des notes de version dans la section des releases.

## **5. Liens utiles**
- [Document officiel SemVer](https://semver.org/lang/fr/)
- [Obsidian Developer Docs](https://publish.obsidian.md/help/Advanced+topics/Third-party+plugins)
