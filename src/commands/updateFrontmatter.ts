import { TFile, Plugin, Notice } from "obsidian";
import YAML from "js-yaml";
import moment from "moment-timezone";

const base36MaxLength = 10;
const base62MaxLength = 11;

// Fonction pour enregistrer la commande
export function registerUpdateFrontmatterCommand(plugin: Plugin) {
    plugin.addCommand({
        id: "update-frontmatter",
        name: "Update Frontmatter",
        checkCallback: (checking: boolean) => {
            const activeFile = plugin.app.workspace.getActiveFile();
            if (activeFile) {
                if (!checking) {
                    updateFile(plugin, activeFile);
                }
                return true;
            }
            return false;
        },
    });
}

// Fonction principale de mise à jour
async function updateFile(plugin: Plugin, file: TFile): Promise<void> {
    const content = await plugin.app.vault.read(file); // Lire le contenu du fichier
    const { frontmatter, restContent } = parseFrontmatter(content); // Extraire le front matter
    const updatedFrontmatter = updateFrontmatter(frontmatter || {}, file); // Mettre à jour le front matter
    const updatedContent = buildUpdatedContent(updatedFrontmatter, restContent); // Reconstruire le fichier
    await plugin.app.vault.modify(file, updatedContent); // Écrire dans le fichier
    new Notice(`Frontmatter updated for ${file.name}`);
}

// Fonction pour extraire le front matter et le reste du contenu
function parseFrontmatter(content: string): { frontmatter: any; restContent: string } {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (match) {
        try {
            const frontmatter = YAML.load(match[1]) || {};
            return { frontmatter, restContent: match[2] };
        } catch (e) {
            console.error("Failed to parse YAML:", e);
        }
    }
    return { frontmatter: null, restContent: content };
}

// Fonction pour mettre à jour le front matter
function updateFrontmatter(frontmatter: any, file: TFile): any {
    const now = formatDateWithTimezone(new Date());
    const fileCreationDate = formatDateWithTimezone(new Date(file.stat.ctime));
    const fileModifiedDate = formatDateWithTimezone(new Date(file.stat.mtime));

    if (!frontmatter.id) {
        frontmatter.id = generateUUID();
    }
    const { base36, base62 } = generateBase36AndBase62(frontmatter.id);
    frontmatter.id36 = frontmatter.id36 || base36;
    frontmatter.id62 = frontmatter.id62 || base62;

    frontmatter.created = frontmatter.created || fileCreationDate;
    frontmatter.updated = now;

    frontmatter.nature = frontmatter.nature || "fiche";
    frontmatter.status = frontmatter.status || "wip";
    frontmatter.publish = frontmatter.publish || false;
    frontmatter.private = frontmatter.private || false;
    if (!Array.isArray(frontmatter["disabled rules"])) {
		frontmatter["disabled rules"] = ["capitalize-headings"];
	}	
    frontmatter.aliases = frontmatter.aliases || [];
    frontmatter.tags = frontmatter.tags || [];
	frontmatter.audience = frontmatter.audience || [];
	frontmatter.topics = frontmatter.topics || [];
	frontmatter.level = frontmatter.level || [];
	frontmatter.option = frontmatter.option || [];
	frontmatter.target = frontmatter.target || [];
	frontmatter.keywords = frontmatter.keywords || [];
	frontmatter.permalink = frontmatter.permalink || "";

    return frontmatter;
}

// Fonction pour reformater le fichier
function buildUpdatedContent(frontmatter: any, content: string): string {
    const yamlString = YAML.dump(frontmatter, {
        indent: 2,
        lineWidth: 1000,
        noRefs: true,
        skipInvalid: true,
    });
    return `---\n${yamlString.trim()}\n---\n${content}`;
}


// Fonctions utilitaires pour les dates et UUIDs
function formatDateWithTimezone(date: Date, timezone?: string): string {
    const effectiveTimezone = timezone || moment.tz.guess();
    return moment(date).tz(effectiveTimezone).format();
}

function generateUUID(): string {
    return crypto.randomUUID();
}

function uuidToInt(uuid: string): number {
    return parseInt(uuid.replace(/-/g, ""), 16);
}

function intToBase36(num: number): string {
    const characters = "0123456789abcdefghijklmnopqrstuvwxyz";
    let result = "";
    do {
        result = characters[num % 36] + result;
        num = Math.floor(num / 36);
    } while (num > 0);
    return result.padStart(base36MaxLength, "0");
}

function intToBase62(num: number): string {
    const characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    do {
        result = characters[num % 62] + result;
        num = Math.floor(num / 62);
    } while (num > 0);
    return result.padStart(base62MaxLength, "0");
}

function generateBase36AndBase62(uuid: string): { base36: string; base62: string } {
    const num = uuidToInt(uuid);
    return {
        base36: intToBase36(num).slice(0, base36MaxLength),
        base62: intToBase62(num).slice(0, base62MaxLength),
    };
}
