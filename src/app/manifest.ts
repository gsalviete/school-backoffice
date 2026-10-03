import type { MetadataRoute } from "next";

// Permite "Adicionar à tela inicial" no celular. Sem service worker: offline está fora de escopo.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Escola — chamada e mensalidades",
    short_name: "Escola",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1f5fbf",
    lang: "pt-BR",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
