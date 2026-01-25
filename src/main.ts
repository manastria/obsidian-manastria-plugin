import { Plugin, Notice } from "obsidian";
import { registerUpdateFrontmatterCommand } from "./commands/updateFrontmatter";
import { registerConvertToMocCommand } from "./commands/convertToMoc";
import { registerDiscardNoteCommand } from "./commands/discardNote";
export default class FrontmatterUpdaterPlugin extends Plugin {
    async onload() {
        console.log("Frontmatter Updater Plugin loaded!");
		new Notice("Frontmatter Updater Plugin loaded!");

        // Cast explicite de `this` comme instance de `Plugin`
        registerUpdateFrontmatterCommand(this as Plugin);
		registerConvertToMocCommand(this as Plugin);
		registerDiscardNoteCommand(this as Plugin);
    }

    onunload() {
        console.log("Frontmatter Updater Plugin unloaded!");
    }
}
