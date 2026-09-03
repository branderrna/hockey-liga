import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    nitro({
      preset: "cloudflare-module",
      compatibilityDate: { cloudflare: "2026-09-03" },
      cloudflare: { nodeCompat: true },
      framework: {
        deployCommand: 'npx --no-install wrangler --cwd .output deploy --name "$WORKER_NAME"',
      },
    }),
    react(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
