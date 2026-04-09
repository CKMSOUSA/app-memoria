import type {
  AttentionChallenge,
  ComparisonChallenge,
  ExclusiveChallenge,
  MemoryChallenge,
  SpatialChallenge,
} from "@/lib/types";

const PHASE_LABELS_15 = [
  "Muito facil",
  "Facil",
  "Menos facil",
  "Intermediaria",
  "Intermediaria plus",
  "Desafiadora",
  "Desafiadora plus",
  "Avancada 1",
  "Avancada 2",
  "Avancada 3",
  "Especialista 1",
  "Especialista 2",
  "Especialista 3",
  "Mestre 1",
  "Mestre 2",
];

const PHASE_LABELS_10 = [
  "Muito facil",
  "Facil",
  "Menos facil",
  "Intermediaria",
  "Intermediaria plus",
  "Desafiadora",
  "Desafiadora plus",
  "Avancada",
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
    adulto: [["gato", "arvore", "rio", "porta", "lapis"], ["flor", "caderno", "pedra", "ponte", "borracha"], ["folha", "caneta", "chuva", "trilha", "mochila"]],
    infantil: [["gato", "flor", "rio", "cola", "lapis"], ["pato", "nuvem", "livro", "tinta", "folha"], ["abelha", "sol", "caderno", "chuva", "borracha"]],
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
    adulto: [["lua", "estrela", "ceu", "noite", "nuvem"], ["cometa", "sombra", "vento", "silencio", "brisa"], ["neblina", "lanterna", "constelacao", "sereno", "aurora"]],
    infantil: [["lua", "estrela", "ceu", "sono", "nuvem"], ["vento", "luz", "coberta", "janela", "noite"], ["sereno", "silencio", "lanterna", "cometa", "pijama"]],
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
    nome: "Cidade e servicos",
    nomeInfantil: "Passeio na rua",
    adulto: [["praca", "banco", "loja", "faixa", "taxi"], ["hospital", "mercado", "avenida", "farmacia", "onibus"], ["prefeitura", "padaria", "esquina", "posto", "calcada"]],
    infantil: [["rua", "praca", "loja", "ponto", "bike"], ["escola", "parque", "faixa", "busao", "sorvete"], ["pracinha", "balao", "padaria", "caixa", "trator"]],
  },
  {
    nome: "Praia e clima",
    nomeInfantil: "Dia de sol",
    adulto: [["mar", "areia", "guarda-sol", "onda", "toalha"], ["concha", "vento", "quiosque", "protetor", "calor"], ["piscina", "boia", "brisa", "cadeira", "horizonte"]],
    infantil: [["sol", "mar", "areia", "bola", "toalha"], ["balde", "boia", "onda", "suco", "pazinha"], ["concha", "vento", "oculos", "agua", "castelo"]],
  },
  {
    nome: "Escritorio e trabalho",
    nomeInfantil: "Mesa de tarefas",
    adulto: [["agenda", "caneta", "reuniao", "relatorio", "telefone"], ["documento", "teclado", "monitor", "planilha", "pasta"], ["email", "projeto", "arquivo", "cafe", "anotacao"]],
    infantil: [["mesa", "lapis", "papel", "regua", "estojo"], ["agenda", "caneta", "caderno", "cola", "folha"], ["desenho", "quadro", "tinta", "giz", "tesoura"]],
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
    nome: "Arte e musica",
    nomeInfantil: "Som e desenho",
    adulto: [["pincel", "tela", "quadro", "violao", "ritmo"], ["teatro", "palco", "cena", "melodia", "coro"], ["escultura", "galeria", "som", "ensaio", "luz"]],
    infantil: [["tinta", "pincel", "musica", "danca", "som"], ["giz", "papel", "tambor", "palco", "palmas"], ["violao", "pula", "canta", "desenho", "cor"]],
  },
  {
    nome: "Corpo e saude",
    nomeInfantil: "Cuidando do corpo",
    adulto: [["sono", "agua", "fruta", "consulta", "passos"], ["respiracao", "alongamento", "energia", "saude", "descanso"], ["vitamina", "corrida", "exame", "rotina", "equilibrio"]],
    infantil: [["agua", "fruta", "sono", "pulo", "banho"], ["escova", "suco", "correr", "sorriso", "leite"], ["maca", "brinca", "dorme", "medico", "toalha"]],
  },
  {
    nome: "Tecnologia e casa conectada",
    nomeInfantil: "Coisas que acendem",
    adulto: [["tablet", "roteador", "tela", "camera", "senha"], ["celular", "alarme", "app", "sensor", "notificacao"], ["carregador", "wifi", "controle", "luz", "assistente"]],
    infantil: [["luz", "botao", "tela", "som", "controle"], ["tablet", "jogo", "camera", "toque", "cabo"], ["celular", "foto", "senha", "desenho", "musica"]],
  },
];

export const memoryChallenges: MemoryChallenge[] = memorySeeds.map((seed, index) => ({
  id: index + 1,
  difficultyLabel: PHASE_LABELS_15[index],
  nome: seed.nome,
  nomeInfantil: seed.nomeInfantil,
  variacoes: seed.adulto,
  variacoesInfantis: seed.infantil,
  tempoMemorizacao: Math.max(5, 10 - Math.floor(index / 2)),
  minimoParaConcluir: Math.min(5, 2 + Math.floor(index / 4)),
}));

const attentionSeeds = [
  { nome: "Foco em T", nomeInfantil: "Caca ao T", alvo: "T", distratores: ["O", "Q", "D", "P", "R"] },
  { nome: "Busca por A", nomeInfantil: "Caca ao A", alvo: "A", distratores: ["M", "R", "V", "N", "X"] },
  { nome: "Numero 7", nomeInfantil: "Missao do 7", alvo: "7", distratores: ["1", "4", "9", "2", "6"] },
  { nome: "Foco em B", nomeInfantil: "Caca ao B", alvo: "B", distratores: ["P", "D", "R", "E", "H"] },
  { nome: "Numero 3", nomeInfantil: "Missao do 3", alvo: "3", distratores: ["8", "5", "6", "9", "2"] },
  { nome: "Foco em M", nomeInfantil: "Caca ao M", alvo: "M", distratores: ["N", "W", "H", "K", "V"] },
  { nome: "Numero 5", nomeInfantil: "Missao do 5", alvo: "5", distratores: ["2", "8", "9", "6", "3"] },
  { nome: "Foco em L", nomeInfantil: "Caca ao L", alvo: "L", distratores: ["I", "T", "J", "F", "E"] },
  { nome: "Numero 8", nomeInfantil: "Missao do 8", alvo: "8", distratores: ["3", "0", "6", "9", "2"] },
  { nome: "Foco em C", nomeInfantil: "Caca ao C", alvo: "C", distratores: ["G", "O", "Q", "S", "U"] },
  { nome: "Numero 4", nomeInfantil: "Missao do 4", alvo: "4", distratores: ["1", "7", "9", "6", "8"] },
  { nome: "Foco em P", nomeInfantil: "Caca ao P", alvo: "P", distratores: ["R", "B", "D", "F", "K"] },
  { nome: "Numero 6", nomeInfantil: "Missao do 6", alvo: "6", distratores: ["8", "9", "3", "5", "2"] },
  { nome: "Foco em S", nomeInfantil: "Caca ao S", alvo: "S", distratores: ["Z", "C", "G", "E", "A"] },
  { nome: "Numero 9", nomeInfantil: "Missao do 9", alvo: "9", distratores: ["8", "6", "3", "5", "0"] },
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
    instrucao: `Clique apenas nos simbolos ${alvo} antes do tempo acabar.`,
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
  variacoes: [0, 1, 2].map((variation) => buildAttentionVariation(seed.alvo, seed.distratores, variation + index)),
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
    nome: "Maior numero",
    nomeInfantil: "Qual numero e maior?",
    prompt: "Escolha o numero maior em cada comparacao.",
    promptInfantil: "Toque no numero maior.",
    pairs: [
      { left: "3", right: "7", correct: "right", explanation: "7 e maior que 3." },
      { left: "9", right: "4", correct: "left", explanation: "9 e maior que 4." },
      { left: "6", right: "8", correct: "right", explanation: "8 e maior que 6." },
    ],
  },
  {
    nome: "Menor numero",
    nomeInfantil: "Qual numero e menor?",
    prompt: "Escolha o numero menor em cada comparacao.",
    promptInfantil: "Toque no numero menor.",
    pairs: [
      { left: "5", right: "2", correct: "right", explanation: "2 e menor que 5." },
      { left: "1", right: "6", correct: "left", explanation: "1 e menor que 6." },
      { left: "4", right: "9", correct: "left", explanation: "4 e menor que 9." },
    ],
  },
  {
    nome: "Palavra mais comprida",
    nomeInfantil: "Qual palavra e maior?",
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
    nomeInfantil: "Qual palavra e menor?",
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
      { left: "2 bolas", right: "5 bolas", correct: "right", explanation: "5 bolas e uma quantidade maior." },
      { left: "7 estrelas", right: "3 estrelas", correct: "left", explanation: "7 estrelas e maior que 3." },
      { left: "4 cubos", right: "6 cubos", correct: "right", explanation: "6 cubos e maior que 4." },
    ],
  },
  {
    nome: "Menor quantidade",
    nomeInfantil: "Qual grupo tem menos?",
    prompt: "Escolha o grupo com menor quantidade.",
    promptInfantil: "Toque no grupo que tem menos.",
    pairs: [
      { left: "8 pontos", right: "2 pontos", correct: "right", explanation: "2 pontos e menor quantidade." },
      { left: "1 lapis", right: "4 lapis", correct: "left", explanation: "1 lapis e menor que 4." },
      { left: "3 nuvens", right: "6 nuvens", correct: "left", explanation: "3 nuvens e menos que 6." },
    ],
  },
  {
    nome: "Ordem alfabetica inicial",
    nomeInfantil: "Qual vem primeiro?",
    prompt: "Escolha a palavra que vem primeiro na ordem alfabetica.",
    promptInfantil: "Toque na palavra que vem primeiro no alfabeto.",
    pairs: [
      { left: "abelha", right: "tigre", correct: "left", explanation: "\"abelha\" vem antes de \"tigre\"." },
      { left: "mala", right: "bola", correct: "right", explanation: "\"bola\" vem antes de \"mala\"." },
      { left: "copo", right: "janela", correct: "left", explanation: "\"copo\" vem antes de \"janela\"." },
    ],
  },
  {
    nome: "Ordem alfabetica final",
    nomeInfantil: "Qual vem depois?",
    prompt: "Escolha a palavra que vem depois na ordem alfabetica.",
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
    prompt: "Escolha a opcao que costuma demorar mais tempo.",
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
    prompt: "Escolha a opcao que dura menos tempo.",
    promptInfantil: "Toque no que dura menos.",
    pairs: [
      { left: "3 segundos", right: "2 minutos", correct: "left", explanation: "3 segundos dura menos." },
      { left: "1 semana", right: "1 dia", correct: "right", explanation: "1 dia dura menos." },
      { left: "4 horas", right: "20 minutos", correct: "right", explanation: "20 minutos dura menos." },
    ],
  },
  {
    nome: "Valor monetario maior",
    nomeInfantil: "Qual valor e maior?",
    prompt: "Escolha o maior valor monetario.",
    promptInfantil: "Toque no maior valor.",
    pairs: [
      { left: "R$ 12", right: "R$ 20", correct: "right", explanation: "R$ 20 e maior." },
      { left: "R$ 50", right: "R$ 18", correct: "left", explanation: "R$ 50 e maior." },
      { left: "R$ 31", right: "R$ 29", correct: "left", explanation: "R$ 31 e maior." },
    ],
  },
  {
    nome: "Valor monetario menor",
    nomeInfantil: "Qual valor e menor?",
    prompt: "Escolha o menor valor monetario.",
    promptInfantil: "Toque no menor valor.",
    pairs: [
      { left: "R$ 9", right: "R$ 15", correct: "left", explanation: "R$ 9 e menor." },
      { left: "R$ 32", right: "R$ 21", correct: "right", explanation: "R$ 21 e menor." },
      { left: "R$ 40", right: "R$ 12", correct: "right", explanation: "R$ 12 e menor." },
    ],
  },
  {
    nome: "Numero par mais alto",
    nomeInfantil: "Qual par e maior?",
    prompt: "Escolha o numero par mais alto.",
    promptInfantil: "Toque no numero par maior.",
    pairs: [
      { left: "8", right: "14", correct: "right", explanation: "14 e par e maior." },
      { left: "20", right: "6", correct: "left", explanation: "20 e par e maior." },
      { left: "12", right: "18", correct: "right", explanation: "18 e par e maior." },
    ],
  },
  {
    nome: "Numero impar mais baixo",
    nomeInfantil: "Qual impar e menor?",
    prompt: "Escolha o numero impar mais baixo.",
    promptInfantil: "Toque no numero impar menor.",
    pairs: [
      { left: "7", right: "3", correct: "right", explanation: "3 e impar e menor." },
      { left: "5", right: "9", correct: "left", explanation: "5 e impar e menor." },
      { left: "11", right: "13", correct: "left", explanation: "11 e impar e menor." },
    ],
  },
  {
    nome: "Comparacao mista",
    nomeInfantil: "Comparacao final",
    prompt:
      "Em cada rodada, compare as duas opcoes e escolha a que atende ao criterio correto. Algumas comparacoes pedem o maior valor, outras a palavra mais longa ou a opcao numericamente superior. Leia com calma e decida qual lado faz mais sentido.",
    promptInfantil:
      "Olhe as duas opcoes, pense no que esta sendo comparado e toque no lado certo. Pode ser o maior numero, a palavra maior ou o maior valor.",
    pairs: [
      { left: "15", right: "12", correct: "left", explanation: "15 e maior." },
      { left: "rio", right: "montanha", correct: "right", explanation: "\"montanha\" tem mais letras." },
      { left: "R$ 22", right: "R$ 19", correct: "left", explanation: "R$ 22 e maior." },
    ],
  },
];

function rotatePairs<T>(items: T[], shift: number) {
  return items.map((_, index) => items[(index + shift) % items.length]);
}

export const comparisonChallenges: ComparisonChallenge[] = comparisonSeeds.map((seed, index) => ({
  id: index + 1,
  difficultyLabel: PHASE_LABELS_15[index],
  nome: seed.nome,
  nomeInfantil: seed.nomeInfantil,
  variacoes: [0, 1, 2].map((variation) => ({
    prompt: seed.prompt,
    promptInfantil: seed.promptInfantil,
    rounds: rotatePairs(seed.pairs, variation),
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
  { nome: "Viradas rapidas", nomeInfantil: "Curvinhas rapidas", sequencias: [["direita", "cima", "baixo", "direita", "cima", "esquerda"], ["cima", "esquerda", "direita", "cima", "baixo", "esquerda"], ["baixo", "direita", "cima", "esquerda", "cima", "direita"]] },
  { nome: "Mapa com retorno", nomeInfantil: "Vai e volta no mapa", sequencias: [["cima", "direita", "baixo", "esquerda", "cima", "direita"], ["esquerda", "baixo", "direita", "cima", "esquerda", "baixo"], ["direita", "cima", "esquerda", "baixo", "direita", "cima"]] },
  { nome: "Caminho cruzado", nomeInfantil: "Cruza e gira", sequencias: [["direita", "cima", "esquerda", "cima", "direita", "baixo"], ["baixo", "direita", "cima", "esquerda", "baixo", "direita"], ["cima", "esquerda", "baixo", "direita", "cima", "esquerda"]] },
  { nome: "Rota de precisao", nomeInfantil: "Passos certinhos", sequencias: [["cima", "direita", "direita", "baixo", "esquerda", "cima"], ["esquerda", "cima", "direita", "baixo", "baixo", "direita"], ["baixo", "direita", "cima", "cima", "esquerda", "baixo"]] },
  { nome: "Sequencia densa", nomeInfantil: "Caminho comprido", sequencias: [["cima", "cima", "direita", "baixo", "direita", "cima", "esquerda"], ["esquerda", "baixo", "direita", "cima", "direita", "baixo", "esquerda"], ["direita", "cima", "esquerda", "cima", "baixo", "direita", "baixo"]] },
  { nome: "Desafio de orientacao", nomeInfantil: "Desafio do mapa", sequencias: [["cima", "direita", "baixo", "direita", "cima", "esquerda", "baixo"], ["baixo", "esquerda", "cima", "direita", "cima", "direita", "baixo"], ["direita", "direita", "cima", "esquerda", "baixo", "esquerda", "cima"]] },
  { nome: "Mestre das rotas", nomeInfantil: "Rota final", sequencias: [["cima", "direita", "cima", "esquerda", "baixo", "direita", "direita", "baixo"], ["esquerda", "cima", "direita", "cima", "baixo", "esquerda", "direita", "baixo"], ["baixo", "direita", "cima", "esquerda", "cima", "direita", "baixo", "esquerda"]] },
];

export const spatialChallenges: SpatialChallenge[] = spatialSeeds.map((seed, index) => ({
  id: index + 1,
  difficultyLabel: PHASE_LABELS_15[index],
  nome: seed.nome,
  nomeInfantil: seed.nomeInfantil,
  variacoes: seed.sequencias.map((sequence, variationIndex) => ({
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
  { nome: "Brincadeira 5", descricao: "Mais itens, mesma logica de sequencia.", sequencias: [["bola", "gato", "sol", "meia", "pipa"], ["copo", "urso", "luz", "casa", "flor"], ["dado", "pato", "giz", "bolo", "robo"]] },
  { nome: "Brincadeira 6", descricao: "Aumente o foco e mantenha a ordem.", sequencias: [["flor", "copo", "bola", "tinta", "gato"], ["suco", "pipa", "sol", "giz", "meia"], ["casa", "robo", "pato", "luz", "dado"]] },
  { nome: "Brincadeira 7", descricao: "Treino mais longo para consolidar memoria de ordem.", sequencias: [["bola", "gato", "sol", "casa", "pipa"], ["urso", "flor", "giz", "meia", "copo"], ["robo", "pato", "luz", "bolo", "dado"]] },
  { nome: "Brincadeira 8", descricao: "Sequencias mais exigentes para a crianca.", sequencias: [["casa", "sol", "pipa", "gato", "meia"], ["copo", "flor", "bola", "giz", "urso"], ["robo", "dado", "luz", "pato", "bolo"]] },
  { nome: "Brincadeira 9", descricao: "Fase avancada infantil.", sequencias: [["bola", "casa", "flor", "pipa", "sol"], ["gato", "meia", "urso", "copo", "giz"], ["robo", "luz", "pato", "bolo", "dado"]] },
  { nome: "Brincadeira 10", descricao: "Fase final infantil com sequencias consolidadas.", sequencias: [["bola", "gato", "sol", "pipa", "casa", "meia"], ["urso", "flor", "copo", "giz", "dado", "luz"], ["robo", "pato", "bolo", "leite", "tinta", "barco"]] },
];

const exclusiveAdolescente: ExclusiveSeed[] = [
  { nome: "Codigo 1", descricao: "Sequencias curtas de codigos e simbolos.", sequencias: [["A7", "K2", "M9", "R4"], ["T5", "B1", "N6", "Z3"], ["C8", "P4", "D7", "S1"]] },
  { nome: "Codigo 2", descricao: "Mais ritmo e controle de ordem.", sequencias: [["L3", "Q8", "H2", "V5"], ["R6", "M1", "T9", "B4"], ["N7", "D2", "K5", "P8"]] },
  { nome: "Codigo 3", descricao: "Agora com maior interferencia visual.", sequencias: [["X4", "C7", "A2", "J9", "L1"], ["B8", "M3", "R5", "T2", "Q6"], ["P4", "D9", "N1", "S7", "K3"]] },
  { nome: "Codigo 4", descricao: "Sequencias de cinco itens.", sequencias: [["A1", "B2", "C3", "D4", "E5"], ["K9", "L8", "M7", "N6", "O5"], ["T1", "R2", "Q3", "P4", "M5"]] },
  { nome: "Codigo 5", descricao: "Trocas rapidas entre letras e numeros.", sequencias: [["AX3", "B7", "CZ1", "D4", "E9"], ["F2", "GX8", "H1", "JT6", "K3"], ["L9", "M5", "N2", "P8", "Q1"]] },
  { nome: "Codigo 6", descricao: "Fase intermediaria alta.", sequencias: [["V4", "T8", "R2", "P6", "M1"], ["C5", "D1", "F9", "H4", "J7"], ["K2", "L6", "N8", "Q3", "S5"]] },
  { nome: "Codigo 7", descricao: "Maior densidade e menos margem de erro.", sequencias: [["A7", "C4", "E1", "G8", "J5", "L2"], ["M9", "P6", "R3", "T1", "V8", "X4"], ["B2", "D5", "F7", "H9", "K1", "N3"]] },
  { nome: "Codigo 8", descricao: "Ordem longa com mais distratores.", sequencias: [["Q1", "W4", "E7", "R2", "T9", "Y3"], ["U5", "I8", "O1", "P6", "A3", "S7"], ["D2", "F9", "G4", "H1", "J8", "K5"]] },
  { nome: "Codigo 9", descricao: "Fase avancada adolescente.", sequencias: [["ZX1", "CV4", "BN7", "MQ2", "LP9", "KT3"], ["AX5", "SD8", "FG1", "HJ6", "KL3", "QP7"], ["TR2", "YU9", "IO4", "PA1", "LM8", "NC5"]] },
  { nome: "Codigo 10", descricao: "Fase final adolescente.", sequencias: [["A7", "K2", "M9", "R4", "T5", "B1", "N6"], ["C8", "P4", "D7", "S1", "V6", "W2", "F9"], ["L3", "Q8", "H2", "V5", "R6", "M1", "T9"]] },
];

const exclusiveAdulto: ExclusiveSeed[] = [
  { nome: "Sequencia 1", descricao: "Blocos curtos para treino executivo.", sequencias: [["AX3", "Q7", "LM2", "R5", "TN8"], ["M4", "PX8", "A2", "CZ7", "L9"], ["VR1", "D8", "K5", "NA3", "Q2"]] },
  { nome: "Sequencia 2", descricao: "Mais elementos por ordem.", sequencias: [["BX4", "T7", "PL2", "R8", "DN5"], ["M1", "QX9", "A4", "CZ6", "L2"], ["VR3", "D6", "K1", "NB8", "Q5"]] },
  { nome: "Sequencia 3", descricao: "Informacao mais densa.", sequencias: [["AX3", "Q7", "LM2", "R5", "TN8", "B4"], ["M4", "PX8", "A2", "CZ7", "L9", "T3"], ["VR1", "D8", "K5", "NA3", "Q2", "X4"]] },
  { nome: "Sequencia 4", descricao: "Mais carga de trabalho de memoria.", sequencias: [["AF2", "Q9", "LK4", "R1", "TN6", "BX8"], ["M3", "PX7", "A5", "CZ2", "L8", "T1"], ["VR4", "D9", "K2", "NA6", "Q3", "X7"]] },
  { nome: "Sequencia 5", descricao: "Fase intermediaria adulta.", sequencias: [["AX3", "Q7", "LM2", "R5", "TN8", "B4", "K9"], ["M4", "PX8", "A2", "CZ7", "L9", "T3", "H6"], ["VR1", "D8", "K5", "NA3", "Q2", "T7", "B9"]] },
  { nome: "Sequencia 6", descricao: "Mais itens e mais compressao de tempo.", sequencias: [["CF5", "Q1", "LK8", "R3", "TN6", "BX2", "J9"], ["M7", "PX4", "A1", "CZ9", "L5", "T2", "H8"], ["VR6", "D3", "K7", "NA2", "Q8", "T4", "B1"]] },
  { nome: "Sequencia 7", descricao: "Trabalho executivo avancado.", sequencias: [["AX3", "Q7", "LM2", "R5", "TN8", "B4", "K9", "P6"], ["M4", "PX8", "A2", "CZ7", "L9", "T3", "H6", "V1"], ["VR1", "D8", "K5", "NA3", "Q2", "T7", "B9", "X4"]] },
  { nome: "Sequencia 8", descricao: "Fase avancada com mais distratores.", sequencias: [["CF5", "Q1", "LK8", "R3", "TN6", "BX2", "J9", "P4"], ["M7", "PX4", "A1", "CZ9", "L5", "T2", "H8", "V3"], ["VR6", "D3", "K7", "NA2", "Q8", "T4", "B1", "X9"]] },
  { nome: "Sequencia 9", descricao: "Alta exigencia executiva.", sequencias: [["AX3", "Q7", "LM2", "R5", "TN8", "B4", "K9", "P6", "H1"], ["M4", "PX8", "A2", "CZ7", "L9", "T3", "H6", "V1", "D5"], ["VR1", "D8", "K5", "NA3", "Q2", "T7", "B9", "X4", "L6"]] },
  { nome: "Sequencia 10", descricao: "Fase final adulta.", sequencias: [["CF5", "Q1", "LK8", "R3", "TN6", "BX2", "J9", "P4", "H7"], ["M7", "PX4", "A1", "CZ9", "L5", "T2", "H8", "V3", "D6"], ["VR6", "D3", "K7", "NA2", "Q8", "T4", "B1", "X9", "L5"]] },
];

function createExclusiveChallenges(audience: "infantil" | "adolescente" | "adulto", baseId: number, seeds: ExclusiveSeed[]) {
  return seeds.map((seed, index) => ({
    id: baseId + index,
    audience,
    difficultyLabel: PHASE_LABELS_10[index],
    nome: seed.nome,
    descricao: seed.descricao,
    minimoParaConcluir: Math.min(7, 2 + Math.floor(index / 2)),
    variacoes: seed.sequencias.map((sequence) => ({
      prompt: "Memorize a sequencia e monte novamente na mesma ordem.",
      sequence,
      revealSeconds: Math.max(4, 8 - Math.floor(index / 4)),
      options: Array.from(new Set([...sequence, ...sequence.slice(0, Math.min(sequence.length, 3))])).slice(0, sequence.length + 2),
    })),
  }));
}

export const exclusiveChallenges: ExclusiveChallenge[] = [
  ...createExclusiveChallenges("infantil", 101, exclusiveInfantil),
  ...createExclusiveChallenges("adolescente", 201, exclusiveAdolescente),
  ...createExclusiveChallenges("adulto", 301, exclusiveAdulto),
];
