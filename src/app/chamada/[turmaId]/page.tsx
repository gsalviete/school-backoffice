import Link from "next/link";
import { redirect } from "next/navigation";
import { repos } from "@/data";
import { podeProfessoraEditar } from "@/domain/chamada";
import { diaUtilVizinho } from "@/domain/datas";
import { dataLonga } from "@/lib/formato";
import { log } from "@/lib/log";
import { hoje } from "@/lib/relogio";
import { exigirPerfil } from "@/lib/sessao";
import { Cabecalho } from "../../cabecalho";
import { ListaChamada } from "./lista-chamada";

interface Props {
  params: Promise<{ turmaId: string }>;
  searchParams: Promise<{ data?: string }>;
}

export default async function ChamadaTurmaPage({ params, searchParams }: Props) {
  const usuario = await exigirPerfil("professora");
  const { turmaId } = await params;
  const { data: dataParam } = await searchParams;

  const turma = await repos().turmas.buscar(turmaId);
  if (!turma || turma.professoraId !== usuario.id) redirect("/chamada");

  const diaHoje = hoje();
  const data = dataParam && /^\d{4}-\d{2}-\d{2}$/.test(dataParam) && dataParam <= diaHoje ? dataParam : diaHoje;
  const base = `/chamada/${turma.id}`;
  if (dataParam !== undefined && data !== dataParam) redirect(base);

  const [alunos, chamada, minhasTurmas] = await Promise.all([
    repos().alunos.listarAtivosPorTurma(turma.id),
    repos().chamadas.buscar(turma.id, data),
    repos().turmas.listarPorProfessora(usuario.id),
  ]);
  const editavel = podeProfessoraEditar(data, diaHoje);
  if (!editavel) {
    log.info({ evento: "attendance_edit_denied", turmaId: turma.id, data, professoraId: usuario.id }, "attendance_edit_denied");
  }

  const anterior = diaUtilVizinho(data, -1);
  const proximo = diaUtilVizinho(data, 1);
  const hrefDia = (d: string) => (d === diaHoje ? base : `${base}?data=${d}`);

  return (
    <>
      <Cabecalho usuario={usuario} />
      <main>
        {minhasTurmas.length > 1 && (
          <p>
            <Link href="/chamada">← Minhas turmas</Link>
          </p>
        )}
        <h1>Chamada — {turma.nome}</h1>
        <nav className="navegacao-dias" aria-label="Escolher o dia">
          <Link href={hrefDia(anterior)}>← Dia anterior</Link>
          <strong>{dataLonga(data)}</strong>
          {proximo <= diaHoje ? <Link href={hrefDia(proximo)}>Próximo dia →</Link> : <span />}
        </nav>
        {!chamada && editavel && <p>Todos começam como presentes. Toque em quem faltou.</p>}
        {!chamada && !editavel && <p>Não houve chamada neste dia.</p>}
        <ListaChamada
          // Recomeça a lista ao trocar de dia; após salvar, o estado local já é o que foi gravado.
          key={data}
          turmaId={turma.id}
          data={data}
          alunos={alunos.map((a) => ({ id: a.id, nome: a.nome }))}
          faltasIniciais={chamada?.faltasAlunoIds ?? []}
          editavel={editavel}
        />
      </main>
    </>
  );
}
