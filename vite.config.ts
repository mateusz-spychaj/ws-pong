import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: ".",
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: "public",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        controller: resolve(__dirname, "controller.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
    minify: "esbuild",
    cssMinify: "esbuild",
  },
  server: {
    port: 5174,
    hmr: {
      overlay: true,
    },
  },
});
