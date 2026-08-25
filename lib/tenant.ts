import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getTenant() {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Nao autenticado");
  
  const id = orgId ?? userId;
  
  let tenant = await prisma.tenant.findUnique({ where: { clerkOrgId: id } });
  
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { clerkOrgId: id, nome: "Meu Negocio", whatsappNumber: "5500000000000" }
    });
  }
  
  return tenant;
}

export function montarMensagem(template: string, vars: { nome: string; horario: string; servico: string }) {
  return template.replace(/{nome}/g, vars.nome).replace(/{horario}/g, vars.horario).replace(/{servico}/g, vars.servico);
}