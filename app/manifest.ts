import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NeuroApp Memória",
    short_name: "NeuroApp",
    description: "Treino cognitivo com memória, atenção, comparação, orientação espacial e lógica.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4efe6",
    theme_color: "#cf5f3c",
    lang: "pt-BR",
  };
}
