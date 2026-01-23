# Obsidian Sample Plugin

This is a sample plugin for Obsidian (https://obsidian.md).

This project uses TypeScript to provide type checking and documentation.
The repo depends on the latest plugin API (obsidian.d.ts) in TypeScript Definition format, which contains TSDoc comments describing what it does.

This sample plugin demonstrates some of the basic functionality the plugin API can do.
- Adds a ribbon icon, which shows a Notice when clicked.
- Adds a command "Open Sample Modal" which opens a Modal.
- Adds a plugin setting tab to the settings page.
- Registers a global click event and output 'click' to the console.
- Registers a global interval which logs 'setInterval' to the console.

## First time developing plugins?

Quick starting guide for new plugin devs:

- Check if [someone already developed a plugin for what you want](https://obsidian.md/plugins)! There might be an existing plugin similar enough that you can partner up with.
- Make a copy of this repo as a template with the "Use this template" button (login to GitHub if you don't see it).
- Clone your repo to a local development folder. For convenience, you can place this folder in your `.obsidian/plugins/your-plugin-name` folder.
- Install NodeJS, then run `npm i` in the command line under your repo folder.
- Run `npm run dev` to compile your plugin from `main.ts` to `main.js`.
- Make changes to `main.ts` (or create new `.ts` files). Those changes should be automatically compiled into `main.js`.
- Reload Obsidian to load the new version of your plugin.
- Enable plugin in settings window.
- For updates to the Obsidian API run `npm update` in the command line under your repo folder.

## Releasing new releases

There are two supported workflows: manual (GitHub UI) or automated (GitHub CLI).

### Common steps

1. Update `manifest.json` with your new version number (example: `1.0.1`) and the minimum Obsidian version for this release.
2. Update `versions.json` with `"new-plugin-version": "minimum-obsidian-version"` so older Obsidian versions can download a compatible plugin.

### Manual (GitHub UI)

1. Run `npm run zip` to build and create `releases/<id>-v<version>.zip`.
2. Create a new GitHub release using your version as the tag (no `v` prefix).
3. Upload these release assets:
   - `manifest.json`
   - `dist/main.js` (asset name will be `main.js`)
   - `styles.css` (if used)
   - `releases/<id>-v<version>.zip` (optional, but handy for manual installs)
   BRAT expects the loose files, it does not read inside the zip.
4. Publish the release.

### Automated (GitHub CLI)

Prereqs: install GitHub CLI (`gh`) and run `gh auth login`.

Workflow (recommended):

1. Update versions:
   - Edit `manifest.json` (`version` and `minAppVersion`).
   - Run `npm version patch|minor|major` to bump the version and sync files.
     This updates:
     - `manifest.json` (version)
     - `package.json` (version)
     - `versions.json` (adds the new entry)
   - If you only need to change `minAppVersion` without changing the plugin version,
     edit `manifest.json` and `versions.json` manually (do not run `npm version`).
2. Commit the changes:
   - `git add manifest.json package.json package-lock.json versions.json`
   - `git commit -m "Release x.y.z"`
3. Push:
   - `git push`
   - If `npm version` created a tag locally, also push tags: `git push --tags`
4. Run `npm run release`.
   This builds the zip, creates/pushes the tag (if missing), and creates the GitHub release
   with both the zip and loose assets.

Notes on `npm version`:
- `npm version patch|minor|major` updates version fields and creates a Git tag.
- It runs `preversion`, `version`, and `postversion` npm scripts if present.
- If you already committed and only want to update version files, run it before the release commit.

## Adding your plugin to the community plugin list

- Check the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.

## How to use

- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## Improve code quality with eslint (optional)
- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code. 
- To use eslint with this project, make sure to install eslint from terminal:
  - `npm install -g eslint`
- To use eslint to analyze this project use this command:
  - `eslint main.ts`
  - eslint will then create a report with suggestions for code improvement by file and line number.
- If your source code is in a folder, such as `src`, you can use eslint with this command to analyze all files in that folder:
  - `eslint .\src\`


## API Documentation

See https://github.com/obsidianmd/obsidian-api
