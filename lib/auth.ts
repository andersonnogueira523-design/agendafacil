import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "agendafacil-secret-2025");

export interface SessionPayload extends JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
}

export async function criarToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(SECRET);
}

export async function verificarToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as SessionPayload;
  } catch { return null; }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verificarToken(token);
}

export async function getTenant() {
  const session = await getSession();
  if (!session) throw new Error("Nao autenticado");
  const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } });
  if (!tenant) throw new Error("Negocio nao encontrado");
  return tenant;
}

export function montarMensagem(template: string, vars: { nome: string; horario: string; servico: string }) {
  return template.replace(/{nome}/g, vars.nome).replace(/{horario}/g, vars.horario).replace(/{servico}/g, vars.servico);
}