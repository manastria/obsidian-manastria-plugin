import { existsSync, mkdirSync, rmSync, copyFileSync } from "fs";
import bestzip from "bestzip";
import { readFileSync } from "fs";
import path from "path";

// Lire les informations depuis manifest.json
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { id, version } = manifest;

// Creer le dossier releases s'il n'existe pas
mkdirSync("releases", { recursive: true });

// Nom du fichier ZIP incluant l'id et la version
const zipFileName = `releases/${id}-v${version}.zip`;

const projectRoot = process.cwd();
const stagingDir = path.join(projectRoot, "releases", ".staging");
const sourceMain = path.join(projectRoot, "dist", "main.js");

if (!existsSync(sourceMain)) {
  console.error("dist/main.js introuvable. Lancez d'abord npm run build.");
  process.exit(1);
}

if (existsSync(stagingDir)) {
  rmSync(stagingDir, { recursive: true, force: true });
}
mkdirSync(stagingDir, { recursive: true });

copyFileSync(path.join(projectRoot, "manifest.json"), path.join(stagingDir, "manifest.json"));
if (existsSync(path.join(projectRoot, "styles.css"))) {
  copyFileSync(path.join(projectRoot, "styles.css"), path.join(stagingDir, "styles.css"));
}
copyFileSync(sourceMain, path.join(stagingDir, "main.js"));

const destinationPath = path.join(projectRoot, zipFileName);
const originalCwd = process.cwd();
process.chdir(stagingDir);

// Creer le fichier ZIP
bestzip({
  source: ["*"],
  destination: destinationPath,
})
  .then(() => {
    console.log(`Fichier ZIP cree avec succes : ${zipFileName}`);
    process.chdir(originalCwd);
    rmSync(stagingDir, { recursive: true, force: true });
  })
  .catch((err) => {
    console.error(err);
    process.chdir(originalCwd);
    rmSync(stagingDir, { recursive: true, force: true });
    process.exit(1);
  });
