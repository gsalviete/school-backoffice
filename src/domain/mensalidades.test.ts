import { describe, expect, it } from "vitest";
import { DIA_VENCIMENTO, VALOR_MENSALIDADE_CENTAVOS } from "@/config/escola";
import {
  desfazerPagamento,
  garantirMensalidades,
  marcarComoPaga,
  ordenarEmAberto,
  situacao,
  vencimentoDe,
} from "./mensalidades";
import type { Aluno, Mensalidade } from "./tipos";

function aluno(id: string, ativo = true): Aluno {
  return { id, nome: `Aluno ${id}`, turmaId: "T1", responsavelNome: "Resp", responsavelTelefone: "(11) 90000-0000", ativo };
}

function mensalidade(competencia: string, pagaEm?: string, alunoId = "A1"): Mensalidade {
  return {
    id: `${alunoId}-${competencia}`,
    alunoId,
    competencia,
    valorCentavos: VALOR_MENSALIDADE_CENTAVOS,
    vencimento: vencimentoDe(competencia),
    ...(pagaEm ? { pagaEm } : {}),
  };
}

describe("geração de mensalidades", () => {
  it.each(["2026-01", "2026-07", "2026-12"])("aluno ativo tem mensalidade em %s", (competencia) => {
    const todas = garantirMensalidades([aluno("A1")], [], competencia);
    const m = todas.find((x) => x.alunoId === "A1" && x.competencia === competencia);
    expect(m).toBeDefined();
    expect(m!.valorCentavos).toBe(VALOR_MENSALIDADE_CENTAVOS);
    expect(Number.isInteger(m!.valorCentavos)).toBe(true);
    expect(m!.vencimento).toBe(`${competencia}-${String(DIA_VENCIMENTO).padStart(2, "0")}`);
    expect(m!.pagaEm).toBeUndefined();
  });

  it("todos os meses do ano até a competência, nunca depois", () => {
    const todas = garantirMensalidades([aluno("A1")], [], "2026-12");
    expect(todas.map((m) => m.competencia)).toEqual(Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, "0")}`));
    expect(garantirMensalidades([aluno("A1")], [], "2026-03").map((m) => m.competencia)).not.toContain("2026-04");
  });

  it("não duplica ao chamar duas vezes", () => {
    const alunos = [aluno("A1"), aluno("A2")];
    const uma = garantirMensalidades(alunos, [], "2026-10");
    const duas = garantirMensalidades(alunos, uma, "2026-10");
    expect(duas).toHaveLength(20);
    expect(new Set(duas.map((m) => `${m.alunoId}/${m.competencia}`)).size).toBe(20);
  });

  it("não mexe nas mensalidades que já existem", () => {
    const paga = mensalidade("2026-01", "2026-01-08");
    const todas = garantirMensalidades([aluno("A1")], [paga], "2026-02");
    expect(todas.find((m) => m.competencia === "2026-01")).toEqual(paga);
  });

  it("aluno desativado não gera novas mensalidades", () => {
    // Desativado em 2026-09: as mensalidades até setembro já existiam.
    const existentes = ["2026-07", "2026-08", "2026-09"].map((c) => mensalidade(c, undefined, "D1"));
    const todas = garantirMensalidades([aluno("D1", false)], existentes, "2026-10");
    const competencias = todas.filter((m) => m.alunoId === "D1").map((m) => m.competencia);
    expect(competencias).toContain("2026-09");
    expect(competencias).not.toContain("2026-10");
  });
});

describe("atraso", () => {
  it("em aberto após o vencimento mostra dias de atraso", () => {
    const m = mensalidade("2026-10");
    expect(m.vencimento).toBe("2026-10-10");
    expect(situacao(m, "2026-10-15")).toEqual({ tipo: "atrasada", dias: 5 });
  });

  it("no dia do vencimento ainda não está atrasada", () => {
    expect(situacao(mensalidade("2026-10"), "2026-10-10").tipo).toBe("em-aberto");
  });

  it("conta dias civis atravessando meses", () => {
    expect(situacao(mensalidade("2026-09"), "2026-10-07")).toEqual({ tipo: "atrasada", dias: 27 });
  });

  it("paga não está em atraso", () => {
    expect(situacao(mensalidade("2026-09", "2026-09-30"), "2026-10-07").tipo).toBe("paga");
  });

  it("atrasadas primeiro, da mais antiga para a mais nova", () => {
    const hoje = "2026-10-15";
    const lista = [mensalidade("2026-11"), mensalidade("2026-10"), mensalidade("2026-08"), mensalidade("2026-09")];
    expect(ordenarEmAberto(lista, hoje).map((m) => m.competencia)).toEqual(["2026-08", "2026-09", "2026-10", "2026-11"]);
  });
});

describe("pagamento (regra)", () => {
  const hoje = "2026-10-15";

  it("marcar como paga registra a data informada", () => {
    expect(marcarComoPaga(mensalidade("2026-10"), "2026-10-14", hoje)).toEqual({
      ok: true,
      mensalidade: { ...mensalidade("2026-10"), pagaEm: "2026-10-14" },
    });
  });

  it("data de pagamento no futuro é rejeitada", () => {
    expect(marcarComoPaga(mensalidade("2026-10"), "2026-10-16", hoje)).toEqual({ ok: false, motivo: "data-futura" });
  });

  it("data inválida é rejeitada", () => {
    expect(marcarComoPaga(mensalidade("2026-10"), "14/10/2026", hoje)).toEqual({ ok: false, motivo: "data-invalida" });
    expect(marcarComoPaga(mensalidade("2026-10"), "2026-02-30", hoje)).toEqual({ ok: false, motivo: "data-invalida" });
  });

  it("desfazer volta para em aberto", () => {
    const desfeita = desfazerPagamento(mensalidade("2026-10", "2026-10-14"));
    expect(desfeita.pagaEm).toBeUndefined();
    expect("pagaEm" in desfeita).toBe(false);
  });
});
