import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarMensagem } from "@/lib/whatsapp";
import { montarMensagem } from "@/lib/tenant";
import { addHours, isAfter, isBefore } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  const agora = new Date();
  let enviadas = 0;
  let erros = 0;

  const mensagens = await prisma.mensagem.findMany({
    where: {
      status: "PENDENTE",
      agendamento: { status: "PENDENTE", dataHora: { gt: agora } },
    },
    include: {
      agendamento: { include: { cliente: true, tenant: true } },
    },
  });

  for (const msg of mensagens) {
    const { agendamento } = msg;
    const { cliente, tenant } = agendamento;
    const dataHora = new Date(agendamento.dataHora);

    const d24 = msg.tipo === "CONFIRMACAO_24H" && isAfter(agora, addHours(dataHora, -25)) && isBefore(agora, addHours(dataHora, -23));
    const d2 = msg.tipo === "CONFIRMACAO_2H" && isAfter(agora, addHours(dataHora, -2.5)) && isBefore(agora, addHours(dataHora, -1.5));

    if (!d24 && !d2) continue;

    try {
      const horario = dataHora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const texto = montarMensagem(tenant.msgTemplate, { nome: cliente.nome.split(" ")[0], servico: agendamento.servico, horario });
      await enviarMensagem(cliente.telefone, texto);
      await prisma.mensagem.update({ where: { id: msg.id }, data: { status: "ENVIADA", enviadaEm: new Date() } });
      enviadas++;
    } catch {
      await prisma.mensagem.update({ where: { id: msg.id }, data: { status: "ERRO" } });
      erros++;
    }
  }

  return NextResponse.json({ ok: true, enviadas, erros, processadas: mensagens.length });
}