import { LIMITE_FALTAS_MES } from "@/config/escola";
import { repos } from "@/data";
import { alunosComMuitasFaltas, resumoDoDia } from "@/domain/frequencia";
import { dataLonga } from "@/lib/formato";
import { log } from "@/lib/log";
import { hoje } from "@/lib/relogio";
import { exigirPerfil } from "@/lib/sessao";
import { Cabecalho } from "../cabecalho";
import { ContatoAluno } from "./contato-aluno";

export default async function HojePage() {
  const usuario = await exigirPerfil("secretaria", "direcao");
  const dia = hoje();
  const [turmas, alunos, usuarios, chamadas] = await Promise.all([
    repos().turmas.listar(),
    repos().alunos.listar(),
    repos().usuarios.listar(),
    repos().chamadas.listarPorPeriodo(`${dia.slice(0, 7)}-01`, dia),
  ]);

  // Agregados vêm do domínio; aqui só se busca e se mostra.
  const dados = { turmas, alunos, chamadas };
  const resumo = resumoDoDia(dia, dados);
  const muitasFaltas = alunosComMuitasFaltas(dia, dados);
  const nomeDe = (id: string, lista: readonly { id: string; nome: string }[]) => lista.find((x) => x.id === id)?.nome ?? "";

  log.info(
    {
      evento: "today_view_opened",
      perfil: usuario.perfil,
      turmasPendentes: resumo.pendentes.length,
      turmasFeitas: resumo.feitas.length,
      alunosMuitasFaltas: muitasFaltas.length,
    },
    "today_view_opened",
  );

  return (
    <>
      <Cabecalho usuario={usuario} />
      <main className="largo">
        <h1>Hoje</h1>
        <p>{dataLonga(dia)}</p>
        <div className="painel-hoje">
          <section aria-labelledby="titulo-pendentes" data-secao="pendentes">
            <h2 id="titulo-pendentes">Ainda não fizeram a chamada</h2>
            {!resumo.temAula ? (
              <p>Hoje não tem aula.</p>
            ) : resumo.pendentes.length === 0 ? (
              <p className="status-feita">Todas as turmas já fizeram a chamada.</p>
            ) : (
              <ul className="lista-simples">
                {resumo.pendentes.map((t) => (
                  <li key={t.id} data-turma-id={t.id}>
                    <strong>{t.nome}</strong>
                    <span className="detalhe">{nomeDe(t.professoraId, usuarios)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="titulo-feitas" data-secao="feitas">
            <h2 id="titulo-feitas">Já fizeram a chamada — quem faltou hoje</h2>
            {resumo.feitas.length === 0 ? (
              <p>Nenhuma turma fez a chamada ainda.</p>
            ) : (
              resumo.feitas.map((t) => (
                <div key={t.id} className="turma-feita" data-turma-id={t.id}>
                  <h3>{t.nome}</h3>
                  {t.faltosos.length === 0 ? (
                    <p className="status-feita">Ninguém faltou.</p>
                  ) : (
                    <ul className="lista-alunos">
                      {t.faltosos.map((a) => (
                        <li key={a.id}>
                          <ContatoAluno alunoId={a.id} nome={a.nome} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
          </section>

          <section aria-labelledby="titulo-muitas-faltas" data-secao="muitas-faltas">
            <h2 id="titulo-muitas-faltas">Muitas faltas este mês ({LIMITE_FALTAS_MES} ou mais)</h2>
            {muitasFaltas.length === 0 ? (
              <p>Nenhum aluno com {LIMITE_FALTAS_MES} ou mais faltas este mês.</p>
            ) : (
              <ul className="lista-alunos">
                {muitasFaltas.map((a) => (
                  <li key={a.id}>
                    <ContatoAluno
                      alunoId={a.id}
                      nome={a.nome}
                      detalhe={`${nomeDe(a.turmaId, turmas)} · ${a.faltas} faltas`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
