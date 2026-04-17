import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NeuroApp Memoria",
    short_name: "NeuroApp",
    description: "Treino cognitivo com memoria, atencao, comparacao, orientacao espacial e logica.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4efe6",
    theme_color: "#cf5f3c",
    lang: "pt-BR",
  };
}
