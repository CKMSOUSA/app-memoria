export type Tela =
  | "login"
  | "cadastro"
  | "recuperar"
  | "adminAcesso"
  | "dashboard"
  | "testesAvancados"
  | "memoria"
  | "memoriaAvancada"
  | "visual"
  | "atencao"
  | "atencaoAvancada"
  | "comparacao"
  | "comparacaoAvancada"
  | "espacial"
  | "espacialAvancada"
  | "logica"
  | "logicaAvancada"
  | "perfil"
  | "especial"
  | "ajuda"
  | "adminConfirm"
  | "admin";

export type DataMode = "local" | "remote";
export type UserRole = "aluno" | "responsavel" | "professor" | "admin";
export type UserStatus = "ativo" | "bloqueado" | "excluido";

export type Usuario = {
  nome: string;
  email: string;
  avatar: string;
  premium: boolean;
  pontos: number;
  criadoEm: string;
  idade: number;
  role: UserRole;
  status: UserStatus;
  turma?: string | null;
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
  visual: Record<number, ChallengeProgress>;
  atencao: Record<number, ChallengeProgress>;
  comparacao: Record<number, ChallengeProgress>;
  espacial: Record<number, ChallengeProgress>;
  logica: Record<number, ChallengeProgress>;
  especial: Record<number, ChallengeProgress>;
};

export type SessionMode = keyof ProgressState;

export type SessionRecord = {
  id: string;
  email: string;
  mode: SessionMode;
  challengeId: number;
  score: number;
  timeSeconds: number;
  completed: boolean;
  playedAt: string;
};

export type HelpRequest = {
  id: string;
  email: string;
  name: string;
  subject: string;
  message: string;
  createdAt: string;
  status: "aberta" | "respondida";
  adminReply?: string | null;
};

export type AdminOverview = {
  users: Usuario[];
  histories: Array<{ user: Usuario; history: SessionRecord[]; progress?: ProgressState }>;
  helpRequests: HelpRequest[];
  source: "local" | "supabase";
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
  roundsAte10?: ComparisonRound[];
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

export type LogicRound = {
  prompt: string;
  sequence: string[];
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export type LogicVariation = {
  prompt: string;
  promptInfantil?: string;
  rounds: LogicRound[];
};

export type LogicChallenge = {
  id: number;
  difficultyLabel: string;
  nome: string;
  nomeInfantil?: string;
  variacoes: LogicVariation[];
  tempoLimite: number;
  minimoParaConcluir: number;
};

export type VisualMemoryChallenge = {
  id: number;
  difficultyLabel: string;
  nome: string;
  nomeInfantil?: string;
  variacoes: string[][];
  revealSeconds: number;
  tempoLimite: number;
  minimoParaConcluir: number;
};
