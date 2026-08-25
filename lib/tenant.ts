import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getTenant() {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Sem organização ativa");
  const tenant = await prisma.tenant.findUnique({ where: { clerkOrgId: orgId } });
  if (!tenant) throw new Error("Negócio não encontrado. Conclua o onboarding.");
  return tenant;
}

export function montarMensagem(
  template: string,
  vars: { nome: string; horario: string; servico: string }
) {
  return template
    .replace(/{nome}/g, vars.nome)
    .replace(/{horario}/g, vars.horario)
    .replace(/{servico}/g, vars.servico);
}
