---
id: TASK-003
title: "[FEAT] Criar visão \"Hoje\" e lista de muitas faltas"
status: todo
parent: docs/product/backoffice-escola-v1.md#scope
labels: [poc, frontend, frequencia]
priority: 3
blocked_by: [TASK-001]
created: 2026-10-02
---

# [FEAT] Criar visão "Hoje" e lista de muitas faltas

## What this card solves

Hoje a secretária e a direção não conseguem ver a situação geral sem juntar as folhas de papel. Este card entrega a tela inicial delas, "Hoje", com duas respostas imediatas: **quem faltou hoje em cada turma** e **quais turmas ainda não fizeram a chamada**. Na mesma área fica a lista de **alunos com 5 ou mais faltas no mês**, para a escola agir cedo.

Os dados vêm do repositório de chamadas (TASK-001). O seed já traz chamadas, então o card é verificável sozinho, sem depender da tela de chamada (TASK-002).

Alternativa rejeitada: relatório mensal em tabela de percentuais. Não foi pedido, é mais difícil de ler e não responde "quem faltou hoje".

## Test criteria

```ts
// Vitest — src/domain/frequencia.test.ts
describe("resumo do dia", () => {
  it("separa turmas feitas e pendentes", () => {
    // Arrange: 10 turmas; chamadas de hoje em T1, T2, T3
    // Act: resumoDoDia(hoje)
    // Assert: expect(r.feitas.map(t => t.id)).toEqual(["T1","T2","T3"]); expect(r.pendentes).toHaveLength(7)
  });
  it("lista os faltosos de cada turma feita", () => {
    // Arrange: T1 com faltas [A1, A2]
    // Assert: expect(r.feitas[0].faltosos.map(a => a.id)).toEqual(["A1","A2"])
  });
});

describe("muitas faltas no mês", () => {
  it("aluno com 5 faltas no mês aparece", () => {
    // Arrange: aluno X com 5 faltas em outubro/2026; hoje = 2026-10-20
    // Assert: expect(alunosComMuitasFaltas(hoje).map(a => a.id)).toContain("X")
  });
  it("aluno com 4 faltas no mês não aparece", () => {
    // Assert: não contém "Y" (4 faltas)
  });
  it("faltas do mês anterior não contam", () => {
    // Arrange: Z com 3 faltas em setembro e 2 em outubro
    // Assert: não contém "Z"
  });
  it("aluno desativado não aparece", () => {});
});

// Playwright — e2e/hoje.spec.ts (viewport desktop e celular)
describe("tela Hoje", () => {
  it("secretária vê faltas de 3 turmas e 7 pendentes", () => {
    // Arrange: sessão secretária; seed com 3 chamadas hoje
    // Assert: seção "Já fizeram a chamada" com 3 turmas e seus faltosos; "Ainda não fizeram" com 7 turmas
  });
  it("direção vê a mesma tela", () => {});
  it("professora não acessa /hoje", () => {
    // Assert: redireciona para /chamada
  });
});
```

## Implementation plan

Greenfield repo: os arquivos virão do TASK-001; não há código existente para citar.

- **Regras puras** em `src/domain/frequencia.ts`: `resumoDoDia(data)` e `alunosComMuitasFaltas(data, limite = LIMITE_FALTAS_MES)`, com `LIMITE_FALTAS_MES = 5` em `src/config/escola.ts`. Mês = mês civil da data, no fuso `America/Sao_Paulo`.
- **Rota** `/hoje` (perfil secretária/direção): três blocos em ordem. (1) "Ainda não fizeram a chamada": lista de turmas com nome da professora. (2) "Faltaram hoje": por turma, nomes dos alunos que faltaram. (3) "Muitas faltas este mês (5 ou mais)": nome, turma e número de faltas, com o maior primeiro. Responsável e telefone aparecem ao tocar no aluno, para a secretária poder ligar.
- **Desktop + celular**: uma coluna no celular, duas no desktop. Nada de tabela com rolagem horizontal.
- **Validação**: `npm run lint && npm run typecheck && npm run test && npm run test:e2e`.
- **Estimativa**: ~250 linhas de produção. Orçamento: 500.
- **Fora deste card**: feriados/dias sem aula (pergunta aberta), histórico por aluno, exportar/imprimir, envio de mensagem a responsáveis.

## Attention points

- **Fim de semana e feriados**: pergunta aberta no doc de produto. Na POC, em sábado/domingo a seção "Ainda não fizeram" mostra "Hoje não tem aula" em vez de 10 turmas pendentes. Feriados ficam fora; registrar no PR.
- **Dados pessoais**: telefone do responsável só para secretária/direção e só sob demanda (toque), nunca na lista geral (LGPD, minimização).
- ❌ Contar faltas com datas em UTC: falta de 31/10 às 22h não pode cair em novembro.
- ❌ Calcular os agregados no componente: usar as funções puras de `src/domain`.
- Aditivo sobre o TASK-001, sem rollback necessário.

## Observability

- `today_view_opened` (info): `{ perfil, turmasPendentes, turmasFeitas, alunosMuitasFaltas }`. Só contagens, sem nomes.
- `guardian_contact_viewed` (info): `{ alunoId, usuarioId }`. É a trilha de acesso a dado pessoal de menor (LGPD).
- Sem dashboards/alertas (`platform: none`).
