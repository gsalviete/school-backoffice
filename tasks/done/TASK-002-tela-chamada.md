---
id: TASK-002
title: "[FEAT] Criar tela de chamada da professora"
status: done
parent: docs/product/backoffice-escola-v1.md#scope
labels: [poc, frontend, chamada]
priority: 3
blocked_by: [TASK-001]
created: 2026-10-02
---

# [FEAT] Criar tela de chamada da professora

## What this card solves

É o coração da POC e o ponto de maior risco de adoção: a professora precisa fazer a chamada no próprio celular, na sala, mais rápido que no papel. Se isso não for fácil, nada mais importa.

A tela mostra a lista da turma com **todos já marcados como presentes**. A professora toca só em quem faltou e toca em "Salvar". Quem tem uma turma cai direto na chamada; quem tem várias vê primeiro as suas turmas, cada uma indicando se a chamada de hoje já foi feita. Ela pode reabrir e corrigir chamadas da semana corrente; semanas anteriores aparecem só para leitura, com a mensagem de que só a secretária altera.

Alternativa rejeitada: marcar presença aluno a aluno (todos começam "sem marcação"). São 20 toques por turma em vez de 2–3, e isso contradiz a prioridade de poucos cliques.

## Test criteria

```ts
// Vitest — src/domain/chamada.test.ts
describe("regra de correção da chamada", () => {
  it("professora corrige chamada da mesma semana", () => {
    // Arrange: chamada de segunda 2026-10-05; hoje = quarta 2026-10-07
    // Act/Assert: expect(podeProfessoraEditar(chamada, hoje)).toBe(true)
  });
  it("professora não corrige chamada da semana anterior", () => {
    // Arrange: chamada de sexta 2026-10-02; hoje = segunda 2026-10-05
    // Assert: expect(podeProfessoraEditar(chamada, hoje)).toBe(false)
  });
  it("salvar sem faltas grava todos presentes", () => {
    // Act: salvarChamada({ turmaId: "T1", data, faltas: [] })
    // Assert: expect(chamada.faltasAlunoIds).toEqual([]); turma conta como "feita hoje"
  });
  it("salvar de novo no mesmo dia substitui, não duplica", () => {
    // Assert: chamadaRepo.listarPorTurmaEData("T1", hoje) tem length 1
  });
});

// Playwright — e2e/chamada.spec.ts (viewport de celular)
describe("chamada da professora", () => {
  it("professora de 1 turma entra direto na chamada", () => {
    // Arrange: sessão "Professora com 1 turma"; Act: goto("/")
    // Assert: URL /chamada/T1; título com nome da turma e data de hoje
  });
  it("turma de 20 alunos com 2 faltas: no máximo 4 toques", () => {
    // Arrange: professora de 1 turma, já na tela inicial do app
    // Act: contar cliques: abrir chamada (≤1), tocar aluno A, tocar aluno B, "Salvar"
    // Assert: cliques <= 4; mensagem "Chamada salva"; repo tem faltas [A, B]
  });
  it("professora de 2 turmas vê só as suas, com status de hoje", () => {
    // Arrange: P1 com T1 (chamada feita hoje) e T2 (não feita)
    // Assert: 2 cartões; T1 "Feita ✓", T2 "Falta fazer"; nenhuma turma de outra professora
  });
  it("chamada da semana anterior é só leitura", () => {
    // Assert: alunos não clicáveis; texto "Só a secretaria pode alterar esta chamada"
  });
  it("falha de conexão ao salvar mantém as marcações", () => {
    // Arrange: page.route intercepta a server action e aborta
    // Act: marca 2 faltas, "Salvar"
    // Assert: aviso "Não conseguimos salvar. Verifique a internet e tente de novo."; as 2 faltas continuam marcadas; botão "Tentar de novo" salva com sucesso após liberar a rota
  });
});
```

## Implementation plan

Greenfield repo: os arquivos virão do TASK-001; não há código existente para citar. Seguir a estrutura criada lá (`src/domain`, `src/data`, interfaces de repositório).

- **Regras puras** em `src/domain/chamada.ts`: `podeProfessoraEditar(chamada, hoje)` com semana de **segunda a domingo** (ver Attention points), `statusDoDia(turma, hoje)`.
- **Rotas**: `/chamada` (lista de turmas da professora; redireciona para `/chamada/[turmaId]` se houver uma só) e `/chamada/[turmaId]?data=AAAA-MM-DD` (padrão: hoje).
- **Tela**: lista vertical de nomes grandes. Tocar alterna "Presente" ↔ "Faltou" (cor + palavra, não só cor). Contador fixo no rodapé ("2 faltas") e botão "Salvar" grande. Navegação para dias anteriores da semana com setas "Dia anterior / Próximo dia".
- **Salvar**: server action chamando `ChamadaRepo.salvar` (upsert por turma+data). Estado de marcação mantido no cliente até a confirmação; em erro, exibir aviso e botão "Tentar de novo" sem limpar o estado.
- **Validação**: `npm run lint && npm run typecheck && npm run test && npm run test:e2e` (scripts criados no TASK-001).
- **Estimativa**: ~350 linhas de produção. Orçamento: 500.
- **Fora deste card**: correção de semanas anteriores pela secretária (fase 2), feriados/dias sem aula, falta justificada, modo offline.

## Attention points

- **"Semana corrente" assumida como segunda a domingo**: o doc de produto não define. Registrar a premissa no código e no PR; a secretária confirma no teste com usuárias.
- **Data de "hoje" no fuso de São Paulo** (`America/Sao_Paulo`), não UTC. Chamada feita às 22h não pode cair no dia seguinte. Testar com relógio fixo.
- ❌ Cor como único indicador de falta: usar texto "Faltou" junto (acessibilidade, público 40+).
- ❌ Confirmação modal do tipo "Tem certeza?" ao salvar: um toque a mais sem ganho, e a correção na semana já cobre erros.
- Linguagem: "Chamada salva", "Falta fazer", nunca "registro persistido", "erro 500" etc.
- Aditivo sobre o TASK-001, sem rollback necessário.

## Observability

- `attendance_saved` (info): `{ turmaId, data, totalAlunos, totalFaltas, editada: boolean, professoraId }`. Sem nomes de alunos.
- `attendance_save_failed` (warn): `{ turmaId, data, motivo }`.
- `attendance_edit_denied` (info): `{ turmaId, data, professoraId }` quando tenta editar semana anterior.
- Sem dashboards/alertas (`platform: none`). Esses eventos já permitem medir o critério de sucesso "≥ 90% dos dias com chamada" quando houver plataforma.
