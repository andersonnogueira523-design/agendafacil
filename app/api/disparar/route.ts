import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarMensagem } from "@/lib/whatsapp";
import { montarMensagem } from "@/lib/tenant";
import { addHours, isAfter, isBefore, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const agora = new Date();
  let enviadas = 0;
  let erros = 0;

  const mensagens = await prisma.mensagem.findMany({
    where: {
      tipo: "CONFIRMACAO_2H",
      status: "PENDENTE",
      agendamento: {
        status: "PENDENTE",
        dataHora: { gt: agora },
      },
    },
    include: {
      agendamento: {
        include: { cliente: true, tenant: true },
      },
    },
  });

  for (const msg of mensagens) {
    const { agendamento } = msg;
    const { cliente, tenant } = agendamento;
    const dataHora = new Date(agendamento.dataHora);

    // Envia entre 2h30 e 1h30 antes do agendamento
    const deveEnviar =
      isAfter(agora, addHours(dataHora, -2.5)) &&
      isBefore(agora, addHours(dataHora, -1.5));

    if (!deveEnviar) continue;

    try {
      const horario = format(dataHora, "HH:mm", { locale: ptBR });
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
    } catch {
      await prisma.mensagem.update({
        where: { id: msg.id },
        data: { status: "ERRO" },
      });
      erros++;
    }
  }

  return NextResponse.json({ ok: true, enviadas, erros, processadas: mensagens.length });
}
