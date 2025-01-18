# Gestion des builds et scripts `package.json`

Ce document explique les scripts définis dans le fichier `package.json`, leur rôle et comment les exécuter.

---

## **1. Scripts disponibles**

Voici une liste des scripts, leur fonction et leur usage.

### **clean**
Commande : 
```bash
npm run clean
```
Fonction :  
Supprime le dossier `dist` (s'il existe) et recrée un dossier vide nommé `dist`.  
Utile pour nettoyer les anciens fichiers générés avant un nouveau build.

---

### **build**
Commande :
```bash
npm run build
```
Fonction :  
Effectue un processus complet de build en plusieurs étapes :
1. Exécute `npm run clean` pour nettoyer le dossier `dist`.
2. Compile le code TypeScript avec `tsc` en mode vérification (sans générer de fichiers).
3. Utilise `esbuild.config.mjs` pour créer le fichier JavaScript final dans `dist/main.js`.
4. Copie les fichiers nécessaires (`manifest.json`, `styles.css`, etc.) vers `dist/`.

---

### **dev**
Commande :
```bash
npm run dev
```
Fonction :  
Alias de `npm run build`. Il permet d'effectuer un build complet en mode développement.

---

### **deploy**
Commande :
```bash
npm run deploy
```
Fonction :  
Copie les fichiers du dossier `dist/` directement dans le dossier des plugins Obsidian configuré sur votre machine. Cela permet de tester rapidement le plugin sans générer de fichier ZIP.

---

### **zip**
Commande :
```bash
npm run zip
```
Fonction :  
Crée un fichier ZIP du plugin prêt à être publié. Le fichier ZIP inclut les fichiers nécessaires (`dist/main.js`, `manifest.json`, `styles.css`) et est placé dans le dossier `releases/` avec un nom basé sur la version du plugin.

---

### **version**
Commande :
```bash
npm run version
```
Fonction :  
Automatise la mise à jour des fichiers `manifest.json` et `versions.json` :
1. Met à jour la version dans `manifest.json` avec celle définie dans `package.json`.
2. Ajoute une nouvelle entrée dans `versions.json` pour conserver un historique des versions du plugin.
3. Ajoute les modifications à Git avec `git add`.

---

### **release**
Commande :
```bash
npm run release
```
Fonction :  
Combine plusieurs étapes pour préparer et publier une nouvelle version :
1. Exécute `npm run zip` pour générer le fichier ZIP avec la version actuelle.
2. Crée un nouveau tag Git basé sur la version (`vX.Y.Z`).
3. Pousse le tag vers GitHub (`git push origin --tags`).

---

## **2. Comment exécuter ces scripts ?**

### **Via NPM**
Vous pouvez lancer un script avec la commande :
```bash
npm run <script-name>
```
Par exemple :
```bash
npm run build
```

### **Via Yarn**
Si vous utilisez Yarn, vous pouvez également exécuter ces scripts avec :
```bash
yarn <script-name>
```
Par exemple :
```bash
yarn build
```

---

## **3. Workflow typique**

Voici un exemple d'ordre d'exécution des scripts pour un développement et une publication :
1. **Développement** : Lancez un build complet pour tester votre code localement :
   ```bash
   npm run dev
   ```
2. **Nettoyage** : Si nécessaire, nettoyez les anciens fichiers générés :
   ```bash
   npm run clean
   ```
3. **Versioning** : Lorsque vous êtes prêt à publier une nouvelle version, mettez à jour la version :
   ```bash
   npm version patch
   ```
   Ensuite, exécutez :
   ```bash
   npm run version
   ```
4. **Création du fichier ZIP** : Préparez le fichier pour la publication :
   ```bash
   npm run zip
   ```
5. **Publication** : Créez une release GitHub avec la commande :
   ```bash
   npm run release
   ```

---

## **4. Liens utiles**
- [Documentation npm scripts](https://docs.npmjs.com/cli/v9/using-npm/scripts)
- [Obsidian Developer Docs](https://publish.obsidian.md/help/Advanced+topics/Third-party+plugins)
