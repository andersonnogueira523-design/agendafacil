import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/tenant";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  try {
    const tenant = await getTenant();
    const hoje = new Date();
    const where = { tenantId: tenant.id, dataHora: { gte: startOfDay(hoje), lte: endOfDay(hoje) } };

    const [total, confirmados, cancelados] = await Promise.all([
      prisma.agendamento.count({ where }),
      prisma.agendamento.count({ where: { ...where, status: "CONFIRMADO" } }),
      prisma.agendamento.count({ where: { ...where, status: "CANCELADO" } }),
    ]);

    return NextResponse.json({
      data: {
        totalHoje: total,
        confirmados,
        cancelados,
        taxaConfirmacao: total > 0 ? Math.round((confirmados / total) * 100) : 0,
      },
    });
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 400 }); }
}
