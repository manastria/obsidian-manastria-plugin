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
    const obsidianPluginPath = "d:/tmp/obs_test/test/.obsidian/plugins/manastria-plugin";

    // Copier manifest.json
    copyFile("./manifest.json", path.join(distPath, "manifest.json"));
    copyFile("./manifest.json", path.join(obsidianPluginPath, "manifest.json"));

    // Copier styles.css si présent
    if (fs.existsSync("./styles.css")) {
        copyFile("./styles.css", path.join(distPath, "styles.css"));
        copyFile("./styles.css", path.join(obsidianPluginPath, "styles.css"));
    }

    // Copier main.js vers Obsidian
    copyFile(path.join(distPath, "main.js"), path.join(obsidianPluginPath, "main.js"));
}

main();
