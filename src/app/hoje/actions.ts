"use server";

import { repos } from "@/data";
import { log } from "@/lib/log";
import { exigirPerfil } from "@/lib/sessao";

export type RespostaContato = { ok: true; responsavelNome: string; responsavelTelefone: string } | { ok: false };

// Contato do responsável só sob demanda (LGPD, minimização): nunca vai na lista, só quando a secretaria toca no aluno.
export async function contatoResponsavelAction(alunoId: string): Promise<RespostaContato> {
  const usuario = await exigirPerfil("secretaria", "direcao");
  const aluno = await repos().alunos.buscar(alunoId);
  if (!aluno) return { ok: false };

  // Trilha de acesso a dado pessoal de menor — só ids.
  log.info({ evento: "guardian_contact_viewed", alunoId: aluno.id, usuarioId: usuario.id }, "guardian_contact_viewed");
  return { ok: true, responsavelNome: aluno.responsavelNome, responsavelTelefone: aluno.responsavelTelefone };
}
