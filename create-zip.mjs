import { mkdirSync } from "fs";
import bestzip from "bestzip";
import { readFileSync } from "fs";

// Lire les informations depuis manifest.json
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { id, version } = manifest;

// Créer le dossier releases s'il n'existe pas
mkdirSync("releases", { recursive: true });

// Nom du fichier ZIP incluant l'id et la version
const zipFileName = `releases/${id}-v${version}.zip`;

// Créer le fichier ZIP
bestzip({
  source: ["manifest.json", "styles.css", "dist/main.js"],
  destination: zipFileName,
})
  .then(() => {
    console.log(`Fichier ZIP créé avec succès : ${zipFileName}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
