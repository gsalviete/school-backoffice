import { hojeEmSaoPaulo } from "@/domain/datas";
import type { DataCivil } from "@/domain/tipos";

// "Hoje" do app. HOJE_FIXO (AAAA-MM-DD) congela a data — só para testes e2e determinísticos.
const HOJE_FIXO = process.env.HOJE_FIXO;

export function hoje(): DataCivil {
  return HOJE_FIXO && /^\d{4}-\d{2}-\d{2}$/.test(HOJE_FIXO) ? HOJE_FIXO : hojeEmSaoPaulo();
}
