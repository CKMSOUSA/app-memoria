export type Tela =
  | "login"
  | "cadastro"
  | "recuperar"
  | "dashboard"
  | "memoria"
  | "atencao"
  | "comparacao"
  | "espacial"
  | "perfil"
  | "especial";

export type Usuario = {
  nome: string;
  email: string;
  avatar: string;
  premium: boolean;
  pontos: number;
  criadoEm: string;
  idade: number;
};

export type UsuarioPersistido = Usuario & {
  passwordHash: string;
};

export type ChallengeProgress = {
  attempts: number;
  bestScore: number;
  lastScore: number;
  bestTimeSeconds: number | null;
  completed: boolean;
  lastPlayedAt: string | null;
  lastVariationIndex: number | null;
};

export type ProgressState = {
  memoria: Record<number, ChallengeProgress>;
  atencao: Record<number, ChallengeProgress>;
  comparacao: Record<number, ChallengeProgress>;
  espacial: Record<number, ChallengeProgress>;
  especial: Record<number, ChallengeProgress>;
};

export type MemoryChallenge = {
  id: number;
  difficultyLabel: string;
  nome: string;
  nomeInfantil?: string;
  variacoes: string[][];
  variacoesInfantis?: string[][];
  tempoMemorizacao: number;
  minimoParaConcluir: number;
};

export type AttentionVariation = {
  instrucao: string;
  instrucaoInfantil?: string;
  alvo: string;
  grade: string[];
  gradeInfantil?: string[];
};

export type AttentionChallenge = {
  id: number;
  difficultyLabel: string;
  nome: string;
  nomeInfantil?: string;
  variacoes: AttentionVariation[];
  tempoLimite: number;
  minimoParaConcluir: number;
};

export type ComparisonRound = {
  left: string;
  right: string;
  correct: "left" | "right";
  explanation: string;
};

export type ComparisonVariation = {
  prompt: string;
  promptInfantil?: string;
  rounds: ComparisonRound[];
};

export type ComparisonChallenge = {
  id: number;
  difficultyLabel: string;
  nome: string;
  nomeInfantil?: string;
  variacoes: ComparisonVariation[];
  tempoLimite: number;
  minimoParaConcluir: number;
};

export type Audience = "infantil" | "adolescente" | "adulto";

export type SpatialVariation = {
  prompt: string;
  promptInfantil?: string;
  sequence: string[];
  revealSeconds: number;
  options: string[];
};

export type SpatialChallenge = {
  id: number;
  difficultyLabel: string;
  nome: string;
  nomeInfantil?: string;
  variacoes: SpatialVariation[];
  minimoParaConcluir: number;
  tempoResposta: number;
};

export type ExclusiveVariation = {
  prompt: string;
  sequence: string[];
  revealSeconds: number;
  options: string[];
};

export type ExclusiveChallenge = {
  id: number;
  audience: Audience;
  difficultyLabel: string;
  nome: string;
  descricao: string;
  minimoParaConcluir: number;
  variacoes: ExclusiveVariation[];
};
