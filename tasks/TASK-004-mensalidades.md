---
id: TASK-004
title: "[FEAT] Criar tela de mensalidades em aberto e registro de pagamento"
status: in-progress
parent: docs/product/backoffice-escola-v1.md#scope
labels: [poc, frontend, mensalidades]
priority: 3
blocked_by: [TASK-001]
created: 2026-10-02
---

# [FEAT] Criar tela de mensalidades em aberto e registro de pagamento

## What this card solves

A secretária precisa responder "quem está com a mensalidade atrasada?" em menos de 1 minuto, coisa que hoje exige revirar o caderno. Este card entrega a tela "Mensalidades" (só para secretária e direção). Ela lista as mensalidades **em aberto**, com as atrasadas primeiro e "em atraso há X dias". Também permite **marcar como paga** com a data (padrão: hoje) e **desfazer** um pagamento marcado por engano.

Regras do produto: valor único para todos, sem desconto, bolsa ou isenção. **Todos os 12 meses geram mensalidade**. Aluno desativado não gera novas mensalidades. Não há cálculo de multa/juros nem pagamento parcial.

Na POC, as mensalidades são geradas sob demanda: ao consultar, o sistema garante que cada aluno ativo tem a mensalidade de cada mês até o atual. A alternativa rejeitada, um job mensal agendado, exige infraestrutura que só faz sentido na fase 2.

## Test criteria

```ts
// Vitest — src/domain/mensalidades.test.ts
describe("geração de mensalidades", () => {
  it.each(["2026-01", "2026-07", "2026-12"])("aluno ativo tem mensalidade em %s", (competencia) => {
    // Act: garantirMensalidades(até = competencia)
    // Assert: mensalidade do aluno em `competencia` existe, valor === VALOR_MENSALIDADE, pagaEm === undefined
  });
  it("não duplica ao chamar duas vezes", () => {
    // Assert: 1 mensalidade por aluno por competência
  });
  it("aluno desativado não gera novas mensalidades", () => {
    // Arrange: aluno desativado em 2026-09
    // Assert: tem 2026-09, não tem 2026-10
  });
});

describe("atraso", () => {
  it("em aberto após o vencimento mostra dias de atraso", () => {
    // Arrange: vencimento 2026-10-10; hoje 2026-10-15
    // Assert: expect(situacao(m, hoje)).toEqual({ tipo: "atrasada", dias: 5 })
  });
  it("no dia do vencimento ainda não está atrasada", () => {
    // Assert: expect(situacao(m, "2026-10-10").tipo).toBe("em-aberto")
  });
});

describe("pagamento", () => {
  it("marcar como paga registra a data informada e sai da lista", () => {
    // Act: marcarComoPaga(m.id, "2026-10-14")
    // Assert: pagaEm === "2026-10-14"; listarEmAberto() não contém m
  });
  it("desfazer volta para em aberto", () => {
    // Act: desfazerPagamento(m.id)
    // Assert: pagaEm === undefined; listarEmAberto() contém m
  });
  it("data de pagamento no futuro é rejeitada", () => {});
});

// Playwright — e2e/mensalidades.spec.ts (viewport desktop)
describe("tela Mensalidades", () => {
  it("atrasadas aparecem primeiro com 'em atraso há X dias'", () => {});
  it("marcar paga em 2 toques (Marcar paga → Confirmar com data de hoje)", () => {
    // Assert: mensagem "Pagamento registrado"; linha some da lista; aparece "Desfazer"
  });
  it("desfazer pagamento recém-marcado", () => {});
  it("professora não vê mensalidades", () => {
    // Arrange: sessão professora; Act: goto("/mensalidades")
    // Assert: redireciona para /chamada; nenhum texto "Mensalidade" ou "R$"
  });
});
```

## Implementation plan

Greenfield repo: os arquivos virão do TASK-001; não há código existente para citar.

- **Regras puras** em `src/domain/mensalidades.ts`: `garantirMensalidades(ate)`, `situacao(mensalidade, hoje)`, `marcarComoPaga(id, data)`, `desfazerPagamento(id)`. Competência no formato `AAAA-MM`. Vencimento = `DIA_VENCIMENTO` da competência (placeholder em `src/config/escola.ts`, de TASK-001). Valor = `VALOR_MENSALIDADE`, em centavos (inteiro).
- **Rota** `/mensalidades` (perfil secretária/direção): lista com aluno, turma, mês ("Outubro/2026"), valor em R$ e situação ("Vence dia 10" / "Em atraso há 5 dias"), atrasadas primeiro. Busca por nome do aluno no topo. Botão "Marcar como paga" abre um painel com a data (padrão hoje, editável) e "Confirmar". Após confirmar, aviso "Pagamento registrado" com botão "Desfazer". Seção recolhida "Pagas recentemente", onde também dá para desfazer.
- Item de menu "Mensalidades" visível só para secretária/direção.
- **Validação**: `npm run lint && npm run typecheck && npm run test && npm run test:e2e`.
- **Estimativa**: ~350 linhas de produção. Orçamento: 500.
- **Fora deste card**: multa/juros, pagamento parcial, forma de pagamento, recibo, cobrança automática, aluno que entra/sai no meio do mês (pergunta aberta: na POC, cobra o mês cheio).

## Attention points

- **Valor e vencimento são placeholders** (pergunta aberta para a direção). Não espalhar o número pelo código, só via `src/config/escola.ts`.
- **Dinheiro em centavos (inteiro)**, formatado com `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`. ❌ `number` com casas decimais para valores.
- **Datas no fuso `America/Sao_Paulo`**: o cálculo de dias de atraso usa datas civis, não timestamps.
- **Controle de acesso no servidor**, não só escondendo o menu: a server action de pagamento rejeita perfil professora.
- "12 meses cobrados" é decisão "por enquanto": manter a regra num único ponto (`garantirMensalidades`) para ser fácil de mudar.
- Aditivo sobre o TASK-001, sem rollback necessário.

## Observability

- `payment_marked_paid` (info): `{ mensalidadeId, alunoId, competencia, pagaEm, usuarioId }`.
- `payment_unmarked` (info): `{ mensalidadeId, alunoId, competencia, usuarioId }`. É a trilha de auditoria do "desfazer".
- `payment_action_denied` (warn): `{ usuarioId, perfil, acao }` quando perfil não autorizado tenta a ação.
- Sem valores pessoais além de ids. Sem dashboards/alertas (`platform: none`).
