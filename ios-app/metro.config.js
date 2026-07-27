// Metro (React Native's bundler) doesn't understand pnpm workspaces out of the
// box — it needs to be told to also watch the monorepo root and resolve
// dependencies from the root node_modules (where pnpm hoists/symlinks
// workspace packages like @kharch/app-logic).
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
