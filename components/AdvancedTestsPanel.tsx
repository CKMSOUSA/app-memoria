"use client";

type AdvancedTestsPanelProps = {
  onBack: () => void;
  onOpenMemory: () => void;
  onOpenAttention: () => void;
  onOpenComparison: () => void;
  onOpenSpatial: () => void;
  onOpenLogic: () => void;
};

const advancedTracks = [
  {
    title: "Memoria",
    description: "Listas longas, interferencia semantica e codigos muito parecidos.",
  },
  {
    title: "Atencao",
    description: "Grades densas com distratores quase identicos e margem minima de erro.",
  },
  {
    title: "Comparacao",
    description: "Regras compostas, calculo mental e criterios abstratos na mesma rodada.",
  },
  {
    title: "Orientacao espacial",
    description: "Rotas extensas com retorno, cruzamento de eixo e pouca janela de memorizacao.",
  },
  {
    title: "Logica",
    description: "Series compostas por duas ou tres regras simultaneas, em nivel extremo.",
  },
];

export function AdvancedTestsPanel({
  onBack,
  onOpenMemory,
  onOpenAttention,
  onOpenComparison,
  onOpenSpatial,
  onOpenLogic,
}: AdvancedTestsPanelProps) {
  const actions = [onOpenMemory, onOpenAttention, onOpenComparison, onOpenSpatial, onOpenLogic];

  return (
    <main className="shell shell-center">
      <section className="game-card">
        <header className="game-header">
          <div>
            <p className="eyebrow">Testes Avancados</p>
            <h1>Painel de alta complexidade cognitiva</h1>
            <p className="muted">
              Esta area ignora adaptacao por idade e apresenta somente desafios em grau muito dificil, extremamente dificil e elite cognitiva.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={onBack}>
            Voltar ao painel
          </button>
        </header>

        <section className="panel">
          <div className="section-head">
            <h3>Escolha a trilha extrema</h3>
            <span className="small-muted">Cinco blocos independentes para treino avancado</span>
          </div>

          <div className="admin-grid">
            {advancedTracks.map((track, index) => (
              <article key={track.title} className="admin-card">
                <div className="section-head">
                  <h3>{track.title}</h3>
                  <span className="pill pill-neutral">Modo extremo</span>
                </div>
                <p className="muted">{track.description}</p>
                <button className="btn btn-primary" onClick={actions[index]}>
                  Abrir teste
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
