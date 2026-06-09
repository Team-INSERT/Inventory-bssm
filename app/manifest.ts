import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "재고관리",
    short_name: "재고관리",
    description: "재고 관리 시스템",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "ko",
    theme_color: "#0f172a",
    background_color: "#f8fafc",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable" as any,
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable" as any,
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
