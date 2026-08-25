import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/tenant";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenant = await getTenant();
    const { id } = await params;
    const body = await req.json();
    await prisma.cliente.updateMany({ where: { id, tenantId: tenant.id }, data: body });
    return NextResponse.json({ data: { ok: true } });
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 400 }); }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenant = await getTenant();
    const { id } = await params;
    await prisma.cliente.updateMany({ where: { id, tenantId: tenant.id }, data: { ativo: false } });
    return NextResponse.json({ data: { ok: true } });
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 400 }); }
}
