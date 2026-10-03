import { describe, expect, it } from "vitest";
import { hojeEmSaoPaulo } from "./datas";
import { alunosComMuitasFaltas, resumoDoDia, type DadosFrequencia } from "./frequencia";
import type { Aluno, Chamada, DataCivil, Turma } from "./tipos";

const HOJE = "2026-10-20"; // terça

const turmas: Turma[] = Array.from({ length: 10 }, (_, i) => ({
  id: `T${i + 1}`,
  nome: `Turma ${i + 1}`,
  professoraId: `P${i + 1}`,
}));

function aluno(id: string, turmaId = "T1", ativo = true): Aluno {
  return { id, nome: `Aluno ${id}`, turmaId, responsavelNome: "Resp", responsavelTelefone: "(11) 90000-0000", ativo };
}

function chamada(turmaId: string, data: DataCivil, faltasAlunoIds: string[] = []): Chamada {
  return { turmaId, data, faltasAlunoIds, registradaPor: "P1", atualizadaEm: `${data}T11:00:00.000Z` };
}

/** Uma chamada da turma do aluno em cada data, com o aluno faltando. */
function faltas(a: Aluno, datas: DataCivil[]): Chamada[] {
  return datas.map((d) => chamada(a.turmaId, d, [a.id]));
}

describe("resumo do dia", () => {
  const alunos = [aluno("A1"), aluno("A2"), aluno("A3"), aluno("B1", "T2")];
  const dados: DadosFrequencia = {
    turmas,
    alunos,
    chamadas: [
      // Fora de ordem de propósito, e com uma chamada de outro dia que não pode contar.
      chamada("T3", HOJE),
      chamada("T1", HOJE, ["A2", "A1"]),
      chamada("T2", HOJE, ["B1"]),
      chamada("T4", "2026-10-19", []),
    ],
  };

  it("separa turmas feitas e pendentes", () => {
    const r = resumoDoDia(HOJE, dados);
    expect(r.feitas.map((t) => t.id)).toEqual(["T1", "T2", "T3"]);
    expect(r.pendentes).toHaveLength(7);
    expect(r.pendentes.map((t) => t.id)).not.toContain("T1");
  });

  it("lista os faltosos de cada turma feita", () => {
    const r = resumoDoDia(HOJE, dados);
    expect(r.feitas[0]!.faltosos.map((a) => a.id)).toEqual(["A1", "A2"]);
    expect(r.feitas[2]!.faltosos).toEqual([]);
  });

  it("faltosos não expõem dados do responsável", () => {
    const r = resumoDoDia(HOJE, dados);
    expect(Object.keys(r.feitas[0]!.faltosos[0]!).sort()).toEqual(["id", "nome"]);
  });

  it("fim de semana não tem aula nem turma pendente", () => {
    const r = resumoDoDia("2026-10-24", dados); // sábado
    expect(r.temAula).toBe(false);
    expect(r.pendentes).toEqual([]);
    expect(resumoDoDia(HOJE, dados).temAula).toBe(true);
  });
});

describe("muitas faltas no mês", () => {
  const diasOutubro = ["2026-10-01", "2026-10-02", "2026-10-05", "2026-10-06", "2026-10-07"];
  const x = aluno("X");
  const y = aluno("Y");
  const z = aluno("Z", "T2");
  const w = aluno("W", "T3", false);
  const v = aluno("V", "T3");
  const dados: DadosFrequencia = {
    turmas,
    alunos: [x, y, z, w, v],
    chamadas: [
      ...faltas(x, diasOutubro),
      ...faltas(y, diasOutubro.slice(0, 4)),
      ...faltas(z, ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"]),
      ...faltas(w, diasOutubro),
      ...faltas(v, [...diasOutubro, "2026-10-08", "2026-10-09"]),
    ],
  };

  it("aluno com 5 faltas no mês aparece", () => {
    expect(alunosComMuitasFaltas(HOJE, dados).map((a) => a.id)).toContain("X");
  });

  it("aluno com 4 faltas no mês não aparece", () => {
    expect(alunosComMuitasFaltas(HOJE, dados).map((a) => a.id)).not.toContain("Y");
  });

  it("faltas do mês anterior não contam", () => {
    expect(alunosComMuitasFaltas(HOJE, dados).map((a) => a.id)).not.toContain("Z");
  });

  it("aluno desativado não aparece", () => {
    expect(alunosComMuitasFaltas(HOJE, dados).map((a) => a.id)).not.toContain("W");
  });

  it("ordena do maior número de faltas para o menor, com a contagem", () => {
    expect(alunosComMuitasFaltas(HOJE, dados).map((a) => [a.id, a.faltas])).toEqual([
      ["V", 7],
      ["X", 5],
    ]);
  });

  it("limite é configurável", () => {
    expect(alunosComMuitasFaltas(HOJE, dados, 4).map((a) => a.id)).toContain("Y");
  });

  it("falta de 31/10 às 22h em São Paulo conta em outubro, não em novembro", () => {
    // 22h de 31/10 em São Paulo = 01h de 01/11 em UTC.
    const dia = hojeEmSaoPaulo(new Date("2026-11-01T01:00:00Z"));
    expect(dia).toBe("2026-10-31");
    const u = aluno("U");
    const comNoite: DadosFrequencia = {
      turmas,
      alunos: [u],
      chamadas: faltas(u, ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", dia]),
    };
    expect(alunosComMuitasFaltas(dia, comNoite).map((a) => a.id)).toEqual(["U"]);
    expect(alunosComMuitasFaltas("2026-11-03", comNoite)).toEqual([]);
  });
});
