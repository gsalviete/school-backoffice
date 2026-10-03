---
id: TASK-001
title: "[DX] Criar esqueleto Next.js da POC com dados em memória"
status: in-progress
parent: docs/product/backoffice-escola-v1.md#scope
labels: [poc, setup, frontend]
priority: 3
blocked_by: []
created: 2026-10-02
---

# [DX] Criar esqueleto Next.js da POC com dados em memória

## What this card solves

A fase 1 é uma POC navegável no celular para testar a facilidade de uso com professoras e secretária antes de investir em banco e login de verdade. Este card cria a base que os três cards de tela (chamada, visão "Hoje", mensalidades) usam: o app Next.js, o modelo de domínio, os dados de exemplo e um "entrar como" que simula o login.

A peça central é uma **camada de repositório**: interfaces (`AlunoRepo`, `TurmaRepo`, `ChamadaRepo`, `MensalidadeRepo`…) com uma implementação **em memória** alimentada por dados de exemplo. As telas só falam com essas interfaces. Na fase 2, o Prisma/Postgres entra como outra implementação, sem reescrever as telas. Alternativa rejeitada: dados mock espalhados direto nos componentes. É mais rápido hoje, mas joga a POC fora na fase 2.

O "entrar como" é uma tela com botões grandes ("Professora Ana", "Secretária", "Direção"...) que grava uma sessão simulada num cookie de longa duração. Com isso dá para testar o "abre no dia seguinte e já está dentro" sem auth real.

## Test criteria

```ts
// Vitest — src/domain/**/*.test.ts
describe("repositório em memória", () => {
  it("lista só as turmas da professora", () => {
    // Arrange: seed com professora P1 vinculada às turmas T1 e T2; T3 é de outra professora
    // Act: turmaRepo.listarPorProfessora("P1")
    // Assert: expect(ids).toEqual(["T1", "T2"])
  });
  it("lista só alunos ativos da turma", () => {
    // Arrange: T1 com 20 alunos ativos e 1 desativado
    // Act: alunoRepo.listarAtivosPorTurma("T1")
    // Assert: expect(lista).toHaveLength(20); o desativado não aparece
  });
  it("seed tem a escala do produto", () => {
    // Assert: 10 turmas, entre 150 e 200 alunos, ao menos 1 professora com 2+ turmas, 1 secretária, 1 direção
  });
});

// Playwright — e2e/sessao.spec.ts (viewport de celular, ex.: iPhone 13)
describe("entrar como (sessão simulada)", () => {
  it("lembra a usuária após fechar e reabrir", () => {
    // Arrange: escolhe "Professora Ana" na tela de entrada
    // Act: novo page no mesmo contexto (mesmos cookies), abre "/"
    // Assert: não mostra a tela de entrada; cookie de sessão com expiração >= 30 dias
  });
  it("professora não acessa rotas de secretaria", () => {
    // Arrange: sessão de professora
    // Act: goto("/mensalidades")
    // Assert: redireciona para a home da professora; nenhum texto "Mensalidade" na página
  });
  it("sair volta para a tela de entrada", () => {});
});
```

## Implementation plan

Repositório novo, ainda sem código. O executor cria a estrutura; nenhum arquivo existente para citar.

- **Stack** (decidida pelo usuário): Next.js (App Router) + TypeScript estrito. Vitest para unidade, Playwright para e2e com viewport de celular. ESLint + `tsc --noEmit`. Prisma **não** entra neste card (fase 2).
- **Domínio** (`src/domain/`): tipos `Professora`, `Turma`, `Aluno` (nome, turmaId, responsável, telefone, ativo), `Chamada` (turmaId, data, faltasAlunoIds, registradaPor, atualizadaEm), `Mensalidade` (alunoId, competência AAAA-MM, valor, vencimento, pagaEm?). Só os campos do doc de produto, nada além (LGPD).
- **Repositórios** (`src/data/`): interfaces + `memory/` com a implementação em memória. Estado no módulo do servidor, reiniciado no restart. Isso é aceitável na POC e deve ficar escrito num comentário.
- **Seed** (`src/data/memory/seed.ts`): 10 turmas, ~180 alunos com nomes fictícios e telefones fictícios (`(11) 90000-00xx`), ~10 professoras (uma com 2 turmas), chamadas das últimas 4 semanas com algumas faltas, incluindo aluno com exatamente 4 e outro com 5 faltas no mês corrente, e mensalidades dos meses do ano até o atual com pagas e em aberto.
- **Configuração da escola** (`src/config/escola.ts`): `VALOR_MENSALIDADE` e `DIA_VENCIMENTO` como **placeholders** (ex.: 500,00 e dia 10), com comentário apontando a pergunta aberta no doc de produto.
- **Sessão simulada**: rota `/entrar` com botões grandes por usuária do seed; cookie httpOnly `sessao` com id + perfil e `maxAge` de 400 dias. Middleware redireciona por perfil: professora → `/chamada`, secretária/direção → `/hoje`. Rotas `/hoje` e `/mensalidades` exigem perfil secretária ou direção.
- **Layout base**: fonte base ≥ 18px, alvos de toque ≥ 48px, alto contraste, textos em português do dia a dia. Manifest PWA (nome, ícone, `display: standalone`) para "adicionar à tela inicial". Service worker offline **não** (fora de escopo).
- **Logger**: `pino` conforme `docs/agents/observability.md`. É dependência nova: **perguntar ao usuário a versão antes de instalar** (guardrails).
- **Validação**: criar scripts `lint`, `typecheck`, `test` (Vitest) e `test:e2e` (Playwright) no `package.json` e **atualizar `docs/agents/validation.md`** com eles (hoje está `none`).
- **Estimativa**: ~350 linhas de produção, excluindo código gerado pelo `create-next-app`, testes e seed. Orçamento: 500.
- **Fora deste card**: as telas de chamada, "Hoje" e mensalidades (TASK-002..004), Prisma, auth real, cadastro e importação de planilha (fase 2).

## Attention points

- **Dados fictícios apenas**: seed nunca com nomes ou telefones reais de alunos. São dados de menores (LGPD).
- **Sessão simulada não é segurança**: qualquer um escolhe qualquer perfil. A POC não pode ser publicada com dados reais. Deixar aviso visível ("Versão de teste") no rodapé.
- ❌ Componentes importando `memory/` diretamente: só via interfaces. Senão a troca para Prisma na fase 2 vira reescrita.
- ❌ Lógica de regra (semana corrente, atraso, limite de faltas) dentro de componentes. Ela vai em `src/domain/` como funções puras, testáveis.
- Estado em memória some a cada deploy/restart. Aceitável para teste com usuárias, mas avisar quem conduzir o teste.
- Rollback: card aditivo em repo vazio, sem rollback necessário.

## Observability

- Logger `pino` configurado (JSON em produção, pretty em dev), com um helper `log` único importado pelo app.
- Logar `session_started` (info) com `{ perfil, usuarioId }` ao entrar e `session_ended` ao sair. **Nunca** logar nome de aluno, responsável ou telefone, só ids.
- Sem dashboards/alertas: `platform: none` em `docs/agents/observability.md`.
