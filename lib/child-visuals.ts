import { normalizeText } from "@/lib/scoring";

const VISUAL_MAP: Record<string, string> = {
  casa: "🏠",
  livro: "📘",
  sol: "☀️",
  mesa: "🪑",
  carro: "🚗",
  janela: "🪟",
  cadeira: "🪑",
  chave: "🔑",
  prato: "🍽️",
  retrato: "🖼️",
  escada: "🪜",
  tapete: "🧶",
  fogao: "🍳",
  copo: "🥛",
  quadro: "🖼️",
  bola: "⚽",
  urso: "🐻",
  suco: "🧃",
  cama: "🛏️",
  luz: "💡",
  dado: "🎲",
  meia: "🧦",
  pipa: "🪁",
  tinta: "🎨",
  roda: "🛞",
  bota: "🥾",
  giz: "🖍️",
  leite: "🥛",
  gato: "🐱",
  arvore: "🌳",
  rio: "🏞️",
  porta: "🚪",
  lapis: "✏️",
  flor: "🌸",
  caderno: "📒",
  pedra: "🪨",
  ponte: "🌉",
  borracha: "🩹",
  folha: "🍃",
  caneta: "🖊️",
  chuva: "🌧️",
  mochila: "🎒",
  pato: "🦆",
  nuvem: "☁️",
  cola: "🧴",
  abelha: "🐝",
  aviao: "✈️",
  pao: "🍞",
  relogio: "⏰",
  escola: "🏫",
  mar: "🌊",
  onibus: "🚌",
  cafe: "☕",
  praia: "🏖️",
  bicicleta: "🚲",
  almoco: "🍽️",
  parque: "🎠",
  bike: "🚲",
  pracinha: "🛝",
  tenis: "👟",
  recreio: "🧒",
  patins: "🛼",
  fruta: "🍎",
  amigo: "🧑",
  balanco: "🎡",
  lua: "🌙",
  estrela: "⭐",
  ceu: "🌌",
  noite: "🌃",
  coberta: "🛌",
  sereno: "💧",
  lanterna: "🔦",
  pijama: "🧸",
  verde: "🟢",
  azul: "🔵",
  vermelho: "🔴",
  amarelo: "🟡",
  preto: "⚫",
  branco: "⚪",
  laranja: "🟠",
  rosa: "🌸",
  cinza: "🩶",
  roxo: "🟣",
  bolo: "🎂",
  banana: "🍌",
  maca: "🍎",
  medico: "🩺",
  banho: "🛁",
  agua: "💧",
  escova: "🪥",
  sorriso: "😊",
  alto: "⬆️",
  baixo: "⬇️",
  grande: "🦒",
  pequeno: "🐭",
  longo: "📏",
  curto: "✂️",
  cima: "⬆️",
  esquerda: "⬅️",
  direita: "➡️",
  baixo_direcao: "⬇️",
  "@": "⭐",
  "#": "🔷",
  "▲": "🔺",
  "●": "🔵",
  "■": "🟩",
  "◆": "🔶",
  "⬟": "🟪",
  "⬢": "🔷",
  "🔺": "🔺",
  "🔵": "🔵",
  "🟩": "🟩",
  "🔶": "🔶",
  "🟣": "🟣",
  "🟨": "🟨",
  "⬛": "⬛",
  "🔷": "🔷",
  "🟥": "🟥",
};

const NUMBER_VISUALS = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

export function getChildVisual(token: string) {
  const normalized = normalizeText(token);

  if (VISUAL_MAP[normalized]) return VISUAL_MAP[normalized];
  if (VISUAL_MAP[token]) return VISUAL_MAP[token];

  if (/^\d+$/.test(token)) {
    return token
      .split("")
      .map((digit) => NUMBER_VISUALS[Number(digit)] ?? "🔢")
      .join("");
  }

  if (/^[A-Z]$/i.test(token)) return "🔤";
  if (/^[A-Z]+\d+$/i.test(token)) return "🧩";
  if (token.includes("R$")) return "💰";
  if (token.includes("bola")) return "⚽";
  if (token.includes("estrela")) return "⭐";
  if (token.includes("cubos")) return "🧱";
  if (token.includes("nuvens")) return "☁️";
  if (token.includes("lapis")) return "✏️";
  if (token.includes("minuto") || token.includes("hora") || token.includes("segundo")) return "⏱️";

  return "✨";
}
