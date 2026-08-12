import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SoloDM",
    short_name: "SoloDM",
    description: "An open-ended solo D&D 5e campaign, run by Claude as your Dungeon Master.",
    start_url: "/",
    display: "standalone",
    background_color: "#1b1712",
    theme_color: "#1b1712",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
