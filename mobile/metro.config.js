const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Allow importing from shared folder
config.watchFolders = [path.resolve(__dirname, "../shared")];

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "../shared"),
];

// Enable NativeWind (Tailwind CSS for React Native)
module.exports = withNativeWind(config, { input: "./global.css" });
