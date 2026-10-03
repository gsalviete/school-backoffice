"use server";

import { revalidatePath } from "next/cache";
import { repos } from "@/data";
import type { Usuario } from "@/domain/tipos";
import { log } from "@/lib/log";
import { hoje } from "@/lib/relogio";
import { usuarioDaSessao } from "@/lib/sessao";
import { desfazerPagamento, marcarComoPaga, type ResultadoPagamento } from "@/servicos/mensalidades";

export type RespostaPagamento = { ok: true } | { ok: false; mensagem: string };

const MENSAGENS = {
  "sem-permissao": "Só a secretaria e a direção registram pagamentos.",
  "nao-encontrada": "Mensalidade não encontrada. Atualize a página.",
  "data-invalida": "Data inválida.",
  "data-futura": "A data do pagamento não pode ser no futuro.",
} as const;

// Controle de acesso aqui no servidor (o serviço recusa professora) — esconder o menu não basta.
// Sem `exigirPerfil` de propósito: a tentativa negada precisa ficar no log antes de responder.
function negado(usuario: Usuario | undefined, acao: string, r: Extract<ResultadoPagamento, { ok: false }>) {
  if (r.motivo === "sem-permissao") {
    log.warn(
      { evento: "payment_action_denied", usuarioId: usuario?.id ?? null, perfil: usuario?.perfil ?? null, acao },
      "payment_action_denied",
    );
  }
  return { ok: false as const, mensagem: MENSAGENS[r.motivo] };
}

const SEM_SESSAO = { ok: false, motivo: "sem-permissao" } as const;

export async function marcarPagaAction(mensalidadeId: string, data: string): Promise<RespostaPagamento> {
  const usuario = await usuarioDaSessao();
  const r = usuario ? await marcarComoPaga(repos(), { id: mensalidadeId, data, hoje: hoje(), usuario }) : SEM_SESSAO;
  if (!r.ok) return negado(usuario, "marcar-paga", r);

  const m = r.mensalidade;
  log.info(
    {
      evento: "payment_marked_paid",
      mensalidadeId: m.id,
      alunoId: m.alunoId,
      competencia: m.competencia,
      pagaEm: m.pagaEm,
      usuarioId: usuario!.id,
    },
    "payment_marked_paid",
  );
  revalidatePath("/mensalidades");
  return { ok: true };
}

export async function desfazerPagamentoAction(mensalidadeId: string): Promise<RespostaPagamento> {
  const usuario = await usuarioDaSessao();
  const r = usuario ? await desfazerPagamento(repos(), { id: mensalidadeId, usuario }) : SEM_SESSAO;
  if (!r.ok) return negado(usuario, "desfazer-pagamento", r);

  const m = r.mensalidade;
  log.info(
    { evento: "payment_unmarked", mensalidadeId: m.id, alunoId: m.alunoId, competencia: m.competencia, usuarioId: usuario!.id },
    "payment_unmarked",
  );
  revalidatePath("/mensalidades");
  return { ok: true };
}
