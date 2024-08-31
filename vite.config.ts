import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import checker from "vite-plugin-checker";

export default defineConfig({
  root: "examples",
  plugins: [
    dts({
      include: ["lib"],
      rollupTypes: true,
    }),
    checker({ typescript: true }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "lib/main.ts"),
      formats: ["es", "umd"],
      fileName: "main",
      name: "GraphFlow",
    },
    copyPublicDir: false,
  },
});
