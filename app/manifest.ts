import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GoTradeGo",
    short_name: "GoTradeGo",
    description: "GoTradeGo Web App",
    start_url: "/tr",
    display: "standalone",
    background_color: "#F7F7F9",
    theme_color: "#1A62C2",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "64x64",
        type: "image/x-icon",
      },
    ],
  };
}


