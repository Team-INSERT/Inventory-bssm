// @ts-check
const { spawnSync } = require("node:child_process");

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ?? crypto.randomUUID();

module.exports = {
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  globDirectory: process.cwd(),
  globPatterns: [".next/static/**/*.{js,css,html,ico,png,svg,webp,json,webmanifest}", "public/**/*"],
  globIgnores: ["public/sw.js"],
  modifyURLPrefix: {
    ".next/static/": "/_next/static/",
    "public/": "/",
  },
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
};
