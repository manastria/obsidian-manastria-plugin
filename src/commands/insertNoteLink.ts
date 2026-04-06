import { FuzzySuggestModal, Plugin, TFile } from "obsidian";

export function registerInsertNoteLinkCommand(plugin: Plugin) {
    plugin.addCommand({
        id: "insert-note-link",
        name: "Insérer un lien vers une fiche",
        checkCallback: (checking) => {
            const editor = plugin.app.workspace.activeEditor?.editor;
            if (!editor) {
                return false;
            }
            if (!checking) {
                const files = plugin.app.vault.getMarkdownFiles();
                new NoteSuggestModal(plugin, files, (file) => {
                    const link = buildLink(plugin, file);
                    editor.replaceSelection(link);
                }).open();
            }
            return true;
        },
    });
}

function buildLink(plugin: Plugin, file: TFile): string {
    const frontmatter = plugin.app.metadataCache.getFileCache(file)?.frontmatter;
    const title = (frontmatter?.["title"] as string | undefined) ?? file.basename;
    const description = frontmatter?.["description"] as string | undefined;

    const path = file.path.replace(/\.md$/i, "");
    const wikiLink = `- [[${path}|${title}]]`;

    if (description) {
        return `${wikiLink}\n   ${description}`;
    }
    return wikiLink;
}

class NoteSuggestModal extends FuzzySuggestModal<TFile> {
    private readonly files: TFile[];
    private readonly onChoose: (file: TFile) => void;

    constructor(plugin: Plugin, files: TFile[], onChoose: (file: TFile) => void) {
        super(plugin.app);
        this.files = files;
        this.onChoose = onChoose;
    }

    getItems(): TFile[] {
        return this.files;
    }

    getItemText(file: TFile): string {
        return file.path;
    }

    onChooseItem(file: TFile): void {
        this.onChoose(file);
    }
}
