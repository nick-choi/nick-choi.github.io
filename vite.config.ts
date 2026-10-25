import { defineConfig } from "vite";
import config from "./viewer.config";
export default defineConfig({
  base: config.base,
  build: { emptyOutDir: true },
  server: { allowedHosts: true },
});
