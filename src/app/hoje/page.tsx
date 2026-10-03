import { exigirPerfil } from "@/lib/sessao";
import { Cabecalho } from "../cabecalho";

// Tela provisória: a visão "Hoje" de verdade é o TASK-003.
export default async function HojePage() {
  const usuario = await exigirPerfil("secretaria", "direcao");
  return (
    <>
      <Cabecalho usuario={usuario} />
      <main>
        <h1>Hoje</h1>
        <p>Em breve: quem faltou hoje e quais turmas ainda não fizeram a chamada.</p>
      </main>
    </>
  );
}
