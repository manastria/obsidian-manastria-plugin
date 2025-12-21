import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import path from "path";

function run(command) {
  return execSync(command, { stdio: "inherit" });
}

// Lire la version depuis manifest.json (source de verite pour Obsidian)
const { id, version } = JSON.parse(readFileSync("./manifest.json", "utf8"));
const zipFile = path.join("releases", `${id}-v${version}.zip`);
const distMain = path.join("dist", "main.js");

// Creer le fichier ZIP
console.log("Creation du fichier ZIP...");
run("npm run zip");

if (!existsSync(zipFile)) {
  console.error(`Fichier ZIP introuvable: ${zipFile}`);
  process.exit(1);
}

if (!existsSync(distMain)) {
  console.error(`Fichier introuvable: ${distMain}`);
  process.exit(1);
}

const assets = [zipFile, "manifest.json", distMain];
if (existsSync("styles.css")) {
  assets.push("styles.css");
}

// Creer un tag Git avec la version (si besoin)
const existingTag = execSync(`git tag -l ${version}`, { encoding: "utf8" }).trim();
if (!existingTag) {
  console.log(`Creation du tag Git ${version}...`);
  run(`git tag ${version}`);
} else {
  console.log(`Tag Git ${version} deja present, on le conserve.`);
}

// Pousser les tags vers le depot distant
console.log("Push des tags...");
run("git push origin --tags");

// Publier la release sur GitHub via gh
console.log("Publication de la release sur GitHub (gh)...");
const quotedAssets = assets.map((asset) => `"${asset}"`).join(" ");
run(`gh release create ${version} ${quotedAssets} --title "${version}" --notes "Release ${version}"`);

console.log("Release effectuee avec succes !");
