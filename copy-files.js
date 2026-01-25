const fs = require("fs");
const path = require("path");

function copyFile(source, destination) {
    if (fs.existsSync(source)) {
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.copyFileSync(source, destination);
        console.log(`Copied ${source} to ${destination}`);
    }
}

function main() {
    const distPath = "./dist";

    // Copier manifest.json
    copyFile("./manifest.json", path.join(distPath, "manifest.json"));

    // Copier styles.css si présent
    if (fs.existsSync("./styles.css")) {
        copyFile("./styles.css", path.join(distPath, "styles.css"));
    }
}

main();
