import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Milandhoo Market",
    short_name: "Milandhoo",
    description: "Buy from Milandhoo's shops, restaurants and home businesses.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f8",
    theme_color: "#0d8576",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
