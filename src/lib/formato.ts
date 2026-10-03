import type { Situacao } from "@/domain/mensalidades";
import type { Competencia, DataCivil } from "@/domain/tipos";

const DATA_LONGA = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** "quarta-feira, 7 de outubro". Datas civis são formatadas em UTC para não deslocar o dia. */
export function dataLonga(data: DataCivil): string {
  return DATA_LONGA.format(new Date(`${data}T12:00:00Z`));
}

const MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Dinheiro vive em centavos (inteiro); só vira reais na hora de mostrar. */
export function moeda(centavos: number): string {
  return MOEDA.format(centavos / 100);
}

const MES = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });

/** "Outubro/2026". */
export function mesAno(competencia: Competencia): string {
  const mes = MES.format(new Date(`${competencia}-15T12:00:00Z`));
  return `${mes[0]!.toUpperCase()}${mes.slice(1)}/${competencia.slice(0, 4)}`;
}

/** "Vence dia 10" / "Em atraso há 5 dias" / "Paga". */
export function textoSituacao(s: Situacao): string {
  if (s.tipo === "paga") return "Paga";
  if (s.tipo === "em-aberto") return `Vence dia ${Number(s.vencimento.slice(8, 10))}`;
  return `Em atraso há ${s.dias} ${s.dias === 1 ? "dia" : "dias"}`;
}
