import { TFile, Plugin, Notice } from "obsidian";
import YAML from "js-yaml";
import moment from "moment-timezone";

const base36MaxLength = 10;
const base62MaxLength = 11;
// Liste des champs scalaires à normaliser. Scalaires signifie qu'ils doivent être des chaînes ou null.
const scalarFields = ["permalink", "level", "type"];
type FrontmatterGroup = { name: string; keys: string[] };
const topGroups: FrontmatterGroup[] = [
    { name: "id", keys: ["id", "id36", "id62"] },
    { name: "dates", keys: ["date", "datetime", "created", "updated"] },
];
const bottomGroups: FrontmatterGroup[] = [
    { name: "taxonomy", keys: ["aliases", "tags", "type", "nature", "topics", "audience", "keywords"] },
    { name: "student-level", keys: ["option", "level", "target"] },
];

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
    const originalKeyOrder = frontmatter ? Object.keys(frontmatter) : [];
    const updatedFrontmatter = updateFrontmatter(frontmatter || {}, file); // Mettre à jour le front matter
    const sortedFrontmatter = sortFrontmatter(updatedFrontmatter, originalKeyOrder);
    const updatedContent = buildUpdatedContent(sortedFrontmatter, restContent); // Reconstruire le fichier
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

	// Si frontmatter.nature n'existe pas ou n'a pas de valeur, le supprimer
    if (!frontmatter.nature) {
        delete frontmatter.nature;
    }

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
	frontmatter.option = frontmatter.option || [];
	// Normaliser target -> targets et fusionner si besoin
	if (frontmatter.target !== undefined) {
		const normalizeList = (value: unknown): string[] => {
			if (Array.isArray(value)) {
				return value.map((entry) => String(entry ?? "")).filter((entry) => entry.length > 0);
			}
			if (value === null || value === undefined || value === "") {
				return [];
			}
			return [String(value)];
		};
		const mergedTargets = [
			...normalizeList(frontmatter.targets),
			...normalizeList(frontmatter.target),
		];
		const dedupedTargets = Array.from(new Set(mergedTargets));
		frontmatter.targets = dedupedTargets;
		delete frontmatter.target;
	}
	frontmatter.targets = frontmatter.targets || [];
    scalarFields.forEach((field) => {
        frontmatter[field] = normalizeScalarField(frontmatter[field]);
    });

	// Supprimer date/datetime si même jour que created (created est la source de vérité)
	if (frontmatter.created) {
		const createdDay = extractDayString(frontmatter.created);
		if (createdDay) {
			const dateDay = extractDayString(frontmatter.date);
			if (dateDay && dateDay === createdDay) {
				delete frontmatter.date;
			}
			const datetimeDay = extractDayString(frontmatter.datetime);
			if (datetimeDay && datetimeDay === createdDay) {
				delete frontmatter.datetime;
			}
		}
	}

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
    const normalizedYaml = normalizeEmptyScalarKeys(yamlString.trim(), scalarFields);
    return `---\n${normalizedYaml}\n---\n${content}`;
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

function normalizeScalarField(value: unknown): string | null {
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return null;
        }
        if (value.length === 1) {
            return String(value[0] ?? "");
        }
        return value.map((entry) => String(entry ?? "")).join(", ");
    }
    if (value === null || value === undefined) {
        return null;
    }
    return String(value);
}

function normalizeEmptyScalarKeys(yaml: string, keys: string[]): string {
    if (keys.length === 0) {
        return yaml;
    }
    const escapedKeys = keys.map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const pattern = new RegExp(`^(${escapedKeys.join("|")}):\\s*(?:null|''|\"\"|~)?\\s*$`, "gm");
    return yaml.replace(pattern, "$1:");
}

function extractDayString(value: unknown): string | null {
	if (value === null || value === undefined) {
		return null;
	}
	if (value instanceof Date) {
		const parsedDate = moment(value);
		return parsedDate.isValid() ? parsedDate.format("YYYY-MM-DD") : null;
	}
	const raw = String(value).trim();
	if (!raw) {
		return null;
	}
	const formats = [
		moment.ISO_8601,
		"YYYY-MM-DD",
		"YYYY-MM-DDTHH:mm",
		"YYYY-MM-DDTHH:mm:ss",
		"YYYY-MM-DDTHH:mm:ss.SSSZ",
		"DD.MM.YYYY",
		"DD.MM.YYYY HH:mm",
		"DD.MM.YYYY HH:mm:ss",
	];
	const parsed = moment(raw, formats, true);
	if (!parsed.isValid()) {
		return null;
	}
	return parsed.format("YYYY-MM-DD");
}

function sortFrontmatter(frontmatter: Record<string, unknown>, originalOrder: string[]): Record<string, unknown> {
    const sorted: Record<string, unknown> = {};
    const seen = new Set<string>();
    const groupedKeys = new Set<string>();
    [...topGroups, ...bottomGroups].forEach((group) => {
        group.keys.forEach((key) => groupedKeys.add(key));
    });

    const addKey = (key: string) => {
        if (seen.has(key) || !(key in frontmatter)) {
            return;
        }
        sorted[key] = frontmatter[key];
        seen.add(key);
    };

    topGroups.forEach((group) => group.keys.forEach(addKey));

    const middleKeys = (originalOrder.length > 0 ? originalOrder : Object.keys(frontmatter)).filter(
        (key) => !groupedKeys.has(key),
    );
    middleKeys.forEach(addKey);

    Object.keys(frontmatter).forEach((key) => {
        if (!groupedKeys.has(key)) {
            addKey(key);
        }
    });

    bottomGroups.forEach((group) => group.keys.forEach(addKey));

    return sorted;
}
