import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/app.ts", "src/sentry.preload.ts"],
  noExternal: [/@orra/],
  splitting: false,
  bundle: true,
  outDir: "dist",
  clean: true,
  minify: false,
  sourcemap: false,
  format: ["esm"],
  target: "node20",
  banner: {
    js: `
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
`,
  },
});
