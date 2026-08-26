import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/tenant";
import { startOfDay, endOfDay, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { enviarMensagem } from "@/lib/whatsapp";
import { montarMensagem } from "@/lib/tenant";

const schema = z.object({
  clienteId: z.string().uuid(),
  servico: z.string().min(2),
  dataHora: z.string().datetime(),
  observacao: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const tenant = await getTenant();
    const data = new URL(req.url).searchParams.get("data");
    const agendamentos = await prisma.agendamento.findMany({
      where: {
        tenantId: tenant.id,
        ...(data && { dataHora: { gte: startOfDay(parseISO(data)), lte: endOfDay(parseISO(data)) } }),
      },
      include: { cliente: true, mensagens: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { dataHora: "asc" },
    });
    return NextResponse.json({ data: agendamentos });
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 400 }); }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await getTenant();
    const input = schema.parse(await req.json());
    const cliente = await prisma.cliente.findFirst({ where: { id: input.clienteId, tenantId: tenant.id } });
    if (!cliente) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

    const agendamento = await prisma.agendamento.create({
      data: {
        tenantId: tenant.id,
        clienteId: input.clienteId,
        servico: input.servico,
        dataHora: new Date(input.dataHora),
        observacao: input.observacao,
        mensagens: { create: [{ tipo: "CONFIRMACAO_24H" }, { tipo: "CONFIRMACAO_2H" }] },
      },
      include: { cliente: true, mensagens: true },
    });

    await prisma.cliente.update({ where: { id: input.clienteId }, data: { totalVisitas: { increment: 1 } } });

    // Envia mensagem de confirmação de agendamento imediatamente
    try {
      const dataHora = new Date(input.dataHora);
      const dataFormatada = format(dataHora, "dd/MM", { locale: ptBR });
      const horario = format(dataHora, "HH:mm");
      const primeiroNome = cliente.nome.split(" ")[0];

      const textoConfirmacao = `Oi ${primeiroNome}! 😊\n\nSeu agendamento de *${input.servico}* foi marcado para *${dataFormatada} às ${horario}*.\n\nQualquer dúvida estamos à disposição!`;

      await enviarMensagem(cliente.telefone, textoConfirmacao);
    } catch (e) {
      console.error("Erro ao enviar mensagem de confirmação:", e);
      // Não bloqueia o cadastro se o WhatsApp falhar
    }

    return NextResponse.json({ data: agendamento }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 422 });
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
