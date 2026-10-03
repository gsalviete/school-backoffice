import pino from "pino";

// Logger único do app (docs/agents/observability.md): JSON em produção, legível em dev.
// Eventos em snake_case. NUNCA logar nome de aluno, responsável ou telefone — só ids.

export const log = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(process.env.NODE_ENV === "development" ? { transport: { target: "pino-pretty" } } : {}),
});
