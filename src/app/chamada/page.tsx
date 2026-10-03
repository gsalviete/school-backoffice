import Link from "next/link";
import { redirect } from "next/navigation";
import { repos } from "@/data";
import { statusDoDia } from "@/domain/chamada";
import { dataLonga } from "@/lib/formato";
import { hoje } from "@/lib/relogio";
import { exigirPerfil } from "@/lib/sessao";
import { Cabecalho } from "../cabecalho";

export default async function ChamadaPage() {
  const usuario = await exigirPerfil("professora");
  const turmas = await repos().turmas.listarPorProfessora(usuario.id);
  // Com uma turma só, nada para escolher: direto para a chamada.
  if (turmas.length === 1) redirect(`/chamada/${turmas[0]!.id}`);

  const dia = hoje();
  const chamadasDeHoje = await repos().chamadas.listarPorPeriodo(dia, dia);

  return (
    <>
      <Cabecalho usuario={usuario} />
      <main>
        <h1>Chamada</h1>
        <p>{dataLonga(dia)}</p>
        {turmas.length === 0 ? (
          <p>Você ainda não tem turma. Fale com a secretaria.</p>
        ) : (
          <ul className="lista-botoes">
            {turmas.map((t) => {
              const feita = statusDoDia(t.id, dia, chamadasDeHoje) === "feita";
              return (
                <li key={t.id}>
                  <Link href={`/chamada/${t.id}`} className="cartao-turma" data-turma-id={t.id}>
                    <span>{t.nome}</span>
                    <span className={feita ? "status-feita" : "status-pendente"}>{feita ? "Feita ✓" : "Falta fazer"}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
