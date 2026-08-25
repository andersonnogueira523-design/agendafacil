import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/tenant";
import { startOfDay, endOfDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function DashboardPage() {
  const tenant = await getTenant();
  const hoje = new Date();
  const where = {
    tenantId: tenant.id,
    dataHora: { gte: startOfDay(hoje), lte: endOfDay(hoje) },
  };

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

  const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
    CONFIRMADO: { bg: "#E1F5EE", text: "#085041", label: "✓ Confirmado" },
    CANCELADO:  { bg: "#FCEBEB", text: "#791F1F", label: "✕ Cancelou" },
    PENDENTE:   { bg: "#FAEEDA", text: "#633806", label: "⏳ Aguardando" },
    CONCLUIDO:  { bg: "#F0F0F0", text: "#555",    label: "✓ Concluído" },
    NO_SHOW:    { bg: "#FFF0E6", text: "#7A3A00", label: "✕ No-show" },
  };

  const colors = ["#EEEDFE", "#E1F5EE", "#FAECE7", "#E6F1FB", "#FAEEDA"];
  const textColors = ["#3C3489", "#085041", "#712B13", "#0C447C", "#633806"];

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>📅</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: "#111" }}>AgendaFácil</span>
          </div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{tenant.nome}</div>
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", background: "#F3F4F6", padding: "6px 14px", borderRadius: 8 }}>
          {format(hoje, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Agendamentos hoje", value: total,       color: "#2563EB" },
            { label: "Confirmados",        value: confirmados, color: "#059669" },
            { label: "Cancelados",         value: cancelados,  color: "#DC2626" },
            { label: "Taxa de confirmação", value: `${taxa}%`, color: "#059669" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "18px 20px" }}>
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 600, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Agenda */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>Agenda de hoje</span>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>{total} agendamento{total !== 1 ? "s" : ""}</span>
          </div>

          {agendamentos.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              Nenhum agendamento para hoje.
            </div>
          ) : (
            agendamentos.map((a, i) => {
              const s = statusStyle[a.status] ?? statusStyle.PENDENTE;
              const ci = i % 5;
              const initials = a.cliente.nome.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
              return (
                <div key={a.id} style={{ padding: "14px 24px", borderBottom: "1px solid #F9FAFB", display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", width: 44, flexShrink: 0 }}>
                    {format(a.dataHora, "HH:mm")}
                  </span>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: colors[ci], color: textColors[ci], fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>{a.cliente.nome}</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{a.servico}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: s.bg, color: s.text, fontWeight: 500, whiteSpace: "nowrap" }}>
                    {s.label}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé */}
        <div style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: "#D1D5DB" }}>
          AgendaFácil · Confirmação automática por WhatsApp
        </div>
      </div>
    </div>
  );
}
