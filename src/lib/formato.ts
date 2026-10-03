import type { DataCivil } from "@/domain/tipos";

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
