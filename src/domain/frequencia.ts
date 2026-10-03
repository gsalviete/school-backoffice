import { LIMITE_FALTAS_MES } from "@/config/escola";
import { ehDiaUtil } from "./datas";
import type { Aluno, Chamada, DataCivil, Turma } from "./tipos";

// Agregados de frequência para a visão "Hoje". Puro: recebe os dados, não acessa repositório.
// Datas de chamada já são civis no fuso da escola (ver datas.ts) — o mês sai direto de "AAAA-MM".

export interface DadosFrequencia {
  turmas: readonly Turma[];
  alunos: readonly Aluno[];
  chamadas: readonly Chamada[];
}

/** Só o necessário para listar; responsável e telefone ficam fora (LGPD: só sob demanda). */
export type AlunoResumo = Pick<Aluno, "id" | "nome">;

export interface TurmaFeita extends Turma {
  faltosos: AlunoResumo[];
}

export interface ResumoDoDia {
  /** Falso em sábado/domingo. Feriados não são considerados (pergunta aberta). */
  temAula: boolean;
  feitas: TurmaFeita[];
  pendentes: Turma[];
}

export interface AlunoComFaltas extends AlunoResumo {
  turmaId: string;
  faltas: number;
}

export function resumoDoDia(dia: DataCivil, { turmas, alunos, chamadas }: DadosFrequencia): ResumoDoDia {
  const chamadasDoDia = new Map(chamadas.filter((c) => c.data === dia).map((c) => [c.turmaId, c]));
  const feitas: TurmaFeita[] = [];
  const pendentes: Turma[] = [];

  for (const turma of turmas) {
    const chamada = chamadasDoDia.get(turma.id);
    if (!chamada) {
      pendentes.push(turma);
      continue;
    }
    const faltaram = new Set(chamada.faltasAlunoIds);
    const faltosos = alunos.filter((a) => faltaram.has(a.id)).map(({ id, nome }) => ({ id, nome }));
    feitas.push({ ...turma, faltosos });
  }

  const temAula = ehDiaUtil(dia);
  return { temAula, feitas, pendentes: temAula ? pendentes : [] };
}

/** Alunos ativos com `limite` ou mais faltas no mês civil de `dia`, do maior número para o menor. */
export function alunosComMuitasFaltas(
  dia: DataCivil,
  { alunos, chamadas }: Pick<DadosFrequencia, "alunos" | "chamadas">,
  limite: number = LIMITE_FALTAS_MES,
): AlunoComFaltas[] {
  const mes = dia.slice(0, 7);
  const contagem = new Map<string, number>();
  for (const c of chamadas) {
    if (c.data.slice(0, 7) !== mes || c.data > dia) continue;
    for (const id of c.faltasAlunoIds) contagem.set(id, (contagem.get(id) ?? 0) + 1);
  }

  return alunos
    .filter((a) => a.ativo && (contagem.get(a.id) ?? 0) >= limite)
    .map(({ id, nome, turmaId }) => ({ id, nome, turmaId, faltas: contagem.get(id)! }))
    .sort((a, b) => b.faltas - a.faltas || a.nome.localeCompare(b.nome, "pt-BR"));
}
