import { DIA_VENCIMENTO, VALOR_MENSALIDADE_CENTAVOS } from "@/config/escola";
import { diasEntre, ehDataCivilValida } from "./datas";
import type { Aluno, Competencia, DataCivil, Mensalidade } from "./tipos";

// Regras de mensalidade. Puro: recebe e devolve dados, quem grava é o serviço.
// Valor único, sem desconto/bolsa/isenção, sem multa/juros, sem pagamento parcial (doc de produto).

export function vencimentoDe(competencia: Competencia): DataCivil {
  return `${competencia}-${String(DIA_VENCIMENTO).padStart(2, "0")}`;
}

// PREMISSA "por enquanto": os 12 meses do ano são cobrados, de janeiro até a competência atual.
// Único ponto da regra — para mudar quais meses geram mensalidade, mude só aqui.
function competenciasCobradas(ate: Competencia): Competencia[] {
  const [ano, mes] = ate.split("-").map(Number) as [number, number];
  return Array.from({ length: mes }, (_, i) => `${ano}-${String(i + 1).padStart(2, "0")}`);
}

/**
 * Todas as mensalidades existentes mais as que faltam para cada aluno ATIVO até `ate`.
 * Idempotente. Aluno desativado não ganha mensalidade nova; as antigas ficam.
 */
export function garantirMensalidades(
  alunos: readonly Aluno[],
  existentes: readonly Mensalidade[],
  ate: Competencia,
): Mensalidade[] {
  const ja = new Set(existentes.map((m) => `${m.alunoId}/${m.competencia}`));
  const novas: Mensalidade[] = [];
  for (const aluno of alunos.filter((a) => a.ativo)) {
    for (const competencia of competenciasCobradas(ate)) {
      if (ja.has(`${aluno.id}/${competencia}`)) continue;
      novas.push({
        id: `${aluno.id}-${competencia}`,
        alunoId: aluno.id,
        competencia,
        valorCentavos: VALOR_MENSALIDADE_CENTAVOS,
        vencimento: vencimentoDe(competencia),
      });
    }
  }
  return [...existentes, ...novas];
}

export type Situacao = { tipo: "paga" } | { tipo: "em-aberto"; vencimento: DataCivil } | { tipo: "atrasada"; dias: number };

/** Datas civis no fuso da escola: no dia do vencimento ainda não está atrasada. */
export function situacao(m: Mensalidade, hoje: DataCivil): Situacao {
  if (m.pagaEm) return { tipo: "paga" };
  const dias = diasEntre(m.vencimento, hoje);
  return dias > 0 ? { tipo: "atrasada", dias } : { tipo: "em-aberto", vencimento: m.vencimento };
}

/** Em aberto, da que vence (ou venceu) primeiro para a última — então as atrasadas vêm antes. */
export function ordenarEmAberto<T extends Mensalidade>(lista: readonly T[], hoje: DataCivil): T[] {
  return lista
    .filter((m) => situacao(m, hoje).tipo !== "paga")
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento) || a.alunoId.localeCompare(b.alunoId));
}

export type ResultadoMarcar =
  | { ok: true; mensalidade: Mensalidade }
  | { ok: false; motivo: "data-invalida" | "data-futura" };

export function marcarComoPaga(m: Mensalidade, data: string, hoje: DataCivil): ResultadoMarcar {
  if (!ehDataCivilValida(data)) return { ok: false, motivo: "data-invalida" };
  if (data > hoje) return { ok: false, motivo: "data-futura" };
  return { ok: true, mensalidade: { ...m, pagaEm: data } };
}

export function desfazerPagamento(m: Mensalidade): Mensalidade {
  const emAberto = { ...m };
  delete emAberto.pagaEm;
  delete emAberto.pagamentoRegistradoEm;
  return emAberto;
}
