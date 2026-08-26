import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const tenant = await getTenant();
    return NextResponse.json({ data: tenant });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const tenant = await getTenant();
    const { nome, whatsappNumber, msgTemplate } = await req.json();
    const updated = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        ...(nome && { nome }),
        ...(whatsappNumber && { whatsappNumber }),
        ...(msgTemplate && { msgTemplate }),
      },
    });
    return NextResponse.json({ data: updated });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
