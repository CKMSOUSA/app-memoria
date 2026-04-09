import type { AttentionChallenge, MemoryChallenge } from "@/lib/types";

export const memoryChallenges: MemoryChallenge[] = [
  {
    id: 1,
    nome: "Objetos do cotidiano",
    palavras: ["casa", "livro", "sol", "mesa", "carro"],
    tempoMemorizacao: 8,
    minimoParaConcluir: 3,
  },
  {
    id: 2,
    nome: "Natureza e estudo",
    palavras: ["gato", "arvore", "rio", "porta", "lapis"],
    tempoMemorizacao: 7,
    minimoParaConcluir: 3,
  },
  {
    id: 3,
    nome: "Movimento e rotina",
    palavras: ["aviao", "pao", "relogio", "escola", "mar"],
    tempoMemorizacao: 7,
    minimoParaConcluir: 4,
  },
  {
    id: 4,
    nome: "Cenario noturno",
    palavras: ["lua", "estrela", "ceu", "noite", "nuvem"],
    tempoMemorizacao: 6,
    minimoParaConcluir: 4,
  },
  {
    id: 5,
    nome: "Cores em foco",
    palavras: ["verde", "azul", "vermelho", "amarelo", "preto"],
    tempoMemorizacao: 6,
    minimoParaConcluir: 5,
  },
];

export const attentionChallenges: AttentionChallenge[] = [
  {
    id: 1,
    nome: "Foco em triangulos",
    instrucao: "Clique apenas nos triangulos antes do tempo acabar.",
    alvo: "▲",
    grade: ["▲", "●", "■", "▲", "◆", "▲", "■", "●", "▲", "◆", "▲", "●"],
    tempoLimite: 18,
    minimoParaConcluir: 4,
  },
  {
    id: 2,
    nome: "Busca por letras",
    instrucao: "Encontre somente as letras A na grade.",
    alvo: "A",
    grade: ["A", "M", "A", "R", "V", "A", "N", "X", "A", "H", "K", "A"],
    tempoLimite: 16,
    minimoParaConcluir: 4,
  },
  {
    id: 3,
    nome: "Atencao seletiva",
    instrucao: "Selecione apenas os numeros 7 e ignore os demais.",
    alvo: "7",
    grade: ["7", "1", "4", "7", "9", "2", "7", "3", "7", "6", "8", "7"],
    tempoLimite: 14,
    minimoParaConcluir: 5,
  },
];
