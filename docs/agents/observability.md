# Observability

Logs estruturados, sem plataforma de dashboards/alertas por enquanto. Logs lidos no painel da hospedagem.
Adicionar o `pino` é dependência nova — a versão é confirmada com o usuário no card que o introduz.

```
platform: none
logger: pino                   # Node — logger estruturado (decidido pelo usuário em 2026-10-02)
conventions: eventos em snake_case com domínio como prefixo (ex.: attendance_saved, payment_marked_paid); nunca logar nome de aluno/responsável/telefone — só ids
```
