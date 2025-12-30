const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Configuration pour résoudre les modules ESM comme lucide-react-native
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver?.sourceExts || []), "mjs", "cjs"],
  assetExts: config.resolver?.assetExts?.filter((ext) => ext !== "svg") || [],
  unstable_enablePackageExports: true,
  unstable_enableSymlinks: true,
};

// Transformer pour mieux gérer les modules ESM
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: true,
      inlineRequires: true,
    },
  }),
};

module.exports = config;

