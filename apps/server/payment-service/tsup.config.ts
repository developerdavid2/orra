import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/render.ts", "src/sentry.preload.ts"],
  noExternal: [/@orra/, "bullmq", "ioredis"],
  external: ["rate-limiter-flexible"],
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
import { createRequire as _createRequire } from 'module';
const require = _createRequire(import.meta.url);
`,
  },
});
