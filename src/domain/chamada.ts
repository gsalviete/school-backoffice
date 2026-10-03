import { diaDaSemana, somarDias } from "./datas";
import type { Chamada, DataCivil } from "./tipos";

// PREMISSA: "semana corrente" = segunda a domingo. O doc de produto não define; confirmar com a secretaria
// no teste com usuárias.
export function inicioDaSemana(data: DataCivil): DataCivil {
  const diasDesdeSegunda = (diaDaSemana(data) + 6) % 7;
  return somarDias(data, -diasDesdeSegunda);
}

/** Professora só altera chamadas da semana corrente, e nunca de dia futuro. */
export function podeProfessoraEditar(data: DataCivil, hoje: DataCivil): boolean {
  return data <= hoje && inicioDaSemana(data) === inicioDaSemana(hoje);
}

export type StatusDoDia = "feita" | "pendente";

export function statusDoDia(
  turmaId: string,
  data: DataCivil,
  chamadas: readonly Pick<Chamada, "turmaId" | "data">[],
): StatusDoDia {
  return chamadas.some((c) => c.turmaId === turmaId && c.data === data) ? "feita" : "pendente";
}
