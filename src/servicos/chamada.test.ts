import { describe, expect, it } from "vitest";
import { criarReposEmMemoria } from "@/data/memory";
import { criarSeed } from "@/data/memory/seed";
import { salvarChamada } from "./chamada";

const HOJE = "2026-10-07"; // quarta

function cenario() {
  const repos = criarReposEmMemoria(criarSeed(HOJE));
  // T7 é da P6 e ainda não tem chamada hoje no seed.
  return { repos, base: { turmaId: "T7", data: HOJE, professoraId: "P6", hoje: HOJE } };
}

async function chamadasDoDia(repos: ReturnType<typeof cenario>["repos"], turmaId: string, data: string) {
  return (await repos.chamadas.listarPorPeriodo(data, data)).filter((c) => c.turmaId === turmaId);
}

describe("salvar chamada", () => {
  it("salvar sem faltas grava todos presentes", async () => {
    const { repos, base } = cenario();
    const r = await salvarChamada(repos, { ...base, faltasAlunoIds: [] }, new Date("2026-10-07T12:00:00Z"));

    expect(r).toMatchObject({ ok: true, editada: false, totalAlunos: 20, totalFaltas: 0 });
    const [chamada] = await chamadasDoDia(repos, "T7", HOJE);
    expect(chamada?.faltasAlunoIds).toEqual([]);
    expect(chamada?.registradaPor).toBe("P6");
  });

  it("salvar de novo no mesmo dia substitui, não duplica", async () => {
    const { repos, base } = cenario();
    await salvarChamada(repos, { ...base, faltasAlunoIds: ["T7-01", "T7-02"] });
    const r = await salvarChamada(repos, { ...base, faltasAlunoIds: ["T7-03"] });

    expect(r).toMatchObject({ ok: true, editada: true });
    const chamadas = await chamadasDoDia(repos, "T7", HOJE);
    expect(chamadas).toHaveLength(1);
    expect(chamadas[0]?.faltasAlunoIds).toEqual(["T7-03"]);
  });

  it("corrige dia anterior da mesma semana", async () => {
    const { repos, base } = cenario();
    const r = await salvarChamada(repos, { ...base, data: "2026-10-05", faltasAlunoIds: ["T7-01"] });
    expect(r.ok).toBe(true);
    expect((await chamadasDoDia(repos, "T7", "2026-10-05"))[0]?.faltasAlunoIds).toEqual(["T7-01"]);
  });

  it("recusa semana anterior sem alterar nada", async () => {
    const { repos, base } = cenario();
    const antes = await chamadasDoDia(repos, "T7", "2026-10-02");
    const r = await salvarChamada(repos, { ...base, data: "2026-10-02", faltasAlunoIds: ["T7-01"] });

    expect(r).toEqual({ ok: false, motivo: "semana-anterior" });
    expect(await chamadasDoDia(repos, "T7", "2026-10-02")).toEqual(antes);
  });

  it("recusa turma de outra professora", async () => {
    const { repos, base } = cenario();
    const r = await salvarChamada(repos, { ...base, turmaId: "T1", faltasAlunoIds: [] });
    expect(r).toEqual({ ok: false, motivo: "turma-de-outra-professora" });
  });

  it("ignora ids que não são alunos ativos da turma", async () => {
    const { repos, base } = cenario();
    const r = await salvarChamada(repos, { ...base, faltasAlunoIds: ["T7-01", "T1-01", "nao-existe"] });
    expect(r).toMatchObject({ ok: true, totalFaltas: 1 });
    expect((await chamadasDoDia(repos, "T7", HOJE))[0]?.faltasAlunoIds).toEqual(["T7-01"]);
  });
});
