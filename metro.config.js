const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Fix for pnpm symlinks
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = withNativeWind(config, { input: "./global.css" });
