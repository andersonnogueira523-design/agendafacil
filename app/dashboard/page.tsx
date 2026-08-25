import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/tenant";
import { startOfDay, endOfDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function DashboardPage() {
  const tenant = await getTenant();
  const hoje = new Date();
  const where = { tenantId: tenant.id, dataHora: { gte: startOfDay(hoje), lte: endOfDay(hoje) } };

  const [agendamentos, total, confirmados, cancelados] = await Promise.all([
    prisma.agendamento.findMany({
      where,
      include: { cliente: true, mensagens: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { dataHora: "asc" },
    }),
    prisma.agendamento.count({ where }),
    prisma.agendamento.count({ where: { ...where, status: "CONFIRMADO" } }),
    prisma.agendamento.count({ where: { ...where, status: "CANCELADO" } }),
  ]);

  const taxa = total > 0 ? Math.round((confirmados / total) * 100) : 0;

  const statusColor: Record<string, string> = {
    CONFIRMADO: "bg-green-100 text-green-700",
    CANCELADO: "bg-red-100 text-red-700",
    PENDENTE: "bg-yellow-100 text-yellow-700",
    CONCLUIDO: "bg-gray-100 text-gray-600",
    NO_SHOW: "bg-orange-100 text-orange-700",
  };

  const statusLabel: Record<string, string> = {
    CONFIRMADO: "Confirmado", CANCELADO: "Cancelou",
    PENDENTE: "Aguardando", CONCLUIDO: "Concluido", NO_SHOW: "No-show",
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">AgendaFacil</h1>
          <p className="text-sm text-gray-500">{tenant.nome}</p>
        </div>
        <span className="text-sm text-gray-500">
          {format(hoje, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </span>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Agendamentos hoje", value: total, color: "text-blue-600" },
            { label: "Confirmados", value: confirmados, color: "text-green-600" },
            { label: "Cancelados", value: cancelados, color: "text-red-500" },
            { label: "Taxa de confirmacao", value: `${taxa}%`, color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-medium ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Agenda */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-700">Agenda de hoje</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {agendamentos.length === 0 && (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">Nenhum agendamento para hoje.</p>
            )}
            {agendamentos.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 w-12 shrink-0">
                  {format(a.dataHora, "HH:mm")}
                </span>
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center justify-center shrink-0">
                  {a.cliente.nome.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{a.cliente.nome}</p>
                  <p className="text-xs text-gray-500">{a.servico}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[a.status]}`}>
                  {statusLabel[a.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
