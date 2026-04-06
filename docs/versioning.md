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
1. Si vous utilisez une API Obsidian introduite dans une version récente d'Obsidian,
   ajustez `minAppVersion` dans `manifest.json` manuellement pour refléter cette exigence.

   **Quand c'est nécessaire :** `minAppVersion` représente la version minimale d'Obsidian
   requise pour faire fonctionner le plugin. Elle doit être mise à jour dès que le code
   utilise une méthode ou une classe de l'API Obsidian qui n'existait pas dans la version
   actuellement déclarée. Par exemple, si le plugin commence à utiliser une méthode
   introduite dans Obsidian 1.8.0 alors que `minAppVersion` vaut `"1.7.7"`, il faut
   passer `minAppVersion` à `"1.8.0"`.

   **Quand ce n'est pas nécessaire :** un simple correctif de bug ou une nouvelle
   commande qui n'utilise que des API déjà disponibles dans la version courante de
   `minAppVersion` ne nécessite pas de modification.

   `version-bump.mjs` ne touche jamais à `minAppVersion` : il se contente de la lire
   pour l'inscrire dans `versions.json`. C'est donc le seul champ de `manifest.json`
   qui doit être géré manuellement.
2. Bumpez la version :
   ```bash
   npm version patch   # Ou minor/major selon le cas
   ```
   Cette commande exécute automatiquement `version-bump.mjs` (lifecycle hook `version`),
   qui met à jour `manifest.json` et `versions.json`, les stage, puis crée un commit et un tag Git local.
3. Poussez le commit de version vers le dépôt distant :
   ```bash
   git push
   ```
4. Publiez la nouvelle version sur GitHub :
   ```bash
   npm run release
   ```
   Cette commande construit le plugin, crée le ZIP, pousse le tag Git (`git push origin --tags`),
   et publie la release GitHub avec tous les assets.

## **4. Recommandations**
- **Utilisez des tags Git :** Assurez-vous que chaque version est taguée avec `vX.Y.Z`.
- **Publiez des releases sur GitHub :** Ajoutez un fichier ZIP et des notes de version dans la section des releases.

## **5. Liens utiles**
- [Document officiel SemVer](https://semver.org/lang/fr/)
- [Obsidian Developer Docs](https://publish.obsidian.md/help/Advanced+topics/Third-party+plugins)
