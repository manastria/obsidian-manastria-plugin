#!/bin/bash

# --- CONFIGURATION ---
USER_NAME="jpdemory"
GROUP_NAME="jpdemory"

# Chemins des sources
VAULT_ORIGINAL="/home/${USER_NAME}/Documents/Obsidian/gclasse"
PLUGIN_DEV_DIST="/home/${USER_NAME}/projets/obsidian-manastria-plugin/dist"

# Chemins OverlayFS (Temporaires)
TMP_BASE="/tmp/obsidian_overlay_data"
UPPER_DIR="${TMP_BASE}/upper"
WORK_DIR="${TMP_BASE}/work"
MOUNT_POINT="/tmp/zone_de_test"

# Chemins internes au Vault monté
TARGET_PLUGIN_DIR="${MOUNT_POINT}/.obsidian/plugins/manastria-plugin"
TARGET_BRAT_DIR="${MOUNT_POINT}/.obsidian/plugins/obsidian42-brat"

# --- 1. NETTOYAGE (RESET) ---
echo "--- 🔄 Préparation de l'environnement ---"

# Si le point de montage est actif, on démonte
if mountpoint -q "${MOUNT_POINT}"; then
    echo "Démontage de l'ancienne zone de test..."
    sudo umount "${MOUNT_POINT}"
fi

# On supprime les données temporaires précédentes (couche modifiable)
echo "Suppression des anciens fichiers temporaires..."
sudo rm -rf "${TMP_BASE}"
# On recrée l'arborescence propre
mkdir -p "${UPPER_DIR}" "${WORK_DIR}" "${MOUNT_POINT}"

# --- 2. MONTAGE OVERLAYFS ---
echo "--- 🛡️  Montage du système de fichiers (OverlayFS) ---"
sudo mount -t overlay overlay \
    -o lowerdir="${VAULT_ORIGINAL}",upperdir="${UPPER_DIR}",workdir="${WORK_DIR}" \
    "${MOUNT_POINT}"

# --- 3. INJECTION DU PLUGIN ---
echo "--- 💉 Injection du plugin de développement ---"

# On s'assure que le dossier du plugin existe dans la destination
# (S'il n'existe pas dans la source, mkdir le créera dans l'upperdir)
mkdir -p "${TARGET_PLUGIN_DIR}"

# Copie des fichiers dist
cp "${PLUGIN_DEV_DIST}/main.js" "${TARGET_PLUGIN_DIR}/"
cp "${PLUGIN_DEV_DIST}/manifest.json" "${TARGET_PLUGIN_DIR}/"
cp "${PLUGIN_DEV_DIST}/styles.css" "${TARGET_PLUGIN_DIR}/"
echo "✅ Plugin Manastria copié (v. dev)."

# --- 4. SUPPRESSION DE BRAT ---
if [ -d "${TARGET_BRAT_DIR}" ]; then
    rm -rf "${TARGET_BRAT_DIR}"
    echo "❌ Plugin BRAT supprimé."
else
    echo "ℹ️  Plugin BRAT non trouvé, rien à supprimer."
fi

# --- 5. CORRECTION DES PERMISSIONS ---
# Comme ce script tourne avec sudo/root, les fichiers copiés appartiennent à root.
# On les rend à l'utilisateur pour qu'Obsidian puisse les lire/écrire.
echo "--- 🔑 Correction des permissions ---"
chown -R ${USER_NAME}:${GROUP_NAME} "${UPPER_DIR}" "${MOUNT_POINT}"

echo "--- 🚀 PRÊT ! ---"
echo "Vous pouvez ouvrir ce Vault dans Obsidian :"
echo "📂 ${MOUNT_POINT}"
