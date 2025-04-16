
import { defineConfig } from "vite";
import { getPlugins } from "./src/config/vite/plugins";
import { serverConfig } from "./src/config/vite/server";
import { aliasConfig } from "./src/config/vite/aliases";

export default defineConfig(({ mode }) => ({
  server: serverConfig,
  plugins: getPlugins(mode),
  resolve: {
    alias: aliasConfig,
  },
}));
