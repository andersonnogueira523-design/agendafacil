import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/tenant";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenant = await getTenant();
    const { id } = await params;
    const body = await req.json();
    await prisma.agendamento.updateMany({
      where: { id, tenantId: tenant.id },
      data: { ...body, ...(body.dataHora && { dataHora: new Date(body.dataHora) }) },
    });
    return NextResponse.json({ data: { ok: true } });
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 400 }); }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenant = await getTenant();
    const { id } = await params;
    await prisma.agendamento.updateMany({ where: { id, tenantId: tenant.id }, data: { status: "CANCELADO" } });
    return NextResponse.json({ data: { ok: true } });
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 400 }); }
}
