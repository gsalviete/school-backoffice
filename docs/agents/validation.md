# Validation

Comandos do projeto (Next.js + TypeScript, pnpm). Todos devem passar antes de um card ir para `done`.
`test:e2e` faz `pnpm build` e sobe o app na porta 3100 (ou reaproveita um servidor já rodando nela fora de CI).
Primeira execução numa máquina nova: `pnpm exec playwright install chromium`.

```
lint: pnpm lint
typecheck: pnpm typecheck
test: pnpm test
test_e2e: pnpm test:e2e
pr_size_budget: 500            # máx. de linhas de produção alteradas por PR (testes/fixtures/gerado não contam)
guidelines: AGENTS.md
```
