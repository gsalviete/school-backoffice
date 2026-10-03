"use server";

import { revalidatePath } from "next/cache";
import { repos } from "@/data";
import { log } from "@/lib/log";
import { hoje } from "@/lib/relogio";
import { exigirPerfil } from "@/lib/sessao";
import { salvarChamada } from "@/servicos/chamada";

export type RespostaSalvar = { ok: true } | { ok: false; mensagem: string };

const MENSAGENS = {
  "semana-anterior": "Só a secretaria pode alterar esta chamada.",
  "turma-de-outra-professora": "Esta turma não é sua.",
} as const;

export async function salvarChamadaAction(turmaId: string, data: string, faltasAlunoIds: string[]): Promise<RespostaSalvar> {
  const professora = await exigirPerfil("professora");
  const r = await salvarChamada(repos(), { turmaId, data, faltasAlunoIds, professoraId: professora.id, hoje: hoje() });

  if (!r.ok) {
    const evento = r.motivo === "semana-anterior" ? "attendance_edit_denied" : "attendance_save_failed";
    const nivel = r.motivo === "semana-anterior" ? "info" : "warn";
    log[nivel]({ evento, turmaId, data, motivo: r.motivo, professoraId: professora.id }, evento);
    return { ok: false, mensagem: MENSAGENS[r.motivo] };
  }

  log.info(
    {
      evento: "attendance_saved",
      turmaId,
      data,
      totalAlunos: r.totalAlunos,
      totalFaltas: r.totalFaltas,
      editada: r.editada,
      professoraId: professora.id,
    },
    "attendance_saved",
  );
  revalidatePath("/chamada", "layout");
  return { ok: true };
}
