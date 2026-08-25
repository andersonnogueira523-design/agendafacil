import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/tenant";

const schema = z.object({
  nome: z.string().min(2),
  telefone: z.string().min(10),
  servicoFavorito: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const tenant = await getTenant();
    const q = new URL(req.url).searchParams.get("q") ?? "";
    const clientes = await prisma.cliente.findMany({
      where: {
        tenantId: tenant.id, ativo: true,
        ...(q && { OR: [{ nome: { contains: q, mode: "insensitive" } }, { telefone: { contains: q } }] }),
      },
      orderBy: { nome: "asc" },
    });
    return NextResponse.json({ data: clientes });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await getTenant();
    const input = schema.parse(await req.json());
    const telefone = input.telefone.replace(/\D/g, "");
    const cliente = await prisma.cliente.create({
      data: { tenantId: tenant.id, nome: input.nome, telefone, servicoFavorito: input.servicoFavorito },
    });
    return NextResponse.json({ data: cliente }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 422 });
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
