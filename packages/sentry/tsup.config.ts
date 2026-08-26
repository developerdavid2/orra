import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/client.ts",
    "src/server.ts",
    "src/tracing.ts",
    "src/error-boundary.tsx",
    "src/trpc.ts",
    "src/filters.ts",
  ],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    "@sentry/nextjs",
    "@sentry/react",
    "@tanstack/react-query",
    "next",
    "react",
    "@trpc/server",
  ],
  noExternal: [
    "@sentry/node",
    "@sentry/profiling-node",
    "@sentry/react",
    "superjson",
  ],
  platform: "node",
  target: "node20",
  outDir: "dist",
  treeshake: true,
  esbuildOptions: (options) => {
    options.banner = {
      js: '"use client"',
    };
  },
});
