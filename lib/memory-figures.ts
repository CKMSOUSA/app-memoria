import { getChildVisual } from "@/lib/child-visuals";
import { normalizeText } from "@/lib/scoring";

export type MemoryFigureMap = Record<string, string>;

const MEMORY_FALLBACK_VISUALS = [
  "\u{1F98B}",
  "\u{1F308}",
  "\u{1F340}",
  "\u{1F388}",
  "\u{1FA81}",
  "\u{1F9F8}",
  "\u{1F3AF}",
  "\u{1F31F}",
  "\u{1F3A8}",
  "\u{1F9E9}",
  "\u{1F984}",
  "\u{1F420}",
  "\u{1F33C}",
  "\u{1F34E}",
  "\u{1F682}",
  "\u{26F5}",
  "\u{1F48E}",
  "\u{1F514}",
  "\u{1F9F1}",
  "\u{1F680}",
  "\u{1F3D6}\uFE0F",
  "\u{1F3A0}",
  "\u{1F3B2}",
  "\u{1F4D8}",
  "\u{1F511}",
  "\u{1F4A1}",
  "\u{1F33B}",
  "\u{1F3C0}",
  "\u{1F9ED}",
  "\u{1F4CC}",
  "\u{1F4AB}",
  "\u{1F9CA}",
];

function hashToken(token: string, salt: number) {
  return `${token}:${salt}`.split("").reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
}

export function getMemoryBaseFigure(token: string) {
  const visual = getChildVisual(token);
  if (visual !== "\u2728") return visual;
  return MEMORY_FALLBACK_VISUALS[hashToken(token, 7) % MEMORY_FALLBACK_VISUALS.length];
}

export function getMemoryFigureMap(tokens: string[]) {
  const used = new Set<string>();
  const map: MemoryFigureMap = {};

  Array.from(new Set(tokens.map((token) => normalizeText(token)).filter(Boolean))).forEach((token) => {
    const baseVisual = getMemoryBaseFigure(token);

    if (!used.has(baseVisual)) {
      map[token] = baseVisual;
      used.add(baseVisual);
      return;
    }

    const firstFallbackIndex = hashToken(token, 19) % MEMORY_FALLBACK_VISUALS.length;
    let fallback = baseVisual;

    for (let offset = 0; offset < MEMORY_FALLBACK_VISUALS.length; offset += 1) {
      const candidate = MEMORY_FALLBACK_VISUALS[(firstFallbackIndex + offset) % MEMORY_FALLBACK_VISUALS.length];
      if (!used.has(candidate)) {
        fallback = candidate;
        break;
      }
    }

    map[token] = fallback;
    used.add(fallback);
  });

  return map;
}

export function getMemoryFigure(token: string, figureMap?: MemoryFigureMap) {
  const normalized = normalizeText(token);
  return figureMap?.[normalized] ?? getMemoryBaseFigure(normalized);
}

export function getStableVisualChoices(expectedItems: string[], allVariations: string[][], challengeId: number, variation: number) {
  const extras = Array.from(new Set(allVariations.flat().filter((item) => !expectedItems.includes(item))));
  const seed = challengeId * 31 + variation * 17;
  const scoreFor = (token: string, offset: number) => hashToken(token, seed + offset);

  const orderedExtras = [...extras].sort((left, right) => scoreFor(left, 11) - scoreFor(right, 11));
  const pickedExtras = orderedExtras.slice(0, Math.max(3, Math.min(5, orderedExtras.length)));

  return Array.from(new Set([...expectedItems, ...pickedExtras])).sort(
    (left, right) => scoreFor(left, 23) - scoreFor(right, 23),
  );
}
