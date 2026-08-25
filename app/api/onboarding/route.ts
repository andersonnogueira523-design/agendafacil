import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { orgId } = await auth();
    if (!orgId) return NextResponse.json({ error: "Sem organizacao" }, { status: 401 });
    const { nome, whatsappNumber } = await req.json();
    const tenant = await prisma.tenant.upsert({
      where: { clerkOrgId: orgId },
      update: { nome, whatsappNumber: whatsappNumber.replace(/\D/g, "") },
      create: { clerkOrgId: orgId, nome, whatsappNumber: whatsappNumber.replace(/\D/g, "") },
    });
    return NextResponse.json({ data: tenant });
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 400 }); }
}
