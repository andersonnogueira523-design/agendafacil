import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-webhook-secret");
    if (secret !== process.env.WEBHOOK_SECRET)
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const payload = await req.json();
    if (payload.event !== "messages.upsert") return NextResponse.json({ ok: true });

    const msg = payload.data?.message;
    const texto = (msg?.conversation ?? msg?.extendedTextMessage?.text ?? "").toLowerCase().trim();
    const telefone = (payload.data?.key?.remoteJid ?? "").replace(/@.*/, "").replace(/\D/g, "");

    if (!texto || !telefone) return NextResponse.json({ ok: true });

    const positivos = ["sim", "vou", "confirmo", "ok", "1"];
    const negativos = ["nao", "nao", "cancela", "nao consigo", "2"];
    const confirmou = positivos.some((p) => texto.includes(p));
    const cancelou  = negativos.some((n) => texto.includes(n));
    if (!confirmou && !cancelou) return NextResponse.json({ ok: true });

    const mensagem = await prisma.mensagem.findFirst({
      where: { status: "ENVIADA", agendamento: { status: "PENDENTE", cliente: { telefone } } },
      orderBy: { enviadaEm: "desc" },
    });
    if (!mensagem) return NextResponse.json({ ok: true });

    await prisma.$transaction([
      prisma.mensagem.update({
        where: { id: mensagem.id },
        data: { status: "RESPONDIDA", respostaCliente: confirmou ? "sim" : "nao", respondidaEm: new Date() },
      }),
      prisma.agendamento.update({
        where: { id: mensagem.agendamentoId },
        data: { status: confirmou ? "CONFIRMADO" : "CANCELADO" },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[webhook]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
