import { repos } from "@/data";
import { exigirPerfil } from "@/lib/sessao";
import { Cabecalho } from "../cabecalho";

// Tela provisória: a chamada de verdade é o TASK-002.
export default async function ChamadaPage() {
  const usuario = await exigirPerfil("professora");
  const turmas = await repos().turmas.listarPorProfessora(usuario.id);
  return (
    <>
      <Cabecalho usuario={usuario} />
      <main>
        <h1>Chamada</h1>
        <p>Suas turmas:</p>
        <ul>
          {turmas.map((t) => (
            <li key={t.id}>{t.nome}</li>
          ))}
        </ul>
      </main>
    </>
  );
}
