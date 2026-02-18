import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: ".",
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: "dist/public",
    emptyOutDir: true,
    sourcemap: false,
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
    target: "es2015",
  },
  esbuild: {
    legalComments: "none",
  },
  server: {
    port: 5174,
    hmr: {
      overlay: true,
    },
  },
});
