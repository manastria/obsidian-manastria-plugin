import { App, Plugin, Notice, TFile, Modal, MarkdownView } from "obsidian";
import * as yaml from "js-yaml";

export function registerConvertToMocCommand(plugin: Plugin) {
    plugin.addCommand({
        id: "convert-to-moc",
        name: "Convert to MOC",
        checkCallback: (checking) => {
            // Vérifie si on a bien un fichier ouvert
            const activeFile = plugin.app.workspace.getActiveFile();
            if (!activeFile) {
                if (!checking) {
                    new Notice("No active file to convert to MOC.");
                }
                return false;
            }

            if (!checking) {
                new MocNameModal(plugin.app, (mocName) => {
                    // Au lieu de modifier directement le fichier via Vault,
                    // on va modifier l'éditeur actif.
                    modifyEditorContent(plugin.app, mocName);
                }).open();
            }
            return true;
        },
    });
}

/**
 * Récupère l'éditeur actif et modifie son contenu
 */
function modifyEditorContent(app: App, mocName: string) {
    // 1. On récupère la vue Markdown active
    const mdView = app.workspace.getActiveViewOfType(MarkdownView);
    if (!mdView) {
        new Notice("No active markdown editor found.");
        return;
    }

    // 2. On obtient l'éditeur (CodeMirror)
    const editor = mdView.editor;

    // 3. On lit le contenu de l’éditeur
    const content = editor.getValue();

    // 4. On applique la transformation
    const updatedContent = processMocConversion(content, mocName);

    // 5. On met à jour le texte dans l'éditeur
    editor.setValue(updatedContent);

    // 6. (Facultatif) On enregistre le fichier automatiquement
    // mdView.save(); // décommentez si vous souhaitez sauvegarder immédiatement
}

function processMocConversion(content: string, mocName: string): string {
    const { frontmatter, restContent } = parseFrontmatter(content);

    // Cas où le frontmatter n'a pas pu être parsé
    if (!frontmatter) {
        console.error("Failed to extract front matter. Keeping original content.");
        return content;
    }

    // Mise à jour du front matter
    frontmatter["moc_self"] = `MOC/${mocName}`;
    frontmatter["tags"] = [...new Set([...(frontmatter["tags"] || []), "moc"])];

    // Construction du nouveau contenu
    const updatedContent = [
        "---",
        yaml.dump(frontmatter, { lineWidth: 1000, noRefs: true, skipInvalid: true }).trim(),
        "---",
        restContent.trim(),
        "\n---\n",
        "### Notes à Relier",
        "```dataview",
        "TABLE WITHOUT ID",
        'file.link as "Note", title as "Titre"',
        'FROM ""',
        "WHERE contains(mocs, this.moc_self) AND !contains(this.file.outlinks, file.link)",
        "```",
        "\n---\n",
    ].join("\n");

    return updatedContent;
}

function parseFrontmatter(content: string): { frontmatter: any; restContent: string } {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (match) {
        try {
            const frontmatter = yaml.load(match[1]) || {};
            return { frontmatter, restContent: match[2] };
        } catch (e) {
            console.error("Failed to parse YAML:", e);
        }
    }
    return { frontmatter: null, restContent: content };
}

class MocNameModal extends Modal {
    onSubmit: (mocName: string) => void;

    constructor(app: App, onSubmit: (mocName: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl("h2", { text: "Enter MOC Name" });

        const input = contentEl.createEl("input", {
            type: "text",
            placeholder: "e.g., Science",
        });

        input.style.width = "100%";
        input.style.marginBottom = "10px";

        const submitButton = contentEl.createEl("button", { text: "Submit" });
        submitButton.style.display = "block";

        submitButton.onclick = () => {
            const mocName = input.value.trim();
            if (mocName) {
                this.onSubmit(mocName);
                this.close();
            } else {
                new Notice("MOC name cannot be empty.");
            }
        };

        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                const mocName = input.value.trim();
                if (mocName) {
                    this.onSubmit(mocName);
                    this.close();
                } else {
                    new Notice("MOC name cannot be empty.");
                }
            }
        });

        input.focus();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
