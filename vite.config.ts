import { defineConfig } from "vite";
import { resolve } from "path";
import { createHtmlPlugin } from "vite-plugin-html";

export default defineConfig(({ mode }) => ({
  root: ".",
  publicDir: false,
  plugins:
    mode === "production"
      ? [
          createHtmlPlugin({
            minify: {
              collapseWhitespace: true,
              removeComments: true,
              removeRedundantAttributes: true,
              removeScriptTypeAttributes: true,
              removeStyleLinkTypeAttributes: true,
              useShortDoctype: true,
              minifyCSS: true,
              minifyJS: true,
            },
          }),
        ]
      : [],
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
    port: 5173,
    hmr: {
      overlay: true,
    },
  },
}));
