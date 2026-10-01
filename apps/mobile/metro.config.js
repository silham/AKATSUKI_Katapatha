// Metro in a pnpm workspace.
//
// The workspace packages (@katapatha/tokens, /core, /api-client, /contracts)
// are symlinks into ../../packages/* and expose raw .ts source via their
// "exports" map -- nothing is pre-built. Metro's default watchFolders is the
// project root only, so without this it cannot see, watch or transform any of
// them, and `import { color } from "@katapatha/tokens/tokens"` fails to
// resolve. This is a requirement for the app to bundle at all, not a tuning
// knob.
//
// nodeModulesPaths is the pnpm half: dependencies are hoisted to the workspace
// root rather than nested, so resolution has to look in both places.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// pnpm's symlinked store means one package can otherwise be resolved through
// two paths and bundled twice.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
