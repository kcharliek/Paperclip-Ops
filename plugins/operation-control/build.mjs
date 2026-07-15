import { build } from "esbuild";
import { createPluginBundlerPresets } from "@paperclipai/plugin-sdk/bundlers";

const presets = createPluginBundlerPresets({
  workerEntry: "src/worker.ts",
  manifestEntry: "src/manifest.ts",
  uiEntry: "src/ui/index.tsx",
  sourcemap: true,
});

await Promise.all([
  build(presets.esbuild.worker),
  build(presets.esbuild.manifest),
  build(presets.esbuild.ui),
]);
