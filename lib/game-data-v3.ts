import type {
  AttentionChallenge,
  ComparisonChallenge,
  ExclusiveChallenge,
  FocusVisionChallenge,
  LogicChallenge,
  MemoryChallenge,
  ProcessChallenge,
  SpatialChallenge,
  VisualMemoryChallenge,
} from "@/lib/types";

const PHASE_LABELS_15 = [
  "Muito fácil",
  "Fácil",
  "Menos fácil",
  "Intermediária",
  "Intermediária plus",
  "Desafiadora",
  "Desafiadora plus",
  "Avançada 1",
  "Avançada 2",
  "Avançada 3",
  "Especialista 1",
  "Especialista 2",
  "Especialista 3",
  "Mestre 1",
  "Mestre 2",
];

const PHASE_LABELS_10 = [
  "Muito fácil",
  "Fácil",
  "Menos fácil",
  "Intermediária",
  "Intermediária plus",
  "Desafiadora",
  "Desafiadora plus",
  "Avançada",
  "Especialista",
  "Mestre",
];

type MemorySeed = {
  nome: string;
  nomeInfantil: string;
  adulto: string[][];
  infantil: string[][];
};

const memorySeeds: MemorySeed[] = [
  {
    nome: "Objetos do cotidiano",
    nomeInfantil: "Coisas da casa",
    adulto: [["casa", "livro", "sol", "mesa", "carro"], ["janela", "cadeira", "chave", "prato", "retrato"], ["escada", "tapete", "fogao", "copo", "quadro"]],
    infantil: [["bola", "urso", "suco", "cama", "luz"], ["dado", "meia", "pipa", "copo", "tinta"], ["roda", "bota", "casa", "giz", "leite"]],
  },
  {
    nome: "Natureza e estudo",
    nomeInfantil: "Bichos e escola",
    adulto: [["gato", "arvore", "rio", "porta", "lápis"], ["flor", "caderno", "pedra", "ponte", "borracha"], ["folha", "caneta", "chuva", "trilha", "mochila"]],
    infantil: [["gato", "flor", "rio", "cola", "lápis"], ["pato", "nuvem", "livro", "tinta", "folha"], ["abelha", "sol", "caderno", "chuva", "borracha"]],
  },
  {
    nome: "Movimento e rotina",
    nomeInfantil: "Passeio do dia",
    adulto: [["aviao", "pao", "relogio", "escola", "mar"], ["onibus", "cafe", "agenda", "trabalho", "praia"], ["bicicleta", "almoco", "alarme", "mercado", "parque"]],
    infantil: [["bike", "pao", "escola", "pracinha", "suco"], ["onibus", "lanche", "parque", "tenis", "recreio"], ["patins", "fruta", "mochila", "amigo", "balanco"]],
  },
  {
    nome: "Cenario noturno",
    nomeInfantil: "Noite calma",
    adulto: [["lua", "estrela", "céu", "noite", "nuvem"], ["cometa", "sombra", "vento", "silêncio", "brisa"], ["neblina", "lanterna", "constelação", "sereno", "aurora"]],
    infantil: [["lua", "estrela", "céu", "sono", "nuvem"], ["vento", "luz", "coberta", "janela", "noite"], ["sereno", "silêncio", "lanterna", "cometa", "pijama"]],
  },
  {
    nome: "Cores em foco",
    nomeInfantil: "Cores brincantes",
    adulto: [["verde", "azul", "vermelho", "amarelo", "preto"], ["branco", "laranja", "rosa", "cinza", "roxo"], ["turquesa", "bege", "marrom", "lilas", "dourado"]],
    infantil: [["azul", "verde", "rosa", "amarelo", "preto"], ["branco", "laranja", "roxo", "vermelho", "cinza"], ["lilas", "bege", "marrom", "dourado", "turquesa"]],
  },
  {
    nome: "Comidas e cozinha",
    nomeInfantil: "Lanche gostoso",
    adulto: [["arroz", "feijao", "prato", "forno", "faca"], ["sopa", "temperos", "cozinha", "panela", "suco"], ["massa", "salada", "bandeja", "fogao", "garfo"]],
    infantil: [["bolo", "suco", "prato", "uva", "pao"], ["sopa", "copo", "banana", "mesa", "faca"], ["doce", "leite", "lancheira", "garfo", "torta"]],
  },
  {
    nome: "Cidade e serviços",
    nomeInfantil: "Passeio na rua",
    adulto: [["praca", "banco", "loja", "faixa", "taxi"], ["hospital", "mercado", "avenida", "farmacia", "onibus"], ["prefeitura", "padaria", "esquina", "posto", "calcada"]],
    infantil: [["rua", "praca", "loja", "ponto", "bike"], ["escola", "parque", "faixa", "busao", "sorvete"], ["pracinha", "balao", "padaria", "caixa", "trator"]],
  },
  {
    nome: "Praia e clima",
    nomeInfantil: "Dia de sol",
    adulto: [["mar", "areia", "guarda-sol", "onda", "toalha"], ["concha", "vento", "quiosque", "protetor", "calor"], ["piscina", "boia", "brisa", "cadeira", "horizonte"]],
    infantil: [["sol", "mar", "areia", "bola", "toalha"], ["balde", "boia", "onda", "suco", "pazinha"], ["concha", "vento", "oculos", "água", "castelo"]],
  },
  {
    nome: "Escritório e trabalho",
    nomeInfantil: "Mesa de tarefas",
    adulto: [["agenda", "caneta", "reunião", "relatório", "telefone"], ["documento", "teclado", "monitor", "planilha", "pasta"], ["email", "projeto", "arquivo", "cafe", "anotação"]],
    infantil: [["mesa", "lápis", "papel", "regua", "estojo"], ["agenda", "caneta", "caderno", "cola", "folha"], ["desenho", "quadro", "tinta", "giz", "tesoura"]],
  },
  {
    nome: "Esportes e energia",
    nomeInfantil: "Brincadeiras e corrida",
    adulto: [["bola", "rede", "quadra", "tenis", "apito"], ["corrida", "pista", "medalha", "treino", "time"], ["camisa", "torcida", "placar", "salto", "goleiro"]],
    infantil: [["bola", "pula", "corre", "pega", "time"], ["corda", "cone", "quadra", "pique", "gol"], ["camisa", "tenis", "rede", "danca", "brinca"]],
  },
  {
    nome: "Animais e habitats",
    nomeInfantil: "Bichinhos do mundo",
    adulto: [["leao", "selva", "tigre", "savanna", "trilha"], ["pinguim", "gelo", "oceano", "foca", "frio"], ["coruja", "floresta", "lobo", "tocas", "musgo"]],
    infantil: [["leao", "gato", "urso", "zebra", "pato"], ["peixe", "gelo", "foca", "lobo", "ninho"], ["coruja", "rato", "sapo", "onca", "vaga-lume"]],
  },
  {
    nome: "Viagem e transporte",
    nomeInfantil: "Mala pronta",
    adulto: [["mala", "passagem", "aviao", "hotel", "mapa"], ["rodoviaria", "trem", "janela", "poltrona", "rota"], ["pedagio", "estrada", "bagagem", "taxi", "destino"]],
    infantil: [["mala", "busao", "janela", "mapa", "suco"], ["carro", "estrada", "hotel", "passeio", "lanche"], ["aviao", "nuvem", "ticket", "cadeira", "mala"]],
  },
  {
    nome: "Arte e música",
    nomeInfantil: "Som e desenho",
    adulto: [["pincel", "tela", "quadro", "violao", "ritmo"], ["teatro", "palco", "cena", "melodia", "coro"], ["escultura", "galeria", "som", "ensaio", "luz"]],
    infantil: [["tinta", "pincel", "música", "danca", "som"], ["giz", "papel", "tambor", "palco", "palmas"], ["violao", "pula", "canta", "desenho", "cor"]],
  },
  {
    nome: "Corpo e saúde",
    nomeInfantil: "Cuidando do corpo",
    adulto: [["sono", "água", "fruta", "consulta", "passos"], ["respiração", "alongamento", "energia", "saúde", "descanso"], ["vitamina", "corrida", "exame", "rotina", "equilíbrio"]],
    infantil: [["água", "fruta", "sono", "pulo", "banho"], ["escova", "suco", "correr", "sorriso", "leite"], ["maca", "brinca", "dorme", "medico", "toalha"]],
  },
  {
    nome: "Tecnologia e casa conectada",
    nomeInfantil: "Coisas que acendem",
    adulto: [["tablet", "roteador", "tela", "camera", "senha"], ["celular", "alarme", "app", "sensor", "notificacao"], ["carregador", "wifi", "controle", "luz", "assistente"]],
    infantil: [["luz", "botao", "tela", "som", "controle"], ["tablet", "jogo", "camera", "toque", "cabo"], ["celular", "foto", "senha", "desenho", "música"]],
  },
];

const functionalAdultMemorySets = [
  ["remédio", "água", "cafe", "agenda", "chave"],
  ["consulta", "documento", "oculos", "telefone", "carteira"],
  ["mercado", "lista", "leite", "fruta", "troco"],
  ["conta", "senha", "banco", "cartao", "recibo"],
  ["fogao", "panela", "alarme", "janela", "porta"],
  ["farmacia", "receita", "horario", "dose", "copo"],
  ["endereco", "ponto", "onibus", "bilhete", "rota"],
  ["exame", "pasta", "protocolo", "caneta", "data"],
  ["visita", "nome", "presente", "sala", "foto"],
  ["noticia", "jornal", "radio", "clima", "calendario"],
  ["cozinha", "geladeira", "validade", "etiqueta", "pote"],
  ["compromisso", "hora", "local", "contato", "mensagem"],
  ["pagamento", "boleto", "vencimento", "valor", "comprovante"],
  ["rotina", "caminhada", "água", "alongamento", "descanso"],
  ["emergencia", "telefone", "vizinho", "chave", "documento"],
];

function rotateItems<T>(items: T[], shift: number) {
  if (items.length === 0) return [];
  return items.map((_, index) => items[(index + shift) % items.length]);
}

function expandMemoryVariations(seed: MemorySeed, index: number) {
  const adultFunctional = functionalAdultMemorySets[index] ?? functionalAdultMemorySets[0];
  const adultTokens = Array.from(new Set([...seed.adulto.flat(), ...adultFunctional]));
  const childTokens = Array.from(new Set(seed.infantil.flat()));

  return {
    adulto: [
      ...seed.adulto,
      adultFunctional,
      rotateItems(adultTokens, index + 2).slice(0, 5),
      rotateItems(adultTokens, index + 7).slice(0, 6),
    ],
    infantil: [
      ...seed.infantil,
      rotateItems(childTokens, index + 1).slice(0, 5),
      rotateItems(childTokens, index + 4).slice(0, 5),
    ],
  };
}

export const memoryChallenges: MemoryChallenge[] = memorySeeds.map((seed, index) => ({
  id: index + 1,
  difficultyLabel: PHASE_LABELS_15[index],
  nome: seed.nome,
  nomeInfantil: seed.nomeInfantil,
  variacoes: expandMemoryVariations(seed, index).adulto,
  variacoesInfantis: expandMemoryVariations(seed, index).infantil,
  tempoMemorizacao: Math.max(5, 10 - Math.floor(index / 2)),
  minimoParaConcluir: Math.min(5, 2 + Math.floor(index / 4)),
}));

const visualSets = [
  ["🐶", "🐱", "🦊", "🐻"],
  ["🌷", "🌻", "🌹", "🌼"],
  ["🦁", "🐸", "🐼", "🦋"],
  ["🍎", "🍓", "🍊", "🍇"],
  ["🚗", "🚲", "🚀", "⛵"],
  ["🐧", "🐰", "🐨", "🦉"],
  ["🌵", "🌺", "🍀", "🌸"],
  ["⭐", "🌙", "☀️", "☁️"],
  ["🐠", "🦀", "🐙", "🐬"],
  ["🎈", "🪁", "⚽", "🧩"],
  ["🦓", "🦒", "🐯", "🦜"],
  ["🌳", "🍄", "🌲", "🪻"],
  ["🍕", "🍔", "🍩", "🍉"],
  ["🚂", "✈️", "🚜", "🚁"],
  ["🐝", "🦄", "🐢", "🦚"],
];

function buildVisualVariation(baseItems: string[], extraItems: string[]) {
  return Array.from(new Set([...baseItems, ...extraItems])).slice(0, baseItems.length + 1);
}

export const visualChallenges: VisualMemoryChallenge[] = visualSets.map((items, index) => {
  const variacoes = [
    items,
    buildVisualVariation(items.slice(1), [items[0], visualSets[(index + 1) % visualSets.length][0]]),
    buildVisualVariation(items.slice(0, 3), [visualSets[(index + 2) % visualSets.length][1], items[3]]),
    buildVisualVariation(rotateItems(items, 1), [visualSets[(index + 3) % visualSets.length][2]]),
    buildVisualVariation(rotateItems(items, 2), [visualSets[(index + 4) % visualSets.length][3]]),
  ];
  const maxCompletablePairs = Math.min(...variacoes.map((variation) => variation.length));

  return {
    id: index + 1,
    difficultyLabel: PHASE_LABELS_15[index],
    nome: `Memória visual ${index + 1}`,
    nomeInfantil:
      index < 5
        ? index % 2 === 0
          ? "Cartas de animais"
          : "Cartas ilustradas"
        : "Cartas de figuras",
    variacoes,
    revealSeconds: Math.max(4, 7 - Math.floor(index / 4)),
    tempoLimite: Math.max(18, 34 - index),
    minimoParaConcluir: Math.min(maxCompletablePairs, 2 + Math.floor(index / 3)),
  };
});

const attentionSeeds = [
  { nome: "Foco em T", nomeInfantil: "Caca ao T", alvo: "T", distratores: ["O", "Q", "D", "P", "R"] },
  { nome: "Busca por A", nomeInfantil: "Caca ao A", alvo: "A", distratores: ["M", "R", "V", "N", "X"] },
  { nome: "Número 7", nomeInfantil: "Missão do 7", alvo: "7", distratores: ["1", "4", "9", "2", "6"] },
  { nome: "Foco em B", nomeInfantil: "Caca ao B", alvo: "B", distratores: ["P", "D", "R", "E", "H"] },
  { nome: "Número 3", nomeInfantil: "Missão do 3", alvo: "3", distratores: ["8", "5", "6", "9", "2"] },
  { nome: "Foco em M", nomeInfantil: "Caca ao M", alvo: "M", distratores: ["N", "W", "H", "K", "V"] },
  { nome: "Número 5", nomeInfantil: "Missão do 5", alvo: "5", distratores: ["2", "8", "9", "6", "3"] },
  { nome: "Foco em L", nomeInfantil: "Caca ao L", alvo: "L", distratores: ["I", "T", "J", "F", "E"] },
  { nome: "Número 8", nomeInfantil: "Missão do 8", alvo: "8", distratores: ["3", "0", "6", "9", "2"] },
  { nome: "Foco em C", nomeInfantil: "Caca ao C", alvo: "C", distratores: ["G", "O", "Q", "S", "U"] },
  { nome: "Número 4", nomeInfantil: "Missão do 4", alvo: "4", distratores: ["1", "7", "9", "6", "8"] },
  { nome: "Foco em P", nomeInfantil: "Caca ao P", alvo: "P", distratores: ["R", "B", "D", "F", "K"] },
  { nome: "Número 6", nomeInfantil: "Missão do 6", alvo: "6", distratores: ["8", "9", "3", "5", "2"] },
  { nome: "Foco em S", nomeInfantil: "Caca ao S", alvo: "S", distratores: ["Z", "C", "G", "E", "A"] },
  { nome: "Número 9", nomeInfantil: "Missão do 9", alvo: "9", distratores: ["8", "6", "3", "5", "0"] },
];

function buildAttentionVariation(alvo: string, distractors: string[], offset: number) {
  const pool = [
    alvo,
    distractors[offset % distractors.length],
    alvo,
    distractors[(offset + 1) % distractors.length],
    alvo,
    distractors[(offset + 2) % distractors.length],
    distractors[(offset + 3) % distractors.length],
    alvo,
    distractors[(offset + 4) % distractors.length],
    alvo,
    distractors[(offset + 1) % distractors.length],
    alvo,
  ];

  return {
    instrucao: `Clique apenas nos símbolos ${alvo} antes do tempo acabar.`,
    instrucaoInfantil: `Toque so no ${alvo}.`,
    alvo,
    grade: pool,
    gradeInfantil: pool.slice(0, 8),
  };
}

export const attentionChallenges: AttentionChallenge[] = attentionSeeds.map((seed, index) => ({
  id: index + 1,
  difficultyLabel: PHASE_LABELS_15[index],
  nome: seed.nome,
  nomeInfantil: seed.nomeInfantil,
  variacoes: [0, 1, 2, 3, 4].map((variation) => buildAttentionVariation(seed.alvo, seed.distratores, variation + index)),
  tempoLimite: Math.max(12, 24 - index),
  minimoParaConcluir: Math.min(6, 3 + Math.floor(index / 3)),
}));

type ComparisonSeed = {
  nome: string;
  nomeInfantil: string;
  prompt: string;
  promptInfantil: string;
  pairs: Array<{ left: string; right: string; correct: "left" | "right"; explanation: string }>;
};

const comparisonSeeds: ComparisonSeed[] = [
  {
    nome: "Maior número",
    nomeInfantil: "Qual número é maior?",
    prompt: "Escolha o número maior em cada comparação.",
    promptInfantil: "Toque no número maior.",
    pairs: [
      { left: "3", right: "7", correct: "right", explanation: "7 é maior que 3." },
      { left: "9", right: "4", correct: "left", explanation: "9 é maior que 4." },
      { left: "6", right: "8", correct: "right", explanation: "8 é maior que 6." },
    ],
  },
  {
    nome: "Menor número",
    nomeInfantil: "Qual número é menor?",
    prompt: "Escolha o número menor em cada comparação.",
    promptInfantil: "Toque no número menor.",
    pairs: [
      { left: "5", right: "2", correct: "right", explanation: "2 é menor que 5." },
      { left: "1", right: "6", correct: "left", explanation: "1 é menor que 6." },
      { left: "4", right: "9", correct: "left", explanation: "4 é menor que 9." },
    ],
  },
  {
    nome: "Palavra mais comprida",
    nomeInfantil: "Qual palavra é maior?",
    prompt: "Escolha a palavra com mais letras.",
    promptInfantil: "Toque na palavra comprida.",
    pairs: [
      { left: "sol", right: "janela", correct: "right", explanation: "\"janela\" tem mais letras." },
      { left: "borboleta", right: "flor", correct: "left", explanation: "\"borboleta\" tem mais letras." },
      { left: "casa", right: "computador", correct: "right", explanation: "\"computador\" tem mais letras." },
    ],
  },
  {
    nome: "Palavra mais curta",
    nomeInfantil: "Qual palavra é menor?",
    prompt: "Escolha a palavra com menos letras.",
    promptInfantil: "Toque na palavra curtinha.",
    pairs: [
      { left: "navio", right: "pe", correct: "right", explanation: "\"pe\" tem menos letras." },
      { left: "lua", right: "planeta", correct: "left", explanation: "\"lua\" tem menos letras." },
      { left: "mesa", right: "ar", correct: "right", explanation: "\"ar\" tem menos letras." },
    ],
  },
  {
    nome: "Maior quantidade",
    nomeInfantil: "Qual grupo tem mais?",
    prompt: "Escolha o grupo com maior quantidade.",
    promptInfantil: "Toque no grupo que tem mais.",
    pairs: [
      { left: "2 bolas", right: "5 bolas", correct: "right", explanation: "5 bolas é uma quantidade maior." },
      { left: "7 estrelas", right: "3 estrelas", correct: "left", explanation: "7 estrelas é maior que 3." },
      { left: "4 cubos", right: "6 cubos", correct: "right", explanation: "6 cubos é maior que 4." },
    ],
  },
  {
    nome: "Menor quantidade",
    nomeInfantil: "Qual grupo tem menos?",
    prompt: "Escolha o grupo com menor quantidade.",
    promptInfantil: "Toque no grupo que tem menos.",
    pairs: [
      { left: "8 pontos", right: "2 pontos", correct: "right", explanation: "2 pontos é menor quantidade." },
      { left: "1 lápis", right: "4 lápis", correct: "left", explanation: "1 lápis é menor que 4." },
      { left: "3 nuvens", right: "6 nuvens", correct: "left", explanation: "3 nuvens e menos que 6." },
    ],
  },
  {
    nome: "Ordem alfabética inicial",
    nomeInfantil: "Qual vem primeiro?",
    prompt: "Escolha a palavra que vem primeiro na ordem alfabética.",
    promptInfantil: "Toque na palavra que vem primeiro no alfabeto.",
    pairs: [
      { left: "abelha", right: "tigre", correct: "left", explanation: "\"abelha\" vem antes de \"tigre\"." },
      { left: "mala", right: "bola", correct: "right", explanation: "\"bola\" vem antes de \"mala\"." },
      { left: "copo", right: "janela", correct: "left", explanation: "\"copo\" vem antes de \"janela\"." },
    ],
  },
  {
    nome: "Ordem alfabética final",
    nomeInfantil: "Qual vem depois?",
    prompt: "Escolha a palavra que vem depois na ordem alfabética.",
    promptInfantil: "Toque na palavra que vem depois no alfabeto.",
    pairs: [
      { left: "barco", right: "casa", correct: "right", explanation: "\"casa\" vem depois de \"barco\"." },
      { left: "uva", right: "nuvem", correct: "left", explanation: "\"uva\" vem depois de \"nuvem\"." },
      { left: "foca", right: "dado", correct: "left", explanation: "\"foca\" vem depois de \"dado\"." },
    ],
  },
  {
    nome: "Tempo mais longo",
    nomeInfantil: "O que demora mais?",
    prompt: "Escolha a opção que costuma demorar mais tempo.",
    promptInfantil: "Toque no que demora mais.",
    pairs: [
      { left: "1 minuto", right: "1 hora", correct: "right", explanation: "1 hora dura mais tempo." },
      { left: "2 dias", right: "6 horas", correct: "left", explanation: "2 dias dura mais que 6 horas." },
      { left: "30 segundos", right: "5 minutos", correct: "right", explanation: "5 minutos dura mais." },
    ],
  },
  {
    nome: "Tempo mais curto",
    nomeInfantil: "O que dura menos?",
    prompt: "Escolha a opção que dura menos tempo.",
    promptInfantil: "Toque no que dura menos.",
    pairs: [
      { left: "3 segundos", right: "2 minutos", correct: "left", explanation: "3 segundos dura menos." },
      { left: "1 semana", right: "1 dia", correct: "right", explanation: "1 dia dura menos." },
      { left: "4 horas", right: "20 minutos", correct: "right", explanation: "20 minutos dura menos." },
    ],
  },
  {
    nome: "Valor monetario maior",
    nomeInfantil: "Qual valor é maior?",
    prompt: "Escolha o maior valor monetario.",
    promptInfantil: "Toque no maior valor.",
    pairs: [
      { left: "R$ 12", right: "R$ 20", correct: "right", explanation: "R$ 20 é maior." },
      { left: "R$ 50", right: "R$ 18", correct: "left", explanation: "R$ 50 é maior." },
      { left: "R$ 31", right: "R$ 29", correct: "left", explanation: "R$ 31 é maior." },
    ],
  },
  {
    nome: "Valor monetario menor",
    nomeInfantil: "Qual valor é menor?",
    prompt: "Escolha o menor valor monetario.",
    promptInfantil: "Toque no menor valor.",
    pairs: [
      { left: "R$ 9", right: "R$ 15", correct: "left", explanation: "R$ 9 é menor." },
      { left: "R$ 32", right: "R$ 21", correct: "right", explanation: "R$ 21 é menor." },
      { left: "R$ 40", right: "R$ 12", correct: "right", explanation: "R$ 12 é menor." },
    ],
  },
  {
    nome: "Número par mais alto",
    nomeInfantil: "Qual par é maior?",
    prompt: "Escolha o número par mais alto.",
    promptInfantil: "Toque no número par maior.",
    pairs: [
      { left: "8", right: "14", correct: "right", explanation: "14 e par é maior." },
      { left: "20", right: "6", correct: "left", explanation: "20 e par é maior." },
      { left: "12", right: "18", correct: "right", explanation: "18 e par é maior." },
    ],
  },
  {
    nome: "Número ímpar mais baixo",
    nomeInfantil: "Qual ímpar é menor?",
    prompt: "Escolha o número ímpar mais baixo.",
    promptInfantil: "Toque no número ímpar menor.",
    pairs: [
      { left: "7", right: "3", correct: "right", explanation: "3 e ímpar é menor." },
      { left: "5", right: "9", correct: "left", explanation: "5 e ímpar é menor." },
      { left: "11", right: "13", correct: "left", explanation: "11 e ímpar é menor." },
    ],
  },
  {
    nome: "Comparação mista",
    nomeInfantil: "Comparação final",
    prompt:
      "Em cada rodada, compare as duas opções e escolha a que atende ao critério correto. Algumas comparações pedem o maior valor, outras a palavra mais longa ou a opção numericamente superior. Leia com calma e decida qual lado faz mais sentido.",
    promptInfantil:
      "Olhe as duas opções, pense no que está sendo comparado e toque no lado certo. Pode ser o maior número, a palavra maior ou o maior valor.",
    pairs: [
      { left: "15", right: "12", correct: "left", explanation: "15 é maior." },
      { left: "rio", right: "montanha", correct: "right", explanation: "\"montanha\" tem mais letras." },
      { left: "R$ 22", right: "R$ 19", correct: "left", explanation: "R$ 22 é maior." },
    ],
  },
];

function rotatePairs<T>(items: T[], shift: number) {
  return items.map((_, index) => items[(index + shift) % items.length]);
}

function buildShapeRounds(index: number): ComparisonSeed["pairs"] {
  const shapeGroups = [
    ["▲", "●", "■"],
    ["◆", "⬟", "⬢"],
    ["🔺", "🔵", "🟩"],
    ["🔶", "🟣", "🟨"],
    ["⬛", "🔷", "🟥"],
  ];
  const current = shapeGroups[index % shapeGroups.length];
  const next = shapeGroups[(index + 1) % shapeGroups.length];

  return [
    {
      left: `${index + 2} ${current[0]}`,
      right: `${index + 4} ${current[0]}`,
      correct: "right",
      explanation: `O grupo da direita tem mais figuras ${current[0]}.`,
    },
    {
      left: `${next[0]} ${next[0]} ${next[0]}`,
      right: `${next[1]} ${next[1]}`,
      correct: "left",
      explanation: `A esquerda tem mais figuras do que a direita.`,
    },
    {
      left: `${current[2]} ${current[2]}`,
      right: `${current[2]} ${current[2]} ${current[2]}`,
      correct: "right",
      explanation: `A direita mostra uma quantidade maior da mesma figura.`,
    },
  ];
}

export const comparisonChallenges: ComparisonChallenge[] = comparisonSeeds.map((seed, index) => ({
  id: index + 1,
  difficultyLabel: PHASE_LABELS_15[index],
  nome: seed.nome,
  nomeInfantil: seed.nomeInfantil,
  variacoes: [0, 1, 2, 3, 4].map((variation) => ({
    prompt: seed.prompt,
    promptInfantil: `${seed.promptInfantil} Para crianças pequenas, o app também usa figuras geométricas e conjuntos visuais.`,
    rounds: rotatePairs(seed.pairs, variation),
    roundsAte10: rotatePairs(buildShapeRounds(index), variation),
  })),
  tempoLimite: Math.max(14, 24 - Math.floor(index / 2)),
  minimoParaConcluir: Math.min(3, 2 + Math.floor(index / 7)),
}));

const spatialSeeds = [
  { nome: "Rota do explorador", nomeInfantil: "Caminho do robo", sequencias: [["cima", "direita", "direita", "baixo"], ["esquerda", "cima", "direita", "baixo"], ["cima", "cima", "esquerda", "baixo", "direita"]] },
  { nome: "Mapa mental", nomeInfantil: "Mapa dos passos", sequencias: [["direita", "cima", "cima", "esquerda", "baixo"], ["baixo", "direita", "cima", "direita", "baixo"], ["esquerda", "baixo", "baixo", "direita", "cima"]] },
  { nome: "Rotacao e destino", nomeInfantil: "Giro do foguete", sequencias: [["cima", "direita", "baixo", "direita", "cima", "esquerda"], ["direita", "direita", "cima", "esquerda", "baixo", "baixo"], ["esquerda", "cima", "direita", "direita", "baixo", "esquerda"]] },
  { nome: "Curvas curtas", nomeInfantil: "Vira e anda", sequencias: [["cima", "esquerda", "baixo", "direita"], ["direita", "baixo", "esquerda", "cima"], ["cima", "direita", "baixo", "esquerda", "cima"]] },
  { nome: "Labirinto leve", nomeInfantil: "Saindo da toca", sequencias: [["direita", "cima", "esquerda", "cima", "direita"], ["baixo", "direita", "direita", "cima", "esquerda"], ["cima", "cima", "direita", "baixo", "esquerda"]] },
  { nome: "Mudanca de rota", nomeInfantil: "Muda o caminho", sequencias: [["esquerda", "cima", "cima", "direita", "baixo"], ["direita", "baixo", "esquerda", "esquerda", "cima"], ["baixo", "baixo", "direita", "cima", "direita"]] },
  { nome: "Rota em zigue-zague", nomeInfantil: "Vai e volta", sequencias: [["cima", "direita", "cima", "direita", "baixo"], ["esquerda", "baixo", "esquerda", "cima", "direita"], ["direita", "cima", "esquerda", "baixo", "direita"]] },
  { nome: "Deslocamento longo", nomeInfantil: "Passos compridos", sequencias: [["cima", "cima", "direita", "direita", "baixo", "esquerda"], ["baixo", "direita", "direita", "cima", "esquerda", "esquerda"], ["esquerda", "cima", "direita", "cima", "baixo", "direita"]] },
  { nome: "Viradas rápidas", nomeInfantil: "Curvinhas rápidas", sequencias: [["direita", "cima", "baixo", "direita", "cima", "esquerda"], ["cima", "esquerda", "direita", "cima", "baixo", "esquerda"], ["baixo", "direita", "cima", "esquerda", "cima", "direita"]] },
  { nome: "Mapa com retorno", nomeInfantil: "Vai e volta no mapa", sequencias: [["cima", "direita", "baixo", "esquerda", "cima", "direita"], ["esquerda", "baixo", "direita", "cima", "esquerda", "baixo"], ["direita", "cima", "esquerda", "baixo", "direita", "cima"]] },
  { nome: "Caminho cruzado", nomeInfantil: "Cruza e gira", sequencias: [["direita", "cima", "esquerda", "cima", "direita", "baixo"], ["baixo", "direita", "cima", "esquerda", "baixo", "direita"], ["cima", "esquerda", "baixo", "direita", "cima", "esquerda"]] },
  { nome: "Rota de precisão", nomeInfantil: "Passos certinhos", sequencias: [["cima", "direita", "direita", "baixo", "esquerda", "cima"], ["esquerda", "cima", "direita", "baixo", "baixo", "direita"], ["baixo", "direita", "cima", "cima", "esquerda", "baixo"]] },
  { nome: "Sequência densa", nomeInfantil: "Caminho comprido", sequencias: [["cima", "cima", "direita", "baixo", "direita", "cima", "esquerda"], ["esquerda", "baixo", "direita", "cima", "direita", "baixo", "esquerda"], ["direita", "cima", "esquerda", "cima", "baixo", "direita", "baixo"]] },
  { nome: "Desafio de orientação", nomeInfantil: "Desafio do mapa", sequencias: [["cima", "direita", "baixo", "direita", "cima", "esquerda", "baixo"], ["baixo", "esquerda", "cima", "direita", "cima", "direita", "baixo"], ["direita", "direita", "cima", "esquerda", "baixo", "esquerda", "cima"]] },
  { nome: "Mestre das rotas", nomeInfantil: "Rota final", sequencias: [["cima", "direita", "cima", "esquerda", "baixo", "direita", "direita", "baixo"], ["esquerda", "cima", "direita", "cima", "baixo", "esquerda", "direita", "baixo"], ["baixo", "direita", "cima", "esquerda", "cima", "direita", "baixo", "esquerda"]] },
];

export const spatialChallenges: SpatialChallenge[] = spatialSeeds.map((seed, index) => ({
  id: index + 1,
  difficultyLabel: PHASE_LABELS_15[index],
  nome: seed.nome,
  nomeInfantil: seed.nomeInfantil,
  variacoes: [
    ...seed.sequencias,
    rotateItems(seed.sequencias[0], 1),
    rotateItems(seed.sequencias[1], 2),
  ].map((sequence, variationIndex) => ({
    prompt: "Observe a rota e reconstrua os movimentos na mesma ordem.",
    promptInfantil: "Veja o caminho e repita os movimentos certinhos.",
    sequence,
    revealSeconds: 6 + Math.floor((index + variationIndex) / 5),
    options: ["cima", "baixo", "esquerda", "direita"],
  })),
  minimoParaConcluir: Math.min(7, 3 + Math.floor(index / 3)),
  tempoResposta: Math.max(12, 20 - Math.floor(index / 2)),
}));

type ExclusiveSeed = {
  nome: string;
  descricao: string;
  sequencias: string[][];
};

const exclusiveInfantil: ExclusiveSeed[] = [
  { nome: "Brincadeira 1", descricao: "Repita sequencias simples com objetos conhecidos.", sequencias: [["bola", "gato", "sol"], ["dado", "pipa", "robo"], ["urso", "barco", "luz"]] },
  { nome: "Brincadeira 2", descricao: "Memorize pequenas filas de itens concretos.", sequencias: [["copo", "flor", "meia"], ["tinta", "giz", "pato"], ["leite", "pipa", "bolo"]] },
  { nome: "Brincadeira 3", descricao: "Agora a ordem cresce um pouco mais.", sequencias: [["bola", "pato", "sol", "casa"], ["gato", "pipa", "suco", "meia"], ["robo", "flor", "giz", "copo"]] },
  { nome: "Brincadeira 4", descricao: "Continue reforcando a ordem correta.", sequencias: [["urso", "bola", "leite", "tinta"], ["casa", "gato", "flor", "pipa"], ["dado", "sol", "giz", "barco"]] },
  { nome: "Brincadeira 5", descricao: "Mais itens, mesma lógica de sequência.", sequencias: [["bola", "gato", "sol", "meia", "pipa"], ["copo", "urso", "luz", "casa", "flor"], ["dado", "pato", "giz", "bolo", "robo"]] },
  { nome: "Brincadeira 6", descricao: "Aumente o foco e mantenha a ordem.", sequencias: [["flor", "copo", "bola", "tinta", "gato"], ["suco", "pipa", "sol", "giz", "meia"], ["casa", "robo", "pato", "luz", "dado"]] },
  { nome: "Brincadeira 7", descricao: "Treino mais longo para consolidar memória de ordem.", sequencias: [["bola", "gato", "sol", "casa", "pipa"], ["urso", "flor", "giz", "meia", "copo"], ["robo", "pato", "luz", "bolo", "dado"]] },
  { nome: "Brincadeira 8", descricao: "Sequencias mais exigentes para a crianca.", sequencias: [["casa", "sol", "pipa", "gato", "meia"], ["copo", "flor", "bola", "giz", "urso"], ["robo", "dado", "luz", "pato", "bolo"]] },
  { nome: "Brincadeira 9", descricao: "Fase avançada infantil.", sequencias: [["bola", "casa", "flor", "pipa", "sol"], ["gato", "meia", "urso", "copo", "giz"], ["robo", "luz", "pato", "bolo", "dado"]] },
  { nome: "Brincadeira 10", descricao: "Fase final infantil com sequencias consolidadas.", sequencias: [["bola", "gato", "sol", "pipa", "casa", "meia"], ["urso", "flor", "copo", "giz", "dado", "luz"], ["robo", "pato", "bolo", "leite", "tinta", "barco"]] },
];

const exclusiveAdolescente: ExclusiveSeed[] = [
  { nome: "Código 1", descricao: "Sequencias curtas de códigos e símbolos.", sequencias: [["A7", "K2", "M9", "R4"], ["T5", "B1", "N6", "Z3"], ["C8", "P4", "D7", "S1"]] },
  { nome: "Código 2", descricao: "Mais ritmo e controle de ordem.", sequencias: [["L3", "Q8", "H2", "V5"], ["R6", "M1", "T9", "B4"], ["N7", "D2", "K5", "P8"]] },
  { nome: "Código 3", descricao: "Agora com maior interferência visual.", sequencias: [["X4", "C7", "A2", "J9", "L1"], ["B8", "M3", "R5", "T2", "Q6"], ["P4", "D9", "N1", "S7", "K3"]] },
  { nome: "Código 4", descricao: "Sequencias de cinco itens.", sequencias: [["A1", "B2", "C3", "D4", "E5"], ["K9", "L8", "M7", "N6", "O5"], ["T1", "R2", "Q3", "P4", "M5"]] },
  { nome: "Código 5", descricao: "Trocas rápidas entre letras e números.", sequencias: [["AX3", "B7", "CZ1", "D4", "E9"], ["F2", "GX8", "H1", "JT6", "K3"], ["L9", "M5", "N2", "P8", "Q1"]] },
  { nome: "Código 6", descricao: "Fase intermediária alta.", sequencias: [["V4", "T8", "R2", "P6", "M1"], ["C5", "D1", "F9", "H4", "J7"], ["K2", "L6", "N8", "Q3", "S5"]] },
  { nome: "Código 7", descricao: "Maior densidade e menos margem de erro.", sequencias: [["A7", "C4", "E1", "G8", "J5", "L2"], ["M9", "P6", "R3", "T1", "V8", "X4"], ["B2", "D5", "F7", "H9", "K1", "N3"]] },
  { nome: "Código 8", descricao: "Ordem longa com mais distratores.", sequencias: [["Q1", "W4", "E7", "R2", "T9", "Y3"], ["U5", "I8", "O1", "P6", "A3", "S7"], ["D2", "F9", "G4", "H1", "J8", "K5"]] },
  { nome: "Código 9", descricao: "Fase avançada adolescente.", sequencias: [["ZX1", "CV4", "BN7", "MQ2", "LP9", "KT3"], ["AX5", "SD8", "FG1", "HJ6", "KL3", "QP7"], ["TR2", "YU9", "IO4", "PA1", "LM8", "NC5"]] },
  { nome: "Código 10", descricao: "Fase final adolescente.", sequencias: [["A7", "K2", "M9", "R4", "T5", "B1", "N6"], ["C8", "P4", "D7", "S1", "V6", "W2", "F9"], ["L3", "Q8", "H2", "V5", "R6", "M1", "T9"]] },
];

const exclusiveAdulto: ExclusiveSeed[] = [
  { nome: "Memória funcional 1", descricao: "Sequencias de rotina diaria para adultos e idosos.", sequencias: [["remédio", "água", "cafe", "chave", "agenda"], ["oculos", "telefone", "carteira", "porta", "luz"], ["lista", "mercado", "leite", "fruta", "troco"]] },
  { nome: "Memória funcional 2", descricao: "Compromissos, horarios e pequenos recados.", sequencias: [["consulta", "documento", "horario", "endereco", "telefone"], ["banco", "senha", "cartao", "recibo", "pasta"], ["visita", "nome", "sala", "presente", "foto"]] },
  { nome: "Memória funcional 3", descricao: "Rotinas de casa com ordem e seguranca.", sequencias: [["fogao", "panela", "alarme", "janela", "porta", "chave"], ["geladeira", "validade", "pote", "etiqueta", "lista", "lixeira"], ["lampada", "controle", "cadeira", "copo", "remédio", "água"]] },
  { nome: "Memória funcional 4", descricao: "Sequencias de farmacia, dose e horario.", sequencias: [["farmacia", "receita", "remédio", "dose", "água", "horario"], ["caixa", "rotulo", "manha", "almoco", "noite", "agenda"], ["telefone", "medico", "exame", "pasta", "data", "retorno"]] },
  { nome: "Memória funcional 5", descricao: "Planejamento de saidas e deslocamentos.", sequencias: [["endereco", "ponto", "onibus", "bilhete", "rota", "telefone", "chave"], ["taxi", "carteira", "documento", "consulta", "recepcao", "senha", "retorno"], ["mercado", "lista", "sacola", "cartao", "nota", "troco", "porta"]] },
  { nome: "Memória funcional 6", descricao: "Organização financeira simples.", sequencias: [["boleto", "valor", "vencimento", "banco", "senha", "recibo", "pasta"], ["cartao", "compra", "nota", "troco", "limite", "data", "arquivo"], ["conta", "água", "luz", "telefone", "pagamento", "comprovante", "agenda"]] },
  { nome: "Memória funcional 7", descricao: "Listas maiores com interferência cotidiana.", sequencias: [["remédio", "água", "cafe", "jornal", "telefone", "chave", "mercado", "lista"], ["consulta", "oculos", "documento", "pasta", "rota", "recepcao", "senha", "retorno"], ["fogao", "janela", "porta", "luz", "alarme", "carteira", "celular", "agenda"]] },
  { nome: "Memória funcional 8", descricao: "Sequencias longas para memória de trabalho.", sequencias: [["exame", "data", "horario", "endereco", "documento", "pasta", "telefone", "retorno"], ["mercado", "lista", "arroz", "leite", "fruta", "cartao", "nota", "troco"], ["remédio", "dose", "manha", "água", "almoco", "noite", "agenda", "alarme"]] },
  { nome: "Memória funcional 9", descricao: "Alta exigencia com tarefas encadeadas.", sequencias: [["agenda", "consulta", "documento", "exame", "recepcao", "senha", "medico", "retorno", "telefone"], ["cozinha", "fogao", "panela", "alarme", "geladeira", "validade", "pote", "lixeira", "porta"], ["banco", "boleto", "valor", "senha", "pagamento", "recibo", "pasta", "data", "arquivo"]] },
  { nome: "Memória funcional 10", descricao: "Fase final com memória funcional e planejamento.", sequencias: [["emergencia", "telefone", "vizinho", "documento", "chave", "endereco", "remédio", "água", "porta"], ["compromisso", "hora", "local", "contato", "mensagem", "carteira", "rota", "retorno", "agenda"], ["rotina", "caminhada", "água", "alongamento", "descanso", "remédio", "jornal", "telefone", "luz"]] },
];

function createExclusiveChallenges(audience: "infantil" | "adolescente" | "adulto", baseId: number, seeds: ExclusiveSeed[]) {
  return seeds.map((seed, index) => {
    const sequences = [
      ...seed.sequencias,
      rotateItems(seed.sequencias[0], 1),
      rotateItems(seed.sequencias[1], 2),
    ];
    const maxCompletableItems = Math.min(...sequences.map((sequence) => sequence.length));

    return {
      id: baseId + index,
      audience,
      difficultyLabel: PHASE_LABELS_10[index],
      nome: seed.nome,
      descricao: seed.descricao,
      minimoParaConcluir: Math.min(maxCompletableItems, 2 + Math.floor(index / 2)),
      variacoes: sequences.map((sequence) => ({
        prompt: "Memorize a sequência e monte novamente na mesma ordem.",
        sequence,
        revealSeconds: Math.max(4, 8 - Math.floor(index / 4)),
        options: Array.from(new Set([...sequence, ...sequence.slice(0, Math.min(sequence.length, 3))])).slice(0, sequence.length + 2),
      })),
    };
  });
}

export const exclusiveChallenges: ExclusiveChallenge[] = [
  ...createExclusiveChallenges("infantil", 101, exclusiveInfantil),
  ...createExclusiveChallenges("adolescente", 201, exclusiveAdolescente),
  ...createExclusiveChallenges("adulto", 301, exclusiveAdulto),
];

const logicSeeds = [
  {
    nome: "Sequência crescente",
    nomeInfantil: "Qual vem depois?",
    rounds: [
      { prompt: "Descubra o próximo número.", sequence: ["1", "2", "3"], options: ["4", "5", "2"], correctAnswer: "4", explanation: "A sequência cresce de 1 em 1." },
      { prompt: "Continue a sequência.", sequence: ["4", "5", "6"], options: ["8", "7", "5"], correctAnswer: "7", explanation: "A sequência continua crescendo de 1 em 1." },
      { prompt: "Escolha o próximo termo.", sequence: ["7", "8", "9"], options: ["10", "11", "8"], correctAnswer: "10", explanation: "O padrão e somar 1." },
    ],
  },
  {
    nome: "Sequência alternada",
    nomeInfantil: "Troca de símbolos",
    rounds: [
      { prompt: "Observe a alternancia.", sequence: ["A", "B", "A", "B"], options: ["A", "C", "B"], correctAnswer: "A", explanation: "A e B se alternam." },
      { prompt: "Observe a alternancia.", sequence: ["sol", "lua", "sol", "lua"], options: ["estrela", "sol", "lua"], correctAnswer: "sol", explanation: "Sol e lua se alternam." },
      { prompt: "Observe a alternancia.", sequence: ["1", "3", "1", "3"], options: ["5", "1", "3"], correctAnswer: "1", explanation: "1 e 3 se alternam." },
    ],
  },
  {
    nome: "Soma simples",
    nomeInfantil: "Pulos de dois",
    rounds: [
      { prompt: "Descubra o padrão.", sequence: ["2", "4", "6"], options: ["7", "8", "10"], correctAnswer: "8", explanation: "A sequência cresce de 2 em 2." },
      { prompt: "Descubra o padrão.", sequence: ["5", "7", "9"], options: ["10", "11", "12"], correctAnswer: "11", explanation: "A sequência cresce de 2 em 2." },
      { prompt: "Descubra o padrão.", sequence: ["10", "12", "14"], options: ["15", "16", "18"], correctAnswer: "16", explanation: "A sequência cresce de 2 em 2." },
    ],
  },
  {
    nome: "Letras em ordem",
    nomeInfantil: "Alfabeto em fila",
    rounds: [
      { prompt: "Qual letra vem depois?", sequence: ["A", "B", "C"], options: ["D", "E", "B"], correctAnswer: "D", explanation: "A ordem segue o alfabeto." },
      { prompt: "Qual letra vem depois?", sequence: ["M", "N", "O"], options: ["P", "Q", "L"], correctAnswer: "P", explanation: "A ordem segue o alfabeto." },
      { prompt: "Qual letra vem depois?", sequence: ["X", "Y"], options: ["Z", "W", "A"], correctAnswer: "Z", explanation: "A ordem segue o alfabeto." },
    ],
  },
  {
    nome: "Padrão de tamanho",
    nomeInfantil: "Grande e pequeno",
    rounds: [
      { prompt: "Continue o padrão.", sequence: ["grande", "pequeno", "grande"], options: ["grande", "médio", "pequeno"], correctAnswer: "pequeno", explanation: "Grande e pequeno se alternam." },
      { prompt: "Continue o padrão.", sequence: ["alto", "baixo", "alto"], options: ["baixo", "alto", "médio"], correctAnswer: "baixo", explanation: "Alto e baixo se alternam." },
      { prompt: "Continue o padrão.", sequence: ["longo", "curto", "longo"], options: ["longo", "curto", "médio"], correctAnswer: "curto", explanation: "Longo e curto se alternam." },
    ],
  },
  {
    nome: "Sequência por 3",
    nomeInfantil: "Pulos de três",
    rounds: [
      { prompt: "Descubra o próximo valor.", sequence: ["3", "6", "9"], options: ["10", "12", "15"], correctAnswer: "12", explanation: "A sequência cresce de 3 em 3." },
      { prompt: "Descubra o próximo valor.", sequence: ["12", "15", "18"], options: ["19", "21", "24"], correctAnswer: "21", explanation: "A sequência cresce de 3 em 3." },
      { prompt: "Descubra o próximo valor.", sequence: ["21", "24", "27"], options: ["28", "30", "33"], correctAnswer: "30", explanation: "A sequência cresce de 3 em 3." },
    ],
  },
  {
    nome: "Padrão misto 1",
    nomeInfantil: "Mistura de padrões",
    rounds: [
      { prompt: "Encontre o padrão.", sequence: ["2", "4", "2", "4"], options: ["2", "6", "4"], correctAnswer: "2", explanation: "Os valores 2 e 4 se alternam." },
      { prompt: "Encontre o padrão.", sequence: ["A", "C", "A", "C"], options: ["C", "A", "B"], correctAnswer: "A", explanation: "A e C se alternam." },
      { prompt: "Encontre o padrão.", sequence: ["1", "2", "4"], options: ["6", "8", "5"], correctAnswer: "8", explanation: "A sequência dobra: 1, 2, 4, 8." },
    ],
  },
  {
    nome: "Padrão misto 2",
    nomeInfantil: "Descubra a regra",
    rounds: [
      { prompt: "Descubra a regra.", sequence: ["5", "10", "15"], options: ["18", "20", "25"], correctAnswer: "20", explanation: "A sequência cresce de 5 em 5." },
      { prompt: "Descubra a regra.", sequence: ["B", "D", "F"], options: ["G", "H", "I"], correctAnswer: "H", explanation: "A sequência pula uma letra do alfabeto." },
      { prompt: "Descubra a regra.", sequence: ["2", "4", "8"], options: ["10", "12", "16"], correctAnswer: "16", explanation: "A sequência dobra a cada passo." },
    ],
  },
  {
    nome: "Padrão com símbolos",
    nomeInfantil: "Qual vem agora?",
    rounds: [
      { prompt: "Observe a sequência.", sequence: ["@", "#", "@", "#"], options: ["@", "$", "#"], correctAnswer: "@", explanation: "Os símbolos se alternam." },
      { prompt: "Observe a sequência.", sequence: ["▲", "■", "▲", "■"], options: ["■", "▲", "●"], correctAnswer: "▲", explanation: "Triangulo e quadrado se alternam." },
      { prompt: "Observe a sequência.", sequence: ["1", "4", "7"], options: ["8", "10", "11"], correctAnswer: "10", explanation: "A sequência cresce de 3 em 3." },
    ],
  },
  {
    nome: "Análise rápida",
    nomeInfantil: "Raciocínio final",
    rounds: [
      { prompt: "Encontre o próximo termo.", sequence: ["10", "9", "8"], options: ["7", "6", "9"], correctAnswer: "7", explanation: "A sequência diminui de 1 em 1." },
      { prompt: "Encontre o próximo termo.", sequence: ["A1", "A2", "A3"], options: ["A4", "B4", "A5"], correctAnswer: "A4", explanation: "Mantem a letra A e aumenta o número em 1." },
      { prompt: "Encontre o próximo termo.", sequence: ["3", "6", "12"], options: ["18", "24", "20"], correctAnswer: "24", explanation: "A sequência dobra: 3, 6, 12, 24." },
    ],
  },
  {
    nome: "Matriz simples",
    nomeInfantil: "Pensar e escolher",
    rounds: [
      { prompt: "Qual é o próximo?", sequence: ["1", "1", "2", "3"], options: ["4", "5", "6"], correctAnswer: "5", explanation: "Cada termo soma os dois anteriores: 1, 1, 2, 3, 5." },
      { prompt: "Qual é o próximo?", sequence: ["2", "3", "5", "8"], options: ["11", "13", "15"], correctAnswer: "13", explanation: "Cada termo soma os dois anteriores." },
      { prompt: "Qual é o próximo?", sequence: ["1", "2", "4", "8"], options: ["10", "12", "16"], correctAnswer: "16", explanation: "A sequência dobra a cada passo." },
    ],
  },
  {
    nome: "Raciocínio crescente",
    nomeInfantil: "Passos de lógica",
    rounds: [
      { prompt: "Complete a sequência.", sequence: ["4", "8", "12"], options: ["14", "16", "18"], correctAnswer: "16", explanation: "A sequência cresce de 4 em 4." },
      { prompt: "Complete a sequência.", sequence: ["C", "F", "I"], options: ["K", "L", "M"], correctAnswer: "L", explanation: "Pula duas letras a cada passo." },
      { prompt: "Complete a sequência.", sequence: ["1", "4", "9"], options: ["12", "16", "18"], correctAnswer: "16", explanation: "Quadrados perfeitos: 1, 4, 9, 16." },
    ],
  },
  {
    nome: "Lógica avançada 1",
    nomeInfantil: "Desafio esperto",
    rounds: [
      { prompt: "Descubra a regra.", sequence: ["2", "5", "10"], options: ["12", "17", "20"], correctAnswer: "17", explanation: "As somas aumentam: +3, +5, +7." },
      { prompt: "Descubra a regra.", sequence: ["Z", "X", "V"], options: ["T", "U", "S"], correctAnswer: "T", explanation: "Volta duas letras no alfabeto." },
      { prompt: "Descubra a regra.", sequence: ["3", "9", "27"], options: ["54", "81", "72"], correctAnswer: "81", explanation: "Multiplica por 3 a cada passo." },
    ],
  },
  {
    nome: "Lógica avançada 2",
    nomeInfantil: "Desafio mestre",
    rounds: [
      { prompt: "Descubra a regra.", sequence: ["1", "3", "6", "10"], options: ["12", "14", "15"], correctAnswer: "15", explanation: "Soma progressiva: +2, +3, +4, depois +5." },
      { prompt: "Descubra a regra.", sequence: ["B1", "D2", "F3"], options: ["G4", "H4", "H5"], correctAnswer: "H4", explanation: "A letra pula uma casa e o número cresce de 1 em 1." },
      { prompt: "Descubra a regra.", sequence: ["32", "16", "8"], options: ["2", "4", "6"], correctAnswer: "4", explanation: "A sequência divide por 2." },
    ],
  },
  {
    nome: "Mestre da lógica",
    nomeInfantil: "Fase final",
    rounds: [
      { prompt: "Descubra o próximo termo.", sequence: ["2", "6", "12", "20"], options: ["26", "30", "32"], correctAnswer: "30", explanation: "As diferencas sao +4, +6, +8, depois +10." },
      { prompt: "Descubra o próximo termo.", sequence: ["A", "D", "G", "J"], options: ["L", "M", "N"], correctAnswer: "M", explanation: "A sequência avanca 3 letras por vez." },
      { prompt: "Descubra o próximo termo.", sequence: ["1", "2", "6", "24"], options: ["96", "120", "48"], correctAnswer: "120", explanation: "Cada termo multiplica pelo próximo número: x2, x3, x4, x5." },
    ],
  },
];

export const logicChallenges: LogicChallenge[] = logicSeeds.map((seed, index) => ({
  id: index + 1,
  difficultyLabel: PHASE_LABELS_15[index],
  nome: seed.nome,
  nomeInfantil: seed.nomeInfantil,
  variacoes: [0, 1, 2, 3, 4].map((variation) => ({
    prompt: "Observe a regra da sequência e escolha o próximo termo correto.",
    promptInfantil: "Veja a sequência e toque no item que vem depois.",
    rounds: seed.rounds.map((round, roundIndex) => {
      const rotatedOptions = [...round.options];
      const shift = (variation + roundIndex) % rotatedOptions.length;
      return {
        ...round,
        options: rotatedOptions.map((_, optionIndex) => rotatedOptions[(optionIndex + shift) % rotatedOptions.length]),
      };
    }),
  })),
  tempoLimite: Math.max(14, 24 - Math.floor(index / 2)),
  minimoParaConcluir: Math.min(3, 2 + Math.floor(index / 6)),
}));

export const processChallenges: ProcessChallenge[] = [
  {
    id: 1,
    difficultyLabel: "Primeiro ciclo",
    nome: "Começar pequeno",
    descricao: "Treina a passagem completa por começo, meio e fim com uma tarefa simples.",
    tempoLimite: 90,
    minimoParaConcluir: 3,
    variacoes: [
      {
        title: "Organizar a mesa",
        context: "A jogada só termina quando você escolhe a abertura, executa a ação central e fecha o ciclo.",
        steps: [
          {
            stage: "começo",
            prompt: "Qual é o primeiro passo organizado?",
            options: ["Escolher um único canto da mesa", "Pensar em tudo que falta fazer", "Abrir outra atividade"],
            correctAnswer: "Escolher um único canto da mesa",
            feedback: "Começar pequeno reduz a barreira de entrada.",
          },
          {
            stage: "meio",
            prompt: "O que mantém o processo andando?",
            options: ["Separar apenas três itens", "Trocar de tarefa quando ficar chato", "Esperar vontade aparecer"],
            correctAnswer: "Separar apenas três itens",
            feedback: "O meio precisa de uma ação concreta, não de motivação perfeita.",
          },
          {
            stage: "fim",
            prompt: "Como fechar a jogada?",
            options: ["Guardar o último item e confirmar que terminou", "Deixar para revisar depois", "Começar outra coisa imediatamente"],
            correctAnswer: "Guardar o último item e confirmar que terminou",
            feedback: "Fechar torna o ciclo visível para o cérebro.",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    difficultyLabel: "Sequência curta",
    nome: "Tarefa com bordas",
    descricao: "Ajuda o aluno a reconhecer o limite da tarefa antes de agir.",
    tempoLimite: 100,
    minimoParaConcluir: 3,
    variacoes: [
      {
        title: "Responder uma mensagem",
        context: "Complete a sequência mínima sem pular o encerramento.",
        steps: [
          {
            stage: "começo",
            prompt: "Qual abertura evita procrastinação?",
            options: ["Ler a mensagem e definir uma resposta curta", "Reler várias vezes sem decidir", "Esperar estar com mais energia"],
            correctAnswer: "Ler a mensagem e definir uma resposta curta",
            feedback: "Uma resposta pequena já cria movimento.",
          },
          {
            stage: "meio",
            prompt: "Qual ação pertence ao meio?",
            options: ["Escrever a resposta em uma frase", "Abrir outra conversa", "Pesquisar algo sem necessidade"],
            correctAnswer: "Escrever a resposta em uma frase",
            feedback: "O meio é a parte em que a ação acontece.",
          },
          {
            stage: "fim",
            prompt: "Qual fechamento conclui o ciclo?",
            options: ["Enviar e sair da conversa", "Deixar em rascunho sem decidir", "Começar a editar sem fim"],
            correctAnswer: "Enviar e sair da conversa",
            feedback: "Finalizar diminui pendências mentais.",
          },
        ],
      },
    ],
  },
  {
    id: 3,
    difficultyLabel: "Processo sustentado",
    nome: "Do plano ao fechamento",
    descricao: "Treina continuar quando a tarefa já começou, mas ainda não terminou.",
    tempoLimite: 110,
    minimoParaConcluir: 4,
    variacoes: [
      {
        title: "Estudar por alguns minutos",
        context: "A sequência tem quatro etapas para reforçar começo, execução e encerramento consciente.",
        steps: [
          {
            stage: "começo",
            prompt: "Como preparar a entrada?",
            options: ["Escolher uma página ou exercício", "Separar cinco assuntos diferentes", "Esperar ter muito tempo"],
            correctAnswer: "Escolher uma página ou exercício",
            feedback: "Entrada clara evita excesso de escolha.",
          },
          {
            stage: "meio",
            prompt: "Qual é a primeira ação de execução?",
            options: ["Ler o enunciado até entender a tarefa", "Pular para outra matéria", "Conferir notificações"],
            correctAnswer: "Ler o enunciado até entender a tarefa",
            feedback: "Entender a tarefa sustenta o meio.",
          },
          {
            stage: "meio",
            prompt: "O que fazer quando dá vontade de parar?",
            options: ["Concluir a etapa atual antes de decidir", "Fechar tudo imediatamente", "Começar uma nova tarefa"],
            correctAnswer: "Concluir a etapa atual antes de decidir",
            feedback: "A regra é terminar a menor unidade aberta.",
          },
          {
            stage: "fim",
            prompt: "Qual gesto marca o fim?",
            options: ["Anotar o que foi concluído", "Deixar a aba aberta para depois", "Apagar o progresso"],
            correctAnswer: "Anotar o que foi concluído",
            feedback: "Registrar o fim ajuda a perceber avanço real.",
          },
        ],
      },
    ],
  },
  {
    id: 4,
    difficultyLabel: "Resistência à fuga",
    nome: "Não abandonar no meio",
    descricao: "Reforça a regra de terminar a menor sequência antes de trocar de atividade.",
    tempoLimite: 120,
    minimoParaConcluir: 4,
    variacoes: [
      {
        title: "Arrumar a mochila",
        context: "A jogada fica aberta até o ciclo mínimo ser concluído.",
        steps: [
          {
            stage: "começo",
            prompt: "Qual começo é mais objetivo?",
            options: ["Separar os itens necessários", "Pensar em todas as tarefas da semana", "Abrir outro aplicativo"],
            correctAnswer: "Separar os itens necessários",
            feedback: "Começar é escolher o recorte certo.",
          },
          {
            stage: "meio",
            prompt: "Qual ação mantém a ordem?",
            options: ["Colocar os itens por categoria", "Jogar tudo sem conferir", "Parar no primeiro incômodo"],
            correctAnswer: "Colocar os itens por categoria",
            feedback: "Categoria cria meio organizado.",
          },
          {
            stage: "meio",
            prompt: "Se faltar um item, qual é a melhor resposta?",
            options: ["Marcar o item faltante e continuar", "Abandonar a mochila aberta", "Trocar para outra tarefa"],
            correctAnswer: "Marcar o item faltante e continuar",
            feedback: "Obstáculo não precisa encerrar o processo.",
          },
          {
            stage: "fim",
            prompt: "Qual fechamento é completo?",
            options: ["Fechar a mochila e revisar a lista", "Deixar aberta para lembrar depois", "Começar uma nova organização"],
            correctAnswer: "Fechar a mochila e revisar a lista",
            feedback: "Fechar e revisar dá borda ao processo.",
          },
        ],
      },
    ],
  },
  {
    id: 5,
    difficultyLabel: "Ciclo completo",
    nome: "Terminar com intenção",
    descricao: "Treina processo com mais etapas e fechamento reflexivo.",
    tempoLimite: 130,
    minimoParaConcluir: 5,
    variacoes: [
      {
        title: "Resolver uma pendência curta",
        context: "O objetivo não é fazer tudo, é completar uma sequência mínima com começo, meio e fim.",
        steps: [
          {
            stage: "começo",
            prompt: "Qual escolha abre melhor o ciclo?",
            options: ["Definir a menor pendência possível", "Escolher a tarefa mais assustadora", "Esperar a pressão aumentar"],
            correctAnswer: "Definir a menor pendência possível",
            feedback: "A menor pendência possível reduz adiamento.",
          },
          {
            stage: "começo",
            prompt: "Antes de agir, o que ajuda?",
            options: ["Nomear o resultado esperado", "Abrir várias opções", "Fazer outra pausa sem objetivo"],
            correctAnswer: "Nomear o resultado esperado",
            feedback: "Resultado esperado dá direção.",
          },
          {
            stage: "meio",
            prompt: "Qual ação pertence ao centro do processo?",
            options: ["Executar uma parte concreta", "Replanejar indefinidamente", "Comparar com outras pessoas"],
            correctAnswer: "Executar uma parte concreta",
            feedback: "Processo precisa de ação observável.",
          },
          {
            stage: "meio",
            prompt: "Como lidar com a vontade de trocar de tarefa?",
            options: ["Ficar até concluir a etapa atual", "Abrir uma tarefa mais fácil", "Parar sem registrar nada"],
            correctAnswer: "Ficar até concluir a etapa atual",
            feedback: "Essa é a musculatura contra a procrastinação.",
          },
          {
            stage: "fim",
            prompt: "Qual fechamento mostra que acabou?",
            options: ["Confirmar o que foi terminado e limpar o espaço", "Deixar quase pronto", "Guardar sem olhar"],
            correctAnswer: "Confirmar o que foi terminado e limpar o espaço",
            feedback: "Finalizar com intenção transforma esforço em conclusão.",
          },
        ],
      },
    ],
  },
];

const focusVisionSeeds = [
  { alvo: "A", distratores: ["Â", "Ã", "R", "V", "N", "M"] },
  { alvo: "E", distratores: ["F", "Ê", "B", "P", "R", "L"] },
  { alvo: "O", distratores: ["Q", "C", "D", "0", "G", "U"] },
  { alvo: "T", distratores: ["I", "L", "F", "Y", "J", "H"] },
  { alvo: "S", distratores: ["Z", "C", "G", "5", "E", "A"] },
  { alvo: "P", distratores: ["B", "R", "D", "F", "K", "Q"] },
  { alvo: "7", distratores: ["1", "4", "9", "2", "Z", "T"] },
  { alvo: "3", distratores: ["8", "5", "6", "9", "B", "E"] },
  { alvo: "6", distratores: ["8", "9", "G", "5", "3", "0"] },
  { alvo: "M", distratores: ["N", "W", "H", "K", "V", "A"] },
];

function rotateDistractors(items: string[], shift: number) {
  return rotateItems(items, shift);
}

function createFocusVisionChallenges(): FocusVisionChallenge[] {
  return Array.from({ length: 30 }, (_, index) => {
    const levelIndex = Math.floor(index / 10);
    const seed = focusVisionSeeds[index % focusVisionSeeds.length];
    const difficultyLabel = levelIndex === 0 ? "Fácil" : levelIndex === 1 ? "Médio" : "Complexo avançado";
    const unlockGroup = levelIndex === 0 ? "iniciante" : levelIndex === 1 ? "intermediario" : "avancado";
    const gridSize = levelIndex === 0 ? 7 : levelIndex === 1 ? 9 : 11;
    const targetCount = levelIndex === 0 ? 5 + (index % 3) : levelIndex === 1 ? 7 + (index % 4) : 9 + (index % 5);
    const tempoLimite = levelIndex === 0 ? 36 - (index % 4) : levelIndex === 1 ? 34 - (index % 5) : 32 - (index % 6);
    const minimoParaConcluir = Math.max(3, Math.ceil(targetCount * 0.7));

    return {
      id: index + 1,
      difficultyLabel,
      unlockGroup,
      nome: `Ache o alvo sem perder o centro ${index + 1}`,
      descricao:
        levelIndex === 0
          ? "Mantenha o ponto central como referência e encontre letras alvo ao redor."
          : levelIndex === 1
            ? "Varra o cenário em volta do centro, sem fixar longamente em cada ponto."
            : "Combine foco central estável com varredura periférica em uma grade densa.",
      tempoLimite,
      minimoParaConcluir,
      variacoes: [0, 1, 2].map((variation) => ({
        instrucao: "Mantenha o olhar voltado ao ponto central e procure o alvo na periferia visual.",
        alvo: seed.alvo,
        distratores: rotateDistractors(seed.distratores, variation + levelIndex),
        gridSize,
        targetCount,
      })),
    };
  });
}

export const focusVisionChallenges: FocusVisionChallenge[] = createFocusVisionChallenges();
