// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://fleetlix.com",
  // Bind the dev server to 0.0.0.0 so it's reachable off localhost (LAN,
  // OrbStack, Tailscale). Must live at Astro's top level — Astro overwrites
  // vite.server.host with this value. Only affects `astro dev`; `astro
  // preview` and the nginx production image are unaffected.
  server: {
    host: true,
  },
  build: {
    inlineStylesheets: "never",
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes("/thank-you"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    // Vite rejects dev-server requests whose Host header isn't allow-listed
    // (DNS-rebinding protection: "Blocked request. This host is not allowed").
    // Permit the names we actually reach the dev server by. Astro owns the
    // Vite config, so this lives here — a standalone vite.config.ts is ignored.
    server: {
      allowedHosts: [
        "mac-server.local", // LAN mDNS — set to your Mac's Local Hostname (System Settings > General > Sharing)
        ".orb.local", // OrbStack auto-domains
        ".ts.net", // Tailscale MagicDNS (remote access)
      ],
    },
  },
});
