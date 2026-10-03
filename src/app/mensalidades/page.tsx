import { exigirPerfil } from "@/lib/sessao";
import { Cabecalho } from "../cabecalho";

// Tela provisória: as mensalidades de verdade são o TASK-004.
export default async function MensalidadesPage() {
  const usuario = await exigirPerfil("secretaria", "direcao");
  return (
    <>
      <Cabecalho usuario={usuario} />
      <main>
        <h1>Mensalidades</h1>
        <p>Em breve: mensalidades em aberto e registro de pagamento.</p>
      </main>
    </>
  );
}
