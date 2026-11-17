// Vendor-neutral build: standard TanStack Start + Vite 7 plugins. The server
// target is chosen with NITRO_PRESET (default node-server, or vercel when Vercel
// builds; see scripts/nitro-target.ts). No hosting provider is assumed.
import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { readdirSync, readFileSync } from "node:fs";
import { nitroTarget } from "./scripts/nitro-target";
import { resolve } from "node:path";
import type { Plugin } from "vite";

const docsCatalogPlugin: Plugin = {
  name: "rout-docs-catalog",
  configureServer(server) {
    const refresh = (file: string) => {
      if (!file.includes("/src/content/") || !file.endsWith(".mdx")) return;
      const catalog = server.moduleGraph.getModuleById("\0virtual:rout-docs");
      if (catalog) server.moduleGraph.invalidateModule(catalog);
      server.ws.send({ type: "full-reload" });
    };
    server.watcher.on("add", refresh);
    server.watcher.on("unlink", refresh);
  },
  handleHotUpdate({ file, server }) {
    if (!file.includes("/src/content/") || !file.endsWith(".mdx")) return;
    const catalog = server.moduleGraph.getModuleById("\0virtual:rout-docs");
    if (catalog) server.moduleGraph.invalidateModule(catalog);
    server.ws.send({ type: "full-reload" });
  },
  resolveId(id: string) { if (id === "virtual:rout-docs") return "\0virtual:rout-docs"; },
  load(id: string) {
    if (id !== "\0virtual:rout-docs") return;
    const sources: Record<string, string> = {};
    const visit = (dir: string, relative = "") => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const name = `${relative}${entry.name}`;
        if (entry.isDirectory()) visit(resolve(dir, entry.name), `${name}/`);
        else if (name.endsWith(".mdx")) sources[`/src/content/${name}`] = readFileSync(resolve(dir, entry.name), "utf8");
      }
    };
    visit(resolve("src/content"));
    return `export default ${JSON.stringify(sources)}`;
  },
};

export default defineConfig(({ command, mode }) => {
  const envDefine: Record<string, string> = {};
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), "VITE_"))) {
    envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
  }
  return {
    define: envDefine,
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
    server: { host: "::", port: Number(process.env["PORT"] ?? 8080) },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        importProtection: { behavior: "error", client: { files: ["**/server/**"], specifiers: ["server-only"] } },
        // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
        server: { entry: "server" },
      }),
      ...(command === "build" ? [nitro(nitroTarget(process.env))] : []),
      viteReact(),
      docsCatalogPlugin,
      mdx({ include: /\.mdx$/, providerImportSource: "@mdx-js/react", remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm] }),
    ],
  };
});
