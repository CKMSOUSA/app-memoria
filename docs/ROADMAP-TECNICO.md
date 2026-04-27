# Roadmap Tecnico do App Memoria

Este documento organiza a proxima evolucao do produto com base nas prioridades definidas para:

- plano de treino automatico por perfil
- alertas automaticos no painel admin
- historico administrativo mais completo
- onboarding inicial mais amigavel
- continuidade de treino
- comparacao antes/depois por periodo de intervencao
- sincronizacao mais robusta entre local e Supabase
- auditoria de integridade de dados
- tratamento offline com fila de sincronizacao visivel
- dashboard de metricas internas

## Objetivo

Levar o app de um MVP funcional de treino cognitivo para uma plataforma com:

- personalizacao inicial
- continuidade de uso
- acompanhamento clinico e pedagogico
- operacao online e offline mais confiavel
- rastreabilidade administrativa
- visibilidade de uso do produto

## Estado Atual

Hoje o projeto ja possui:

- autenticacao local e integracao inicial com Supabase
- progresso e historico por usuario
- painel administrativo com visao consolidada
- insights de treino em [lib/training-insights.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/training-insights.ts)
- camada de repositorio hibrida em [lib/app-repository.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/app-repository.ts)
- fila offline basica em [lib/offline-store.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/offline-store.ts)

As principais lacunas hoje sao:

- nao existe um onboarding estruturado por objetivo e nivel
- o usuario nao tem um bloco claro de "continuar treino"
- a sincronizacao offline ainda tem baixa visibilidade para quem usa
- faltam entidades proprias para plano semanal, periodos de intervencao e metricas de produto
- a auditoria admin registra acoes, mas ainda de forma pouco detalhada

## Ordem Recomendada

### Fase 1

- onboarding inicial por perfil, objetivo e nivel
- card de continuidade de treino
- status de sincronizacao mais visivel
- endurecimento da sincronizacao local x Supabase

### Fase 2

- plano de treino automatico por perfil
- alertas automaticos no admin
- historico administrativo expandido

### Fase 3

- comparacao antes/depois por periodo de intervencao
- auditoria de integridade de dados
- dashboard de metricas internas

## Fase 1

### 1. Onboarding Inicial Mais Amigavel

Objetivo:
- coletar informacoes suficientes para personalizar a experiencia desde o primeiro acesso

Novos dados:
- `onboardingCompletedAt`
- `trainingGoal`
- `selfReportedLevel`
- `weeklyAvailability`
- `recommendedAudience`

Arquivos principais:
- [lib/types.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/types.ts)
- [components/AuthScreen.tsx](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/components/AuthScreen.tsx)
- [components/ProfileScreen.tsx](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/components/ProfileScreen.tsx)
- [app/page.tsx](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/app/page.tsx)
- [lib/storage.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/storage.ts)
- [lib/supabase-profile.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/supabase-profile.ts)
- [supabase/user_profiles.sql](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/supabase/user_profiles.sql)

Entregas:
- fluxo em etapas depois do cadastro
- escolha guiada de objetivo: memoria, atencao, rotina de treino, reforco pedagogico
- escolha de nivel percebido: iniciante, intermediario, avancado
- sugestao automatica de trilha inicial com base em idade e respostas

Criterios de pronto:
- novo usuario consegue terminar onboarding em menos de 2 minutos
- os dados ficam salvos localmente e no Supabase
- o dashboard passa a refletir objetivo e nivel inicial

### 2. Continuidade de Treino

Objetivo:
- permitir que o usuario retome de forma imediata a proxima acao recomendada

Novos dados:
- `lastRecommendedMode`
- `lastRecommendedChallengeId`
- `lastIncompleteSession`
- `resumePromptDismissedAt`

Arquivos principais:
- [components/Dashboard.tsx](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/components/Dashboard.tsx)
- [app/page.tsx](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/app/page.tsx)
- [lib/scoring.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/scoring.ts)
- [lib/training-insights.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/training-insights.ts)

Entregas:
- card `Continuar treino`
- CTA para retomar sessao interrompida ou proxima recomendacao
- destaque da ultima trilha e da meta sugerida

Criterios de pronto:
- login leva o usuario a uma recomendacao acionavel sem navegacao extra
- retomar treino funciona igual em modo local e online

### 3. Melhor Tratamento Offline e Sincronizacao Mais Robusta

Objetivo:
- reduzir perda de confianca quando o app alterna entre offline e online

Novos dados:
- `entityType`
- `entityId`
- `retryCount`
- `lastAttemptAt`
- `conflictStatus`

Arquivos principais:
- [lib/offline-store.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/offline-store.ts)
- [lib/app-repository.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/app-repository.ts)
- [app/page.tsx](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/app/page.tsx)
- [components/Dashboard.tsx](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/components/Dashboard.tsx)

Entregas:
- badge visivel de status: sincronizado, pendente, offline, erro
- fila offline com contagem, ultima sincronizacao e ultimo erro
- retries com backoff
- deteccao simples de conflito por timestamp
- reconciliacao segura para progresso, historico e ajuda

Criterios de pronto:
- usuario entende claramente se o dado foi salvo e sincronizado
- reconexao nao duplica historico nem sobrescreve progresso valido

## Fase 2

### 4. Plano de Treino Automatico por Perfil

Objetivo:
- gerar uma sequencia semanal coerente com idade, desempenho e meta informada

Novas entidades:
- `TrainingPlan`
- `TrainingPlanSession`
- `PlanGenerationReason`

Campos minimos:
- objetivo principal
- frequencia semanal
- modos priorizados
- dificuldade alvo
- sessao sugerida por dia
- data de geracao
- data de expiracao

Arquivos principais:
- [lib/types.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/types.ts)
- [lib/training-insights.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/training-insights.ts)
- [lib/product-management.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/product-management.ts)
- [components/Dashboard.tsx](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/components/Dashboard.tsx)
- [lib/storage.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/storage.ts)

Entregas:
- gerar plano semanal ao fim do onboarding
- recalcular plano com base nas ultimas sessoes
- mostrar progresso do plano na home
- permitir regenerar plano manualmente

Regras iniciais sugeridas:
- idade define audiencia e nivel base
- historico recente ajusta dificuldade
- baixa conclusao reduz carga
- tendencia de melhora libera desafios mais altos

Criterios de pronto:
- cada usuario ativo tem um plano valido
- plano muda de forma explicavel, nao aleatoria

### 5. Painel de Alertas Automaticos

Objetivo:
- destacar usuarios que precisam de acao clinica, pedagogica ou operacional

Base existente:
- o projeto ja tem estrutura de alerta em [lib/training-insights.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/training-insights.ts)

Novos alertas:
- usuario parado ha X dias
- queda brusca semanal
- excesso de erros por modo
- baixa conclusao persistente
- falhas de sincronizacao recorrentes

Arquivos principais:
- [lib/training-insights.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/training-insights.ts)
- [components/AdminScreen.tsx](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/components/AdminScreen.tsx)
- [app/api/admin/overview/route.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/app/api/admin/overview/route.ts)

Entregas:
- score de risco por usuario
- filtros por severidade e categoria
- recomendacao de acao ao lado do alerta
- opcao de marcar como acompanhado

Criterios de pronto:
- painel admin abre com prioridades visiveis sem leitura manual de todo o historico

### 6. Historico Administrativo Mais Completo

Objetivo:
- saber quem fez o que, quando, em qual contexto e com qual efeito

Mudancas em dados:
- ampliar `AdminAuditEntry` com:
- `metadata`
- `origin`
- `targetType`
- `beforeState`
- `afterState`

Arquivos principais:
- [lib/types.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/types.ts)
- [lib/storage.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/storage.ts)
- [components/AdminScreen.tsx](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/components/AdminScreen.tsx)

Entregas:
- log com filtros por ator, acao, usuario-alvo e periodo
- descricao padronizada por tipo de evento
- registro de estado anterior e novo para acoes sensiveis

Criterios de pronto:
- uma alteracao administrativa relevante pode ser auditada sem ambiguidade

## Fase 3

### 7. Comparacao Antes/Depois por Periodo de Intervencao

Objetivo:
- apoiar leitura clinica e pedagogica da evolucao apos um plano ou intervencao

Novas entidades:
- `InterventionWindow`
- `InterventionComparison`

Campos minimos:
- usuario
- data inicial
- data final
- objetivo
- tipo de intervencao
- modos analisados
- metricas antes
- metricas depois
- interpretacao resumida

Arquivos principais:
- [lib/types.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/types.ts)
- [lib/training-insights.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/training-insights.ts)
- [components/AdminScreen.tsx](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/components/AdminScreen.tsx)
- [lib/report-pdf.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/report-pdf.ts)

Entregas:
- seletor de periodo
- comparacao por score, conclusao, frequencia e tempo
- leitura resumida com linguagem tecnica e linguagem simplificada

Criterios de pronto:
- admin consegue exportar comparacao clara para acompanhamento

### 8. Auditoria de Integridade de Dados

Objetivo:
- detectar inconsistencias entre usuarios, progresso, historico e sincronizacao

Checagens iniciais:
- usuario sem progresso inicial
- progresso sem usuario correspondente
- historico sem usuario correspondente
- sessoes duplicadas
- timestamps fora de ordem
- itens na fila offline apontando para entidades inexistentes
- divergencia relevante entre snapshot local e remoto

Arquivos principais:
- [lib/app-repository.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/app-repository.ts)
- [lib/offline-store.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/offline-store.ts)
- novo modulo sugerido: `lib/data-integrity.ts`

Entregas:
- funcao de verificacao completa
- painel admin com contagem de inconsistencias
- acoes sugeridas: reconciliar, ignorar, revisar manualmente

Criterios de pronto:
- inconsistencias criticas ficam detectaveis sem inspecao manual no storage

### 9. Dashboard de Metricas Internas

Objetivo:
- entender uso real do produto e pontos de abandono

Novas entidades:
- `ProductEvent`
- `ProductMetricSnapshot`

Eventos minimos:
- login
- cadastro
- onboarding iniciado
- onboarding concluido
- treino iniciado
- treino concluido
- treino abandonado
- retomada de treino
- erro de sync
- sync concluida

Arquivos principais:
- [app/page.tsx](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/app/page.tsx)
- componentes de jogo em [components](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/components)
- novo modulo sugerido: `lib/product-analytics.ts`

Entregas:
- instrumentacao leve de eventos
- painel com jogos mais usados
- taxa de conclusao por modo
- pontos de abandono por tela ou fase

Criterios de pronto:
- o time consegue identificar o que engaja e onde o fluxo perde usuario

## Mudancas de Modelo de Dados

Novos tipos recomendados em [lib/types.ts](C:/Users/ckmso/OneDrive/Área%20de%20Trabalho/app-memoria/lib/types.ts):

- `TrainingGoal`
- `UserSelfReportedLevel`
- `UserOnboardingProfile`
- `TrainingPlan`
- `TrainingPlanSession`
- `InterventionWindow`
- `InterventionComparison`
- `DataIntegrityIssue`
- `ProductEvent`

Campos recomendados em `Usuario`:

- `onboardingCompletedAt?: string | null`
- `goal?: TrainingGoal | null`
- `selfReportedLevel?: "iniciante" | "intermediario" | "avancado" | null`
- `weeklyAvailability?: number | null`

## Rotas e Backend

Rotas novas recomendadas:

- `POST /api/admin/reset` ja existe
- `GET /api/admin/integrity`
- `GET /api/admin/metrics`
- `POST /api/admin/metrics/events`
- `POST /api/user/training-plan/generate`
- `GET /api/user/training-plan/:email`

SQLs novos recomendados em `supabase/`:

- `training_plans.sql`
- `training_plan_sessions.sql`
- `product_events.sql`
- `intervention_windows.sql`
- `admin_audit_log.sql`

## Testes Recomendados

Adicionar cobertura para:

- onboarding completo
- retomada de treino
- fila offline com reenvio
- conflito local x remoto
- geracao de plano semanal
- geracao de alertas
- validacao de integridade

Arquivos sugeridos:

- `tests/onboarding-flow.test.ts`
- `tests/offline-sync.test.ts`
- `tests/training-plan.test.ts`
- `tests/admin-alerts.test.ts`
- `tests/data-integrity.test.ts`

## Sequencia de Implementacao Recomendada

Sprint 1:
- tipos de onboarding
- persistencia de onboarding
- fluxo guiado apos cadastro
- card de continuar treino

Sprint 2:
- status visual de sincronizacao
- retries e reconciliacao basica
- ajuste do repositorio para conflitos simples

Sprint 3:
- tipos e persistencia de plano semanal
- geracao inicial de plano
- exibicao do plano no dashboard

Sprint 4:
- alertas automaticos
- historico admin expandido
- filtros no painel administrativo

Sprint 5:
- periodo de intervencao
- comparacao antes/depois
- exportacao de relatorio

Sprint 6:
- auditoria de integridade
- metricas internas
- painel de produto

## Primeiro Corte Recomendado

Se a execucao precisar comecar pequena, o melhor primeiro corte e:

- onboarding com `objetivo`, `nivel` e `frequencia`
- salvar esse perfil no `Usuario`
- gerar uma recomendacao semanal simples
- mostrar `Continuar treino`
- exibir status de sincronizacao no dashboard

Esse corte ja entrega valor para:

- adesao
- personalizacao
- confianca no salvamento
- base de dados para as fases seguintes
