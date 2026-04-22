"use client";

import type { ClinicalObservation, HelpRequest, SessionRecord, Usuario } from "@/lib/types";

function createPrintWindow(title: string) {
  if (typeof window === "undefined") return null;
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=960,height=720");
  if (!printWindow) return null;

  printWindow.document.write(`<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #1f2937; }
        h1,h2,h3 { margin: 0 0 12px; }
        h1 { font-size: 28px; }
        h2 { font-size: 18px; margin-top: 28px; text-transform: uppercase; }
        p, li { font-size: 13px; line-height: 1.6; }
        .meta { margin-bottom: 18px; color: #4b5563; }
        .card { border: 1px solid #d1d5db; border-radius: 14px; padding: 16px; margin-top: 14px; }
        .grid { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .pill { display: inline-block; padding: 6px 10px; border-radius: 999px; background: #f3f4f6; font-weight: 700; margin-right: 8px; margin-bottom: 8px; }
        .muted { color: #6b7280; }
        .line { margin: 8px 0; }
        @media print { body { margin: 18px; } .page-break { page-break-before: always; } }
      </style>
    </head>
    <body></body>
  </html>`);
  printWindow.document.close();
  return printWindow;
}

function writeSection(windowRef: Window, content: string) {
  windowRef.document.body.insertAdjacentHTML("beforeend", content);
}

export function exportUserReportPdf(input: {
  usuario: Usuario;
  generatedAt: string;
  summary: Array<{ label: string; value: string; caption: string }>;
  abilities: Array<{ title: string; score: number; level: string; summary: string }>;
  trends: Array<{ label: string; direction: string; summary: string }>;
  diagnostic: { title: string; readinessLabel: string; summary: string; focusLabel: string };
  recommendation: { title: string; summary: string; reason: string };
  guidedSessions: Array<{ title: string; durationLabel: string; summary: string }>;
}) {
  const printWindow = createPrintWindow(`Relatorio-${input.usuario.nome}`);
  if (!printWindow) return;

  writeSection(
    printWindow,
    `<h1>Relatorio de desempenho</h1>
     <p class="meta">${input.usuario.nome} • ${input.usuario.email} • Gerado em ${input.generatedAt}</p>`,
  );

  writeSection(
    printWindow,
    `<h2>Resumo</h2>
     <div class="grid">
       ${input.summary
         .map(
           (item) => `<div class="card"><strong>${item.label}</strong><div class="line">${item.value}</div><p class="muted">${item.caption}</p></div>`,
         )
         .join("")}
     </div>`,
  );

  writeSection(
    printWindow,
    `<h2>Diagnostico</h2>
     <div class="card">
       <p><strong>${input.diagnostic.title}</strong></p>
       <p class="line"><span class="pill">${input.diagnostic.readinessLabel}</span></p>
       <p>${input.diagnostic.summary}</p>
       <p class="muted">${input.diagnostic.focusLabel}</p>
     </div>`,
  );

  writeSection(
    printWindow,
    `<h2>Habilidades</h2>
     ${input.abilities
       .map(
         (item) => `<div class="card"><strong>${item.title}</strong><p class="line"><span class="pill">${item.score}/100</span><span class="pill">${item.level}</span></p><p>${item.summary}</p></div>`,
       )
       .join("")}`,
  );

  writeSection(
    printWindow,
    `<h2>Tendencias</h2>
     ${input.trends
       .map((item) => `<div class="card"><strong>${item.label}</strong><p class="line"><span class="pill">${item.direction}</span></p><p>${item.summary}</p></div>`)
       .join("")}`,
  );

  writeSection(
    printWindow,
    `<h2>Proxima atividade sugerida</h2>
     <div class="card"><strong>${input.recommendation.title}</strong><p>${input.recommendation.summary}</p><p class="muted">${input.recommendation.reason}</p></div>`,
  );

  writeSection(
    printWindow,
    `<h2>Sessoes guiadas</h2>
     ${input.guidedSessions
       .map((item) => `<div class="card"><strong>${item.title}</strong><p class="line">${item.durationLabel}</p><p>${item.summary}</p></div>`)
       .join("")}`,
  );

  printWindow.focus();
  printWindow.print();
}

export function exportAdminReportPdf(input: {
  generatedAt: string;
  users: Array<{ user: Usuario; history: SessionRecord[] }>;
  helpRequests: HelpRequest[];
  observations: ClinicalObservation[];
}) {
  const printWindow = createPrintWindow("Relatorio-Administrativo");
  if (!printWindow) return;

  writeSection(
    printWindow,
    `<h1>Relatorio administrativo</h1>
     <p class="meta">Gerado em ${input.generatedAt}</p>`,
  );

  writeSection(
    printWindow,
    `<h2>Resumo geral</h2>
     <div class="grid">
       <div class="card"><strong>Usuarios monitorados</strong><div class="line">${input.users.length}</div></div>
       <div class="card"><strong>Pedidos de ajuda</strong><div class="line">${input.helpRequests.length}</div></div>
       <div class="card"><strong>Observacoes clinicas/pedagogicas</strong><div class="line">${input.observations.length}</div></div>
       <div class="card"><strong>Sessoes registradas</strong><div class="line">${input.users.reduce((sum, item) => sum + item.history.length, 0)}</div></div>
     </div>`,
  );

  writeSection(
    printWindow,
    `<h2>Usuarios</h2>
     ${input.users
       .map(
         ({ user, history }) => `<div class="card">
           <strong>${user.nome}</strong>
           <p class="muted">${user.email} • ${user.role} • ${user.turma ?? "Sem turma"}</p>
           <p class="line">Sessoes: ${history.length}</p>
           <p class="line">Ultima atividade: ${history[0]?.playedAt ? new Date(history[0].playedAt).toLocaleDateString("pt-BR") : "Sem atividade"}</p>
         </div>`,
       )
       .join("")}`,
  );

  writeSection(
    printWindow,
    `<h2 class="page-break">Observacoes clinicas e pedagogicas</h2>
     ${
       input.observations.length > 0
         ? input.observations
             .map(
               (item) => `<div class="card">
                 <strong>${item.category === "clinica" ? "Clinica" : "Pedagogica"} • ${item.email}</strong>
                 <p class="muted">Atualizada em ${new Date(item.updatedAt).toLocaleDateString("pt-BR")} por ${item.authorName}</p>
                 <p>${item.note}</p>
               </div>`,
             )
             .join("")
         : `<p class="muted">Nenhuma observacao registrada.</p>`
     }`,
  );

  writeSection(
    printWindow,
    `<h2>Pedidos de ajuda</h2>
     ${
       input.helpRequests.length > 0
         ? input.helpRequests
             .map(
               (item) => `<div class="card"><strong>${item.subject}</strong><p class="muted">${item.name} • ${item.status}</p><p>${item.message}</p></div>`,
             )
             .join("")
         : `<p class="muted">Nenhum pedido de ajuda registrado.</p>`
     }`,
  );

  printWindow.focus();
  printWindow.print();
}

export function exportComparativeReportPdf(input: {
  usuario: Usuario;
  generatedAt: string;
  items: Array<{ label: string; currentValue: number; previousValue: number; delta: number; summary: string }>;
}) {
  const printWindow = createPrintWindow(`Comparativo-${input.usuario.nome}`);
  if (!printWindow) return;

  writeSection(
    printWindow,
    `<h1>Comparativo por periodo</h1>
     <p class="meta">${input.usuario.nome} • ${input.usuario.email} • Gerado em ${input.generatedAt}</p>`,
  );

  writeSection(
    printWindow,
    `<h2>Indicadores comparativos</h2>
     ${input.items
       .map(
         (item) => `<div class="card">
           <strong>${item.label}</strong>
           <p class="line"><span class="pill">Atual ${item.currentValue}</span><span class="pill">Anterior ${item.previousValue}</span><span class="pill">Delta ${item.delta >= 0 ? "+" : ""}${item.delta}</span></p>
           <p>${item.summary}</p>
         </div>`,
       )
       .join("")}`,
  );

  printWindow.focus();
  printWindow.print();
}
