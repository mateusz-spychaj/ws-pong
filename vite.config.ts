import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "src",
  publicDir: false,
  envDir: "../",
  plugins: [react()],
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    sourcemap: false,
    minify: "esbuild",
    cssMinify: "esbuild",
    target: "es2015",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        controller: resolve(__dirname, "src/controller.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
  esbuild: {
    legalComments: "none",
  },
  server: {
    port: 5173,
    hmr: {
      overlay: true,
    },
  },
});
