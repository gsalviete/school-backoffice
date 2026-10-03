import type { Repos } from "@/data/repos";
import { podeProfessoraEditar } from "@/domain/chamada";
import type { DataCivil } from "@/domain/tipos";

export interface EntradaChamada {
  turmaId: string;
  data: DataCivil;
  faltasAlunoIds: string[];
  professoraId: string;
  hoje: DataCivil;
}

export type ResultadoChamada =
  | { ok: true; editada: boolean; totalAlunos: number; totalFaltas: number }
  | { ok: false; motivo: "turma-de-outra-professora" | "semana-anterior" };

/** Grava a chamada de uma professora, aplicando as regras de quem pode alterar o quê. */
export async function salvarChamada(
  repos: Repos,
  entrada: EntradaChamada,
  agora: Date = new Date(),
): Promise<ResultadoChamada> {
  const turma = await repos.turmas.buscar(entrada.turmaId);
  if (!turma || turma.professoraId !== entrada.professoraId) {
    return { ok: false, motivo: "turma-de-outra-professora" };
  }
  if (!podeProfessoraEditar(entrada.data, entrada.hoje)) return { ok: false, motivo: "semana-anterior" };

  const alunos = await repos.alunos.listarAtivosPorTurma(turma.id);
  const marcadas = new Set(entrada.faltasAlunoIds);
  // Só alunos ativos da turma podem ter falta — ids estranhos são descartados.
  const faltasAlunoIds = alunos.filter((a) => marcadas.has(a.id)).map((a) => a.id);

  const editada = (await repos.chamadas.buscar(turma.id, entrada.data)) !== undefined;
  await repos.chamadas.salvar({
    turmaId: turma.id,
    data: entrada.data,
    faltasAlunoIds,
    registradaPor: entrada.professoraId,
    atualizadaEm: agora.toISOString(),
  });
  return { ok: true, editada, totalAlunos: alunos.length, totalFaltas: faltasAlunoIds.length };
}
