import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import prerender from "vite-plugin-prerender";

const Renderer = prerender.PuppeteerRenderer || prerender.default?.PuppeteerRenderer;

const seoRoutes = [
  '/generator-modul-ajar',
  '/generator-rpp',
  '/generator-lkpd',
  '/generator-asesmen',
  '/kurikulum-merdeka',
  '/kurikulum-kbc',
  '/rpp-madrasah',
  '/modul-ajar-mi',
  '/modul-ajar-mts',
  '/modul-ajar-ma',
  '/blog'
];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && prerender({
      staticDir: path.join(__dirname, 'dist'),
      routes: seoRoutes,
      renderer: Renderer ? new Renderer({
        headless: true,
        renderAfterDocumentEvent: 'render-event',
      }) : undefined
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

