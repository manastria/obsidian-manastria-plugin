import { App, Modal, Notice, Plugin, Setting, SuggestModal, TFile } from "obsidian";
import YAML from "js-yaml";
import moment from "moment-timezone";

type Lifecycle = "deprecated" | "obsolete";

type DiscardOptions = {
    moveToArchive: boolean;
    lifecycle: Lifecycle;
    replacementFile: TFile | null;
    deprecatedSince: string;
    addCallout: boolean;
};

const archiveFolder = "90-Archives";

export function registerDiscardNoteCommand(plugin: Plugin) {
    plugin.addCommand({
        id: "discard-current-note",
        name: "Mettre au rebut la note courante",
        checkCallback: (checking: boolean) => {
            const activeFile = plugin.app.workspace.getActiveFile();
            if (!activeFile) {
                if (!checking) {
                    new Notice("Aucune note active.");
                }
                return false;
            }
            if (!isMarkdownLike(activeFile)) {
                if (!checking) {
                    new Notice("La note active doit être un fichier .md ou .mdx.");
                }
                return false;
            }
            if (!checking) {
                new DiscardNoteModal(plugin, activeFile).open();
            }
            return true;
        },
    });
}

class DiscardNoteModal extends Modal {
    private readonly plugin: Plugin;
    private readonly file: TFile;
    private moveToArchive = false;
    private lifecycle: Lifecycle = "deprecated";
    private replacementFile: TFile | null = null;
    private deprecatedSince = moment().format("YYYY-MM-DD");
    private addCallout = true;

    constructor(plugin: Plugin, file: TFile) {
        super(plugin.app);
        this.plugin = plugin;
        this.file = file;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Mettre au rebut la note courante" });
        contentEl.createEl("p", { text: this.file.path });

        new Setting(contentEl)
            .setName("Déplacer dans 90-Archives/")
            .addToggle((toggle) => {
                toggle.setValue(this.moveToArchive).onChange((value) => {
                    this.moveToArchive = value;
                });
            });

        const lifecycleSetting = new Setting(contentEl).setName("État");
        lifecycleSetting.addDropdown((dropdown) => {
            dropdown.addOption("deprecated", "Remplacée (deprecated)");
            dropdown.addOption("obsolete", "Obsolète (obsolete)");
            dropdown.setValue(this.lifecycle);
            dropdown.onChange((value) => {
                this.lifecycle = value as Lifecycle;
                if (this.lifecycle === "obsolete") {
                    this.replacementFile = null;
                    replacementSetting.setDesc("Aucune note sélectionnée.");
                }
                updateReplacementVisibility();
            });
        });

        const replacementSetting = new Setting(contentEl)
            .setName("Note de remplacement")
            .setDesc("Aucune note sélectionnée.");
        replacementSetting.addButton((button) => {
            button.setButtonText("Choisir");
            button.onClick(() => {
                const files = getReplacementCandidates(this.app, this.file);
                new ReplacementNoteSuggestModal(this.app, files, (file) => {
                    this.replacementFile = file;
                    replacementSetting.setDesc(file.path);
                }).open();
            });
        });

        const updateReplacementVisibility = () => {
            replacementSetting.settingEl.style.display =
                this.lifecycle === "deprecated" ? "flex" : "none";
        };
        updateReplacementVisibility();

        new Setting(contentEl)
            .setName("Date de mise au rebut")
            .setDesc("Format YYYY-MM-DD")
            .addText((text) => {
                text.inputEl.type = "date";
                text.setValue(this.deprecatedSince);
                text.onChange((value) => {
                    this.deprecatedSince = value;
                });
            });

        new Setting(contentEl)
            .setName("Ajouter / mettre à jour le callout")
            .addToggle((toggle) => {
                toggle.setValue(this.addCallout).onChange((value) => {
                    this.addCallout = value;
                });
            });

        const actionsEl = contentEl.createDiv({ cls: "modal-button-container" });
        const cancelButton = actionsEl.createEl("button", { text: "Annuler" });
        cancelButton.onclick = () => this.close();

        const confirmButton = actionsEl.createEl("button", { text: "Mettre au rebut" });
        confirmButton.addClass("mod-cta");
        confirmButton.onclick = async () => {
            if (!moment(this.deprecatedSince, "YYYY-MM-DD", true).isValid()) {
                new Notice("Date invalide (format YYYY-MM-DD).");
                return;
            }
            if (this.lifecycle === "deprecated" && !this.replacementFile) {
                new Notice("Choisissez une note de remplacement.");
                return;
            }
            try {
                await discardCurrentNote(this.plugin, this.file, {
                    moveToArchive: this.moveToArchive,
                    lifecycle: this.lifecycle,
                    replacementFile: this.replacementFile,
                    deprecatedSince: this.deprecatedSince,
                    addCallout: this.addCallout,
                });
                this.close();
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                new Notice(`Erreur lors de la mise au rebut : ${message}`);
                console.error(error);
            }
        };
    }

    onClose() {
        this.contentEl.empty();
    }
}

class ReplacementNoteSuggestModal extends SuggestModal<TFile> {
    private readonly files: TFile[];
    private readonly onChoose: (file: TFile) => void;

    constructor(app: App, files: TFile[], onChoose: (file: TFile) => void) {
        super(app);
        this.files = files;
        this.onChoose = onChoose;
    }

    getSuggestions(query: string): TFile[] {
        const normalized = query.toLowerCase();
        return this.files.filter((file) => file.path.toLowerCase().includes(normalized));
    }

    renderSuggestion(file: TFile, el: HTMLElement) {
        el.createEl("div", { text: file.path });
    }

    onChooseSuggestion(file: TFile) {
        this.onChoose(file);
    }
}

async function discardCurrentNote(
    plugin: Plugin,
    file: TFile,
    options: DiscardOptions,
): Promise<void> {
    if (!isMarkdownLike(file)) {
        throw new Error("La note active doit être un fichier .md ou .mdx.");
    }
    const content = await plugin.app.vault.read(file);
    const { frontmatter, restContent } = parseFrontmatter(content);
    const updatedFrontmatter = updateFrontmatterForDiscard(frontmatter ?? {}, options);
    const body = options.addCallout
        ? addOrUpdateTopCallout(restContent, buildCallout(options))
        : restContent;
    const updatedContent = buildUpdatedContent(updatedFrontmatter, body);
    await plugin.app.vault.modify(file, updatedContent);

    if (options.moveToArchive) {
        await ensureArchiveFolder(plugin);
        const newPath = `${archiveFolder}/${file.name}`;
        if (file.path !== newPath) {
            await plugin.app.fileManager.renameFile(file, newPath);
        }
    }

    const moveSuffix = options.moveToArchive ? ` (déplacée dans ${archiveFolder}/)` : "";
    new Notice(`Note mise au rebut : ${file.name}${moveSuffix}`);
}

function isMarkdownLike(file: TFile): boolean {
    return file.extension === "md" || file.extension === "mdx";
}

function getReplacementCandidates(app: App, currentFile: TFile): TFile[] {
    return app.vault
        .getFiles()
        .filter((file) => isMarkdownLike(file) && file.path !== currentFile.path);
}

async function ensureArchiveFolder(plugin: Plugin): Promise<void> {
    const existing = plugin.app.vault.getAbstractFileByPath(archiveFolder);
    if (!existing) {
        await plugin.app.vault.createFolder(archiveFolder);
    }
}

function parseFrontmatter(content: string): {
    frontmatter: Record<string, unknown> | null;
    restContent: string;
} {
    const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) {
        return { frontmatter: null, restContent: content };
    }
    const parsed = YAML.load(match[1]) ?? {};
    if (typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Frontmatter invalide.");
    }
    return { frontmatter: parsed as Record<string, unknown>, restContent: match[2] };
}

function updateFrontmatterForDiscard(
    frontmatter: Record<string, unknown>,
    options: DiscardOptions,
): Record<string, unknown> {
    const updated = { ...frontmatter };
    updated.status = "archive";
    updated.lifecycle = options.lifecycle;
    updated.deprecated_since = options.deprecatedSince;

    if (options.replacementFile && options.lifecycle === "deprecated") {
        updated.replaced_by = `[[${stripMarkdownExtension(options.replacementFile.path)}]]`;
    } else {
        delete updated.replaced_by;
    }

    return updated;
}

function stripMarkdownExtension(path: string): string {
    return path.replace(/\.(md|mdx)$/i, "");
}

function buildUpdatedContent(frontmatter: Record<string, unknown>, body: string): string {
    const yamlString = YAML.dump(frontmatter, {
        indent: 2,
        lineWidth: 1000,
        noRefs: true,
        skipInvalid: true,
    }).trim();
    return `---\n${yamlString}\n---\n${body}`;
}

function buildCallout(options: DiscardOptions): string {
    if (options.lifecycle === "deprecated") {
        const link = options.replacementFile
            ? `[[${stripMarkdownExtension(options.replacementFile.path)}]]`
            : "";
        return `> [!warning] Fiche dépréciée\n> Remplacée par ${link}`;
    }
    return `> [!danger] Fiche obsolète\n> Ne pas utiliser.`;
}

function addOrUpdateTopCallout(body: string, callout: string): string {
    const lines = body.split("\n");
    let index = 0;
    while (index < lines.length && lines[index].trim() === "") {
        index++;
    }

    let contentStart = index;
    const calloutPattern = /^> \[!(warning|danger)\]/i;
    if (calloutPattern.test(lines[contentStart] ?? "")) {
        let end = contentStart;
        while (end < lines.length && lines[end].startsWith(">")) {
            end++;
        }
        contentStart = end;
    }

    const remainingLines = lines.slice(contentStart);
    while (remainingLines.length > 0 && remainingLines[0].trim() === "") {
        remainingLines.shift();
    }

    const calloutBlock = callout.trimEnd();
    if (remainingLines.length === 0) {
        return `${calloutBlock}\n`;
    }
    return `${calloutBlock}\n\n${remainingLines.join("\n")}`;
}
