import { execSync } from "child_process";
import { readFileSync } from "fs";

// Lire la version depuis package.json
const { version } = JSON.parse(readFileSync("./package.json", "utf8"));

// Créer le fichier ZIP
console.log("Création du fichier ZIP...");
execSync("npm run zip", { stdio: "inherit" });

// Créer un tag Git avec la version
console.log(`Création du tag Git ${version}...`);
execSync(`git tag ${version}`, { stdio: "inherit" });

// Pousser les tags vers le dépôt distant
console.log("Pousser les tags sur le dépôt distant...");
execSync("git push origin --tags", { stdio: "inherit" });

console.log("Release effectuée avec succès !");
