import type { DataCivil } from "./tipos";

export const FUSO_ESCOLA = "America/Sao_Paulo";

/** Data civil de "hoje" no fuso da escola — nunca UTC (chamada às 22h não pode cair no dia seguinte). */
export function hojeEmSaoPaulo(agora: Date = new Date()): DataCivil {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_ESCOLA }).format(agora);
}

// Aritmética de datas civis feita em UTC puro: sem horário, sem fuso, sem horário de verão.
function paraUtc(data: DataCivil): Date {
  return new Date(`${data}T00:00:00Z`);
}

export function somarDias(data: DataCivil, dias: number): DataCivil {
  const d = paraUtc(data);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** 0 = domingo … 6 = sábado. */
export function diaDaSemana(data: DataCivil): number {
  return paraUtc(data).getUTCDay();
}

export function ehDiaUtil(data: DataCivil): boolean {
  const d = diaDaSemana(data);
  return d !== 0 && d !== 6;
}

/** Dias de segunda a sexta entre `inicio` e `fim`, inclusive. Feriados não são considerados (pergunta aberta). */
export function diasUteisDoPeriodo(inicio: DataCivil, fim: DataCivil): DataCivil[] {
  const dias: DataCivil[] = [];
  for (let d = inicio; d <= fim; d = somarDias(d, 1)) {
    if (ehDiaUtil(d)) dias.push(d);
  }
  return dias;
}

/** Dia útil imediatamente antes (`passo = -1`) ou depois (`passo = 1`) de `data`. */
export function diaUtilVizinho(data: DataCivil, passo: 1 | -1): DataCivil {
  let d = somarDias(data, passo);
  while (!ehDiaUtil(d)) d = somarDias(d, passo);
  return d;
}
