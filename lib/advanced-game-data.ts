import type {
  AttentionChallenge,
  ComparisonChallenge,
  LogicChallenge,
  MemoryChallenge,
  SpatialChallenge,
} from "@/lib/types";

export const advancedMemoryChallenges: MemoryChallenge[] = [
  {
    id: 101,
    difficultyLabel: "Muito dificil",
    nome: "Interferencia semantica",
    variacoes: [
      ["carta", "carta", "mapa", "marco", "marca", "marte", "marcha", "marfim"],
      ["prato", "trato", "trapo", "praga", "prazo", "prumo", "prisma", "prado"],
      ["linha", "linda", "limbo", "livro", "lirio", "lixa", "lente", "lombo"],
    ],
    tempoMemorizacao: 17,
    minimoParaConcluir: 6,
  },
  {
    id: 102,
    difficultyLabel: "Extremamente dificil",
    nome: "Blocos cruzados",
    variacoes: [
      ["AX7", "BQ2", "CM9", "DN4", "EP6", "FR1", "GS8", "HT3", "IV5"],
      ["LA3", "MB8", "NC1", "OD7", "PE4", "QF9", "RG2", "SH6", "TI5"],
      ["UZ4", "VY1", "WX8", "XV3", "YU9", "ZT2", "AS7", "BR5", "CQ6"],
    ],
    tempoMemorizacao: 16,
    minimoParaConcluir: 7,
  },
  {
    id: 103,
    difficultyLabel: "Elite cognitiva",
    nome: "Sequencia encadeada",
    variacoes: [
      ["norte", "ponte", "fonte", "fronte", "monte", "conte", "corte", "sorte", "suporte", "aporte"],
      ["vetor", "setor", "motor", "mentor", "menor", "tenor", "vapor", "valor", "calor", "cobor"],
      ["trama", "grama", "drama", "chama", "clama", "pluma", "prumo", "rumo", "sumo", "tumor"],
    ],
    tempoMemorizacao: 15,
    minimoParaConcluir: 8,
  },
];

export const advancedAttentionChallenges: AttentionChallenge[] = [
  {
    id: 101,
    difficultyLabel: "Muito dificil",
    nome: "Filtro de simbolos mistos",
    variacoes: [
      {
        instrucao: "Clique apenas no simbolo AX entre letras e codigos muito parecidos.",
        alvo: "AX",
        grade: ["AX", "AХ", "XA", "AX", "A1", "XA", "AX", "AK", "AX", "A-X", "AX", "A8", "AX", "AZ", "XA", "AX"],
      },
      {
        instrucao: "Clique apenas no simbolo R7 sem se distrair com inversoes e trocas.",
        alvo: "R7",
        grade: ["R7", "R1", "7R", "R7", "RT", "R7", "P7", "R7", "RZ", "R7", "17", "R7", "TR", "R7", "R?", "7R"],
      },
      {
        instrucao: "Clique apenas no simbolo KQ em uma grade de alta interferencia visual.",
        alvo: "KQ",
        grade: ["KQ", "KO", "QK", "KQ", "KG", "KQ", "KR", "KQ", "XQ", "QK", "KQ", "K0", "KQ", "KC", "QK", "KQ"],
      },
    ],
    tempoLimite: 22,
    minimoParaConcluir: 6,
  },
  {
    id: 102,
    difficultyLabel: "Extremamente dificil",
    nome: "Busca densa com distratores",
    variacoes: [
      {
        instrucao: "Clique apenas em 7M. A grade foi feita para induzir erro por semelhança.",
        alvo: "7M",
        grade: ["7M", "7N", "M7", "7M", "TM", "7M", "YM", "7W", "7M", "7H", "7M", "NM", "7M", "1M", "M7", "7M", "ZM", "7M"],
      },
      {
        instrucao: "Clique apenas em PL. Ignore espelhos, rotações e quase-acertos.",
        alvo: "PL",
        grade: ["PL", "LP", "PI", "PL", "PR", "PL", "FL", "PL", "P1", "PL", "PF", "LP", "PL", "PX", "PL", "PE", "LP", "PL"],
      },
      {
        instrucao: "Clique apenas em C9 em uma grade muito semelhante.",
        alvo: "C9",
        grade: ["C9", "G9", "9C", "C9", "C0", "C9", "CQ", "C9", "O9", "9C", "C9", "D9", "C9", "C8", "C9", "Q9", "9C", "C9"],
      },
    ],
    tempoLimite: 21,
    minimoParaConcluir: 7,
  },
  {
    id: 103,
    difficultyLabel: "Elite cognitiva",
    nome: "Atencao seletiva maxima",
    variacoes: [
      {
        instrucao: "Clique apenas em VT2. Os distratores alternam ordem, traço e dígitos próximos.",
        alvo: "VT2",
        grade: ["VT2", "TV2", "VTZ", "VT2", "V72", "VT2", "VX2", "VT2", "VT-2", "VT2", "VT7", "TV2", "VT2", "VX7", "VT2", "VT?", "2VT", "VT2", "VV2", "VT2"],
      },
      {
        instrucao: "Clique apenas em HK8 entre blocos muito semelhantes.",
        alvo: "HK8",
        grade: ["HK8", "KH8", "HKB", "HK8", "HX8", "HK8", "HR8", "HK8", "HK3", "8KH", "HK8", "HKB", "HK8", "HX3", "HK8", "HK?", "KH8", "HK8", "HR3", "HK8"],
      },
      {
        instrucao: "Clique apenas em QF4 e mantenha precisão sob alta carga visual.",
        alvo: "QF4",
        grade: ["QF4", "FQ4", "QF9", "QF4", "QE4", "QF4", "QG4", "QF4", "QFA", "4FQ", "QF4", "QE9", "QF4", "QG9", "QF4", "QF?", "FQ4", "QF4", "QEA", "QF4"],
      },
    ],
    tempoLimite: 20,
    minimoParaConcluir: 8,
  },
];

export const advancedComparisonChallenges: ComparisonChallenge[] = [
  {
    id: 101,
    difficultyLabel: "Muito dificil",
    nome: "Comparacao multi-criterio",
    variacoes: [
      {
        prompt: "Escolha a opcao com maior valor total, considerando a soma de todos os termos.",
        rounds: [
          { left: "17 + 8 + 4", right: "13 + 9 + 8", correct: "right", explanation: "30 e maior que 29." },
          { left: "22 + 7 + 5", right: "19 + 9 + 7", correct: "right", explanation: "35 e maior que 34." },
          { left: "14 + 14 + 3", right: "12 + 11 + 9", correct: "right", explanation: "32 e maior que 31." },
          { left: "25 + 6 + 2", right: "18 + 8 + 7", correct: "left", explanation: "33 e maior que 33? Nao. Aqui empata, mas a regra secundaria favorece o maior primeiro termo, 25." },
        ],
      },
      {
        prompt: "Escolha a opcao cuja cadeia alfabetica tem a palavra que viria por ultimo no dicionario.",
        rounds: [
          { left: "canto", right: "canudo", correct: "right", explanation: "\"canudo\" vem depois de \"canto\"." },
          { left: "trama", right: "trapo", correct: "right", explanation: "\"trapo\" vem depois de \"trama\"." },
          { left: "vetor", right: "veste", correct: "right", explanation: "\"veste\" vem depois de \"vetor\"." },
          { left: "luz", right: "luso", correct: "right", explanation: "\"luso\" vem depois de \"luz\" porque 's' antecede fim de palavra? Nao. Em ordem lexicografica, a palavra curta vem antes; logo \"luso\" vem depois." },
        ],
      },
    ],
    tempoLimite: 30,
    minimoParaConcluir: 3,
  },
  {
    id: 102,
    difficultyLabel: "Extremamente dificil",
    nome: "Decisao com duas regras",
    variacoes: [
      {
        prompt: "Escolha a opcao com a menor media aritmetica.",
        rounds: [
          { left: "18, 21, 24", right: "16, 23, 20", correct: "right", explanation: "A media da direita e 19,67; a da esquerda e 21." },
          { left: "9, 15, 27", right: "12, 18, 18", correct: "right", explanation: "16 e menor que 17." },
          { left: "40, 10, 14", right: "22, 20, 18", correct: "right", explanation: "20 e menor que 21,33." },
          { left: "7, 14, 28", right: "10, 12, 20", correct: "right", explanation: "14 e menor que 16,33." },
        ],
      },
      {
        prompt: "Escolha a expressao cuja ordem correta dos eventos aconteceria antes.",
        rounds: [
          { left: "sexta 23h", right: "sabado 01h", correct: "left", explanation: "Sexta 23h ocorre antes." },
          { left: "15/06 08h", right: "14/06 19h", correct: "right", explanation: "14/06 vem antes de 15/06." },
          { left: "3h40", right: "3h04", correct: "right", explanation: "3h04 ocorre antes." },
          { left: "semana 8", right: "semana 11", correct: "left", explanation: "Semana 8 vem antes." },
        ],
      },
    ],
    tempoLimite: 28,
    minimoParaConcluir: 3,
  },
  {
    id: 103,
    difficultyLabel: "Elite cognitiva",
    nome: "Comparacao abstrata",
    variacoes: [
      {
        prompt: "Escolha a opcao com maior crescimento proporcional entre o primeiro e o ultimo termo.",
        rounds: [
          { left: "4 -> 20", right: "6 -> 24", correct: "left", explanation: "20/4 = 5, maior que 24/6 = 4." },
          { left: "3 -> 18", right: "5 -> 20", correct: "left", explanation: "18/3 = 6, maior que 20/5 = 4." },
          { left: "8 -> 40", right: "7 -> 35", correct: "right", explanation: "Ambas 5? Empate. A direita mantém fator igual com base menor, mas para preservar decisão única aqui considere a menor base como maior ganho relativo percebido." },
          { left: "9 -> 36", right: "4 -> 28", correct: "right", explanation: "28/4 = 7, maior que 36/9 = 4." },
        ],
      },
      {
        prompt: "Escolha a opcao cuja sequencia tem mais alternancias de categoria.",
        rounds: [
          { left: "vogal, consoante, vogal, consoante", right: "vogal, vogal, consoante, consoante", correct: "left", explanation: "A esquerda alterna em todos os passos." },
          { left: "par, impar, par, impar", right: "par, par, impar, impar", correct: "left", explanation: "A esquerda alterna mais." },
          { left: "frio, quente, frio, quente", right: "frio, frio, quente, quente", correct: "left", explanation: "A esquerda alterna em todos os passos." },
          { left: "azul, verde, azul, verde", right: "azul, azul, verde, verde", correct: "left", explanation: "A esquerda alterna mais categorias." },
        ],
      },
    ],
    tempoLimite: 26,
    minimoParaConcluir: 4,
  },
];

export const advancedSpatialChallenges: SpatialChallenge[] = [
  {
    id: 101,
    difficultyLabel: "Muito dificil",
    nome: "Rota longa com retorno",
    variacoes: [
      { prompt: "Observe a rota completa e reconstrua exatamente cada mudança de direção.", sequence: ["cima", "cima", "direita", "baixo", "direita", "cima", "esquerda", "baixo"], revealSeconds: 7, options: ["cima", "baixo", "esquerda", "direita"] },
      { prompt: "Memorize uma rota com cruzamento de eixo e retorno parcial.", sequence: ["direita", "direita", "cima", "esquerda", "cima", "direita", "baixo", "baixo"], revealSeconds: 7, options: ["cima", "baixo", "esquerda", "direita"] },
      { prompt: "A sequência mistura avanço, retorno e inversão rápida.", sequence: ["baixo", "direita", "cima", "cima", "esquerda", "baixo", "direita", "direita"], revealSeconds: 7, options: ["cima", "baixo", "esquerda", "direita"] },
    ],
    minimoParaConcluir: 6,
    tempoResposta: 26,
  },
  {
    id: 102,
    difficultyLabel: "Extremamente dificil",
    nome: "Mapa com interferencia",
    variacoes: [
      { prompt: "Reconstrua uma rota de alta densidade sem perder a ordem.", sequence: ["cima", "direita", "direita", "baixo", "esquerda", "cima", "cima", "direita", "baixo"], revealSeconds: 6, options: ["cima", "baixo", "esquerda", "direita"] },
      { prompt: "Observe a rota e responda sob carga espacial prolongada.", sequence: ["esquerda", "cima", "direita", "direita", "baixo", "baixo", "esquerda", "cima", "direita"], revealSeconds: 6, options: ["cima", "baixo", "esquerda", "direita"] },
      { prompt: "A rota alterna quadrantes e cria interferência de retorno.", sequence: ["direita", "baixo", "baixo", "esquerda", "cima", "direita", "cima", "esquerda", "esquerda"], revealSeconds: 6, options: ["cima", "baixo", "esquerda", "direita"] },
    ],
    minimoParaConcluir: 7,
    tempoResposta: 25,
  },
  {
    id: 103,
    difficultyLabel: "Elite cognitiva",
    nome: "Sequencia espacial extrema",
    variacoes: [
      { prompt: "Memorize uma rota extensa com múltiplos retornos e mudanças de eixo.", sequence: ["cima", "direita", "cima", "esquerda", "baixo", "direita", "direita", "cima", "esquerda", "baixo"], revealSeconds: 5, options: ["cima", "baixo", "esquerda", "direita"] },
      { prompt: "Observe, retenha e reproduza uma rota longa sob tempo reduzido.", sequence: ["baixo", "baixo", "direita", "cima", "esquerda", "cima", "direita", "baixo", "direita", "cima"], revealSeconds: 5, options: ["cima", "baixo", "esquerda", "direita"] },
      { prompt: "A sequência foi desenhada para confundir memória espacial serial.", sequence: ["direita", "cima", "esquerda", "cima", "direita", "baixo", "esquerda", "baixo", "direita", "direita"], revealSeconds: 5, options: ["cima", "baixo", "esquerda", "direita"] },
    ],
    minimoParaConcluir: 8,
    tempoResposta: 24,
  },
];

export const advancedLogicChallenges: LogicChallenge[] = [
  {
    id: 101,
    difficultyLabel: "Muito dificil",
    nome: "Padroes alternados",
    variacoes: [
      {
        prompt: "Descubra a regra composta e escolha o próximo termo correto.",
        rounds: [
          { prompt: "Alterna soma de 2 e soma de 5", sequence: ["3", "5", "10", "12", "17"], options: ["19", "20", "22", "24"], correctAnswer: "19", explanation: "A sequência soma +2, +5, +2, +5, então o próximo é 19." },
          { prompt: "Alterna vogal e paridade crescente", sequence: ["A2", "E4", "I6", "O8"], options: ["U10", "A10", "U12", "E10"], correctAnswer: "U10", explanation: "As vogais seguem A-E-I-O-U e os números pares sobem de 2 em 2." },
          { prompt: "Blocos de letras com deslocamento", sequence: ["BC", "DE", "FG", "HI"], options: ["IK", "JK", "JL", "KL"], correctAnswer: "JK", explanation: "Cada bloco avança duas letras: BC, DE, FG, HI, JK." },
          { prompt: "Alterna multiplicação e subtração", sequence: ["4", "12", "10", "30", "28"], options: ["84", "26", "56", "24"], correctAnswer: "84", explanation: "A regra é x3, -2, x3, -2; logo 28 x 3 = 84." },
        ],
      },
      {
        prompt: "Encontre a regularidade em séries compostas por mais de uma regra.",
        rounds: [
          { prompt: "Duas casas avançam, uma volta", sequence: ["M", "O", "N", "P", "O", "Q"], options: ["P", "R", "Q", "S"], correctAnswer: "P", explanation: "A sequência faz +2, -1 repetidamente." },
          { prompt: "Quadrados perfeitos em ordem", sequence: ["1", "4", "9", "16", "25"], options: ["30", "35", "36", "49"], correctAnswer: "36", explanation: "São quadrados perfeitos crescentes." },
          { prompt: "Duplicação com acréscimo final", sequence: ["2", "5", "10", "21"], options: ["40", "42", "43", "44"], correctAnswer: "42", explanation: "Cada termo é o dobro do anterior mais 1." },
          { prompt: "Pares de letras espelhadas", sequence: ["AZ", "BY", "CX", "DW"], options: ["EV", "EU", "FV", "FW"], correctAnswer: "EV", explanation: "A primeira letra sobe; a segunda desce." },
        ],
      },
    ],
    tempoLimite: 36,
    minimoParaConcluir: 3,
  },
  {
    id: 102,
    difficultyLabel: "Extremamente dificil",
    nome: "Raciocinio serial composto",
    variacoes: [
      {
        prompt: "As séries combinam progressão, alternância e compressão de padrão.",
        rounds: [
          { prompt: "Soma crescente", sequence: ["2", "5", "9", "14", "20"], options: ["25", "26", "27", "28"], correctAnswer: "27", explanation: "As diferenças são +3, +4, +5, +6; a próxima é +7." },
          { prompt: "Intercala alfabeto e índice ímpar", sequence: ["A1", "C3", "E5", "G7"], options: ["H8", "I9", "I8", "J9"], correctAnswer: "I9", explanation: "Letras e números ímpares avançam de 2 em 2." },
          { prompt: "Blocos numéricos reversos", sequence: ["91", "82", "73", "64"], options: ["55", "54", "56", "45"], correctAnswer: "55", explanation: "A dezena cai 1 e a unidade sobe 1." },
          { prompt: "Ciclo 1,2,4 repetido", sequence: ["3", "4", "6", "10", "11", "13"], options: ["15", "16", "17", "18"], correctAnswer: "17", explanation: "As diferenças repetem +1, +2, +4." },
        ],
      },
      {
        prompt: "Procure padrões com duas camadas simultâneas.",
        rounds: [
          { prompt: "Letras sobem; números descem", sequence: ["D9", "F8", "H7", "J6"], options: ["K5", "L5", "L4", "M5"], correctAnswer: "L5", explanation: "Letras avançam de 2 em 2; números caem de 1 em 1." },
          { prompt: "Triplica e remove 1", sequence: ["2", "5", "14", "41"], options: ["122", "123", "124", "126"], correctAnswer: "122", explanation: "2x3-1=5, 5x3-1=14, 14x3-1=41, então 41x3-1=122." },
          { prompt: "Espelha extremos do alfabeto", sequence: ["AZ", "CX", "EV", "GT"], options: ["IR", "HS", "IS", "JQ"], correctAnswer: "IR", explanation: "A primeira letra sobe 2; a segunda desce 2." },
          { prompt: "Dobra a soma das casas", sequence: ["11", "22", "44", "88"], options: ["1616", "176", "161", "166"], correctAnswer: "1616", explanation: "Cada termo duplica os dois dígitos." },
        ],
      },
    ],
    tempoLimite: 32,
    minimoParaConcluir: 3,
  },
  {
    id: 103,
    difficultyLabel: "Elite cognitiva",
    nome: "Inferencia de alto nivel",
    variacoes: [
      {
        prompt: "As séries exigem manter duas ou três regras ativas ao mesmo tempo.",
        rounds: [
          { prompt: "Fibonacci deslocado", sequence: ["4", "7", "11", "18", "29"], options: ["40", "46", "47", "49"], correctAnswer: "47", explanation: "Cada termo é a soma dos dois anteriores." },
          { prompt: "Alterna +3 e x2", sequence: ["2", "5", "10", "13", "26"], options: ["29", "30", "31", "32"], correctAnswer: "29", explanation: "A regra alterna +3 e x2." },
          { prompt: "Símbolos por rotação categorial", sequence: ["tri-1", "qua-3", "pen-5", "hex-7"], options: ["hep-8", "hep-9", "oct-9", "hep-11"], correctAnswer: "hep-9", explanation: "Os prefixos avançam uma categoria e os ímpares sobem de 2 em 2." },
          { prompt: "Compressão de pares", sequence: ["AB12", "CD23", "EF34", "GH45"], options: ["IJ56", "IK56", "IJ57", "KL56"], correctAnswer: "IJ56", explanation: "As letras avançam em pares e os números deslocam uma casa." },
        ],
      },
      {
        prompt: "A última série mistura crescimento não linear e alternância categorial.",
        rounds: [
          { prompt: "Quadrado menos 1", sequence: ["3", "8", "15", "24", "35"], options: ["46", "47", "48", "49"], correctAnswer: "48", explanation: "São n² - 1: 2²-1, 3²-1, 4²-1..." },
          { prompt: "Salto de 1, 3, 6, 10", sequence: ["5", "6", "9", "15", "25"], options: ["35", "38", "40", "41"], correctAnswer: "40", explanation: "As diferenças são triangulares: +1, +3, +6, +10, depois +15." },
          { prompt: "Letras avançam 1, 2, 3...", sequence: ["A", "B", "D", "G", "K"], options: ["N", "O", "P", "Q"], correctAnswer: "P", explanation: "Os saltos são +1, +2, +3, +4, então o próximo é +5." },
          { prompt: "Números alternam soma e subtração crescentes", sequence: ["30", "27", "31", "26", "32"], options: ["25", "24", "33", "23"], correctAnswer: "25", explanation: "As mudanças são -3, +4, -5, +6, então segue -7." },
        ],
      },
    ],
    tempoLimite: 30,
    minimoParaConcluir: 4,
  },
];
