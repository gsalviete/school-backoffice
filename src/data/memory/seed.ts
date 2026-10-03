import { DIA_VENCIMENTO, VALOR_MENSALIDADE_CENTAVOS } from "@/config/escola";
import { diasUteisDoPeriodo, ehDiaUtil, somarDias } from "@/domain/datas";
import type { Aluno, Chamada, Competencia, DataCivil, Mensalidade, Turma, Usuario } from "@/domain/tipos";

// Dados de exemplo da POC. TODOS FICTÍCIOS — nunca colocar nomes ou telefones reais (dados de menores, LGPD).
// Determinístico: a mesma data de referência gera sempre os mesmos dados.

export interface DadosSeed {
  usuarios: Usuario[];
  turmas: Turma[];
  alunos: Aluno[];
  chamadas: Chamada[];
  mensalidades: Mensalidade[];
}

const PRENOMES = [
  "Alice", "Miguel", "Helena", "Arthur", "Laura", "Heitor", "Valentina", "Bernardo", "Sofia", "Davi",
  "Manuela", "Gabriel", "Cecília", "Pedro", "Lívia", "Lorenzo", "Isabela", "Rafael", "Clara", "Theo",
  "Beatriz", "Samuel", "Júlia", "Benício", "Lara", "Gustavo", "Marina", "Lucas", "Antonella", "Enzo",
];
const SOBRENOMES = [
  "Silva", "Souza", "Oliveira", "Santos", "Lima", "Pereira", "Costa", "Ferreira", "Rodrigues", "Almeida",
  "Nascimento", "Carvalho", "Gomes", "Martins", "Araújo", "Ribeiro", "Barbosa", "Rocha", "Dias", "Moreira",
];
const RESPONSAVEIS = ["Ana", "Carla", "Fernanda", "Patrícia", "Juliana", "Roberto", "Marcos", "Paulo", "Renata", "Sandra"];

const PROFESSORAS = ["Ana", "Beatriz", "Cláudia", "Denise", "Eliane", "Fátima", "Glória", "Helena", "Irene"];

// T1 tem 20 ativos + 1 desativado; o resto varia para parecer uma escola real.
const ALUNOS_POR_TURMA = [21, 18, 17, 19, 16, 18, 20, 17, 18, 19];
const NOMES_TURMAS = [
  "Infantil 4 A", "Infantil 4 B", "Infantil 5 A", "Infantil 5 B", "1º ano A",
  "1º ano B", "2º ano", "3º ano", "4º ano", "5º ano",
];

const PROB_FALTA = 0.04;
// Turmas que já fizeram a chamada "hoje" — o resto aparece pendente na visão Hoje.
const TURMAS_FEITAS_HOJE = new Set(["T1", "T3", "T4"]);
// Alunos com contagem exata de faltas no mês corrente, para demonstrar o limite de 5.
const FALTAS_FIXAS_NO_MES: Record<string, number> = { "T3-03": 5, "T4-04": 4 };

/** PRNG pequeno e determinístico (mulberry32). */
function criarAleatorio(semente: number) {
  let a = semente;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pad(n: number, tamanho: number): string {
  return String(n).padStart(tamanho, "0");
}

export function criarSeed(hoje: DataCivil): DadosSeed {
  const aleatorio = criarAleatorio(42);
  const escolher = <T>(lista: readonly T[]): T => lista[Math.floor(aleatorio() * lista.length)]!;

  const usuarios: Usuario[] = [
    ...PROFESSORAS.map((nome, i) => ({ id: `P${i + 1}`, nome: `Professora ${nome}`, perfil: "professora" as const })),
    { id: "S1", nome: "Secretaria", perfil: "secretaria" },
    { id: "D1", nome: "Direção", perfil: "direcao" },
  ];

  // P1 tem duas turmas (T1 e T2); P2..P9 uma cada.
  const turmas: Turma[] = NOMES_TURMAS.map((nome, i) => ({
    id: `T${i + 1}`,
    nome,
    professoraId: i <= 1 ? "P1" : `P${i}`,
  }));

  const alunos: Aluno[] = [];
  let sequencial = 0;
  turmas.forEach((turma, ti) => {
    const total = ALUNOS_POR_TURMA[ti]!;
    for (let i = 1; i <= total; i++) {
      sequencial++;
      const sobrenome = escolher(SOBRENOMES);
      alunos.push({
        id: `${turma.id}-${pad(i, 2)}`,
        nome: `${escolher(PRENOMES)} ${sobrenome}`,
        turmaId: turma.id,
        responsavelNome: `${escolher(RESPONSAVEIS)} ${sobrenome}`,
        responsavelTelefone: `(11) 90000-0${pad(sequencial, 3)}`,
        // Último aluno de T1 está desativado.
        ativo: !(turma.id === "T1" && i === total),
      });
    }
  });
  const ativos = alunos.filter((a) => a.ativo);

  const chamadas = criarChamadas(hoje, turmas, ativos, aleatorio);
  const mensalidades = criarMensalidades(hoje, alunos, aleatorio);

  return { usuarios, turmas, alunos, chamadas, mensalidades };
}

function criarChamadas(hoje: DataCivil, turmas: Turma[], ativos: Aluno[], aleatorio: () => number): Chamada[] {
  const inicioMes = `${hoje.slice(0, 7)}-01`;
  const diasPassados = diasUteisDoPeriodo(somarDias(hoje, -28), somarDias(hoje, -1));

  // Faltas fixas caem nos últimos dias úteis do mês corrente antes de hoje. No começo do mês
  // pode não haver dias suficientes — então a contagem fica menor (limitação aceita do seed).
  const diasDoMes = diasPassados.filter((d) => d >= inicioMes);
  const diasFixos = Object.fromEntries(
    Object.entries(FALTAS_FIXAS_NO_MES).map(([id, n]) => [id, new Set(diasDoMes.slice(-n))]),
  );

  const montar = (turma: Turma, data: DataCivil): Chamada => {
    const faltas = ativos
      .filter((a) => a.turmaId === turma.id)
      .filter((a) => (diasFixos[a.id] ? diasFixos[a.id]!.has(data) : aleatorio() < PROB_FALTA))
      .map((a) => a.id);
    return {
      turmaId: turma.id,
      data,
      faltasAlunoIds: faltas,
      registradaPor: turma.professoraId,
      atualizadaEm: `${data}T11:00:00.000Z`,
    };
  };

  const chamadas = diasPassados.flatMap((data) => turmas.map((t) => montar(t, data)));
  if (ehDiaUtil(hoje)) {
    chamadas.push(...turmas.filter((t) => TURMAS_FEITAS_HOJE.has(t.id)).map((t) => montar(t, hoje)));
  }
  return chamadas;
}

function criarMensalidades(hoje: DataCivil, alunos: Aluno[], aleatorio: () => number): Mensalidade[] {
  const ano = Number(hoje.slice(0, 4));
  const mesAtual = Number(hoje.slice(5, 7));
  const diaAtual = Number(hoje.slice(8, 10));

  const mensalidades: Mensalidade[] = [];
  for (const aluno of alunos) {
    // Aluno desativado só tem mensalidades até o mês anterior (todas pagas).
    const ultimoMes = aluno.ativo ? mesAtual : mesAtual - 1;
    for (let mes = 1; mes <= ultimoMes; mes++) {
      const competencia: Competencia = `${ano}-${pad(mes, 2)}`;
      const vencimento = `${competencia}-${pad(DIA_VENCIMENTO, 2)}`;

      let probPaga = 0.97;
      if (mes === mesAtual - 1) probPaga = 0.85;
      if (mes === mesAtual) probPaga = diaAtual > DIA_VENCIMENTO ? 0.7 : 0.4;
      const paga = !aluno.ativo || aleatorio() < probPaga;

      let pagaEm: DataCivil | undefined;
      if (paga) {
        const candidata = somarDias(vencimento, Math.floor(aleatorio() * 11) - 5);
        pagaEm = candidata > hoje ? hoje : candidata;
      }
      mensalidades.push({
        id: `${aluno.id}-${competencia}`,
        alunoId: aluno.id,
        competencia,
        valorCentavos: VALOR_MENSALIDADE_CENTAVOS,
        vencimento,
        ...(pagaEm ? { pagaEm } : {}),
      });
    }
  }
  return mensalidades;
}
