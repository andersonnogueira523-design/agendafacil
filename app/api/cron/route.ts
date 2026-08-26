import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarMensagem } from "@/lib/whatsapp";
import { montarMensagem } from "@/lib/tenant";
import { addHours, isAfter, isBefore } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Valida o secret para segurança
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const agora = new Date();
  let enviadas = 0;
  let erros = 0;

  try {
    // Busca mensagens pendentes cujo agendamento ainda não passou
    const mensagens = await prisma.mensagem.findMany({
      where: {
        status: "PENDENTE",
        agendamento: {
          status: "PENDENTE",
          dataHora: { gt: agora },
        },
      },
      include: {
        agendamento: {
          include: {
            cliente: true,
            tenant: true,
          },
        },
      },
    });

    for (const msg of mensagens) {
      const { agendamento } = msg;
      const { cliente, tenant } = agendamento;
      const dataHora = new Date(agendamento.dataHora);

      // Janela de envio: envia se estiver dentro de 30 minutos do horário certo
      const deveEnviar24h =
        msg.tipo === "CONFIRMACAO_24H" &&
        isAfter(agora, addHours(dataHora, -25)) &&
        isBefore(agora, addHours(dataHora, -23));

      const deveEnviar2h =
        msg.tipo === "CONFIRMACAO_2H" &&
        isAfter(agora, addHours(dataHora, -2.5)) &&
        isBefore(agora, addHours(dataHora, -1.5));

      if (!deveEnviar24h && !deveEnviar2h) continue;

      try {
        const horario = dataHora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        const texto = montarMensagem(tenant.msgTemplate, {
          nome: cliente.nome.split(" ")[0],
          servico: agendamento.servico,
          horario,
        });

        await enviarMensagem(cliente.telefone, texto);

        await prisma.mensagem.update({
          where: { id: msg.id },
          data: { status: "ENVIADA", enviadaEm: new Date() },
        });

        enviadas++;
      } catch (e) {
        console.error(`Erro ao enviar msg ${msg.id}:`, e);
        await prisma.mensagem.update({
          where: { id: msg.id },
          data: { status: "ERRO" },
        });
        erros++;
      }
    }

    return NextResponse.json({
      ok: true,
      enviadas,
      erros,
      processadas: mensagens.length,
      horario: agora.toISOString(),
    });
  } catch (e) {
    console.error("[cron]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
