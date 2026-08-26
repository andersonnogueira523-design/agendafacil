"use client";

import { useState, useEffect } from "react";

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  servicoFavorito?: string;
  totalVisitas: number;
}

interface Agendamento {
  id: string;
  servico: string;
  dataHora: string;
  status: string;
  cliente: Cliente;
}

interface Tenant {
  id: string;
  nome: string;
  whatsappNumber: string;
  msgTemplate: string;
}

const TEMPLATES = [
  { label: "💇 Salão / Barbearia", texto: "Oi {nome}! Tudo bem? 😊\n\nLembrando que você tem *{servico}* hoje às *{horario}* aqui no nosso salão.\n\nConfirma sua presença?\n👉 *Sim, vou!* / *Não consigo ir*" },
  { label: "💅 Manicure / Estética", texto: "Olá {nome}! 💅\n\nSua sessão de *{servico}* está confirmada para hoje às *{horario}*.\n\nVocê vai comparecer?\n✅ *Sim* / ❌ *Preciso cancelar*" },
  { label: "🏥 Clínica / Consultório", texto: "Olá, {nome}!\n\nLembramos que você tem uma consulta de *{servico}* hoje às *{horario}*.\n\nPor favor, confirme sua presença:\n✅ *Confirmo* / ❌ *Preciso remarcar*" },
  { label: "🐾 Pet Shop / Veterinária", texto: "Oi {nome}! 🐾\n\nLembrando que o banho e tosa do seu pet está agendado para hoje às *{horario}*.\n\nConfirma?\n👉 *Sim!* / *Não vou conseguir*" },
  { label: "💪 Academia / Personal", texto: "Oi {nome}! 💪\n\nSeu treino de *{servico}* está marcado para hoje às *{horario}*.\n\nVai aparecer?\n✅ *Sim, vou!* / ❌ *Não consigo hoje*" },
];

const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
  CONFIRMADO: { bg: "#E1F5EE", text: "#085041", label: "✓ Confirmado" },
  CANCELADO:  { bg: "#FCEBEB", text: "#791F1F", label: "✕ Cancelou" },
  PENDENTE:   { bg: "#FAEEDA", text: "#633806", label: "⏳ Aguardando" },
  CONCLUIDO:  { bg: "#F0F0F0", text: "#555",    label: "✓ Concluído" },
  NO_SHOW:    { bg: "#FFF0E6", text: "#7A3A00", label: "✕ No-show" },
};

const colors = ["#EEEDFE","#E1F5EE","#FAECE7","#E6F1FB","#FAEEDA"];
const textColors = ["#3C3489","#085041","#712B13","#0C447C","#633806"];

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function formatData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}
function initials(nome: string) {
  return nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

const inputStyle = {
  width: "100%",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 14,
  boxSizing: "border-box" as const,
};

export default function DashboardPage() {
  const [aba, setAba] = useState<"dashboard"|"clientes"|"agendamentos"|"config">("dashboard");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);

  const [modalCliente, setModalCliente] = useState(false);
  const [modalAgendamento, setModalAgendamento] = useState(false);

  const [formCliente, setFormCliente] = useState({ nome: "", telefone: "", servicoFavorito: "" });
  const [formAgend, setFormAgend] = useState({ clienteId: "", servico: "", dataHora: "" });
  const [formConfig, setFormConfig] = useState({ nome: "", whatsappNumber: "", msgTemplate: "" });
  const [templateSelecionado, setTemplateSelecionado] = useState<number | null>(null);

  const [erro, setErro] = useState("");
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [configSalvo, setConfigSalvo] = useState(false);
  const [salvandoCliente, setSalvandoCliente] = useState(false);
  const [salvandoAgend, setSalvandoAgend] = useState(false);

  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  async function carregarDados() {
    setLoading(true);
    try {
      const [c, a, t] = await Promise.all([
        fetch("/api/clientes").then(r => r.json()),
        fetch(`/api/agendamentos?data=${new Date().toISOString().slice(0,10)}`).then(r => r.json()),
        fetch("/api/tenant").then(r => r.json()),
      ]);
      setClientes(c.data ?? []);
      setAgendamentos(a.data ?? []);
      if (t.data) {
        setTenant(t.data);
        setFormConfig({ nome: t.data.nome, whatsappNumber: t.data.whatsappNumber, msgTemplate: t.data.msgTemplate });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregarDados(); }, []);

  function selecionarTemplate(i: number) {
    setTemplateSelecionado(i);
    setFormConfig(f => ({ ...f, msgTemplate: TEMPLATES[i].texto }));
    setConfigSalvo(false);
  }

  async function salvarCliente(e: React.FormEvent) {
    e.preventDefault(); setErro(""); setSalvandoCliente(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formCliente, telefone: formCliente.telefone.replace(/\D/g,"") }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao salvar"); return; }
      setFormCliente({ nome: "", telefone: "", servicoFavorito: "" });
      setModalCliente(false);
      carregarDados();
    } finally {
      setSalvandoCliente(false);
    }
  }

  async function salvarAgendamento(e: React.FormEvent) {
    e.preventDefault(); setErro(""); setSalvandoAgend(true);
    try {
      const res = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formAgend, dataHora: new Date(formAgend.dataHora).toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao salvar"); return; }
      setFormAgend({ clienteId: "", servico: "", dataHora: "" });
      setModalAgendamento(false);
      carregarDados();
    } finally {
      setSalvandoAgend(false);
    }
  }

  async function salvarConfig(e: React.FormEvent) {
    e.preventDefault(); setErro(""); setSalvandoConfig(true); setConfigSalvo(false);
    try {
      const res = await fetch("/api/tenant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formConfig.nome,
          whatsappNumber: formConfig.whatsappNumber.replace(/\D/g,""),
          msgTemplate: formConfig.msgTemplate,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao salvar"); return; }
      setConfigSalvo(true);
      setTimeout(() => setConfigSalvo(false), 3000);
      carregarDados();
    } finally {
      setSalvandoConfig(false);
    }
  }

  async function atualizarStatus(id: string, status: string) {
    await fetch(`/api/agendamentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    carregarDados();
  }

  const total = agendamentos.length;
  const confirmados = agendamentos.filter(a => a.status === "CONFIRMADO").length;
  const cancelados = agendamentos.filter(a => a.status === "CANCELADO").length;
  const taxa = total > 0 ? Math.round((confirmados / total) * 100) : 0;

  const abas = [
    { key: "dashboard", label: "Dashboard" },
    { key: "clientes", label: "Clientes" },
    { key: "agendamentos", label: "Agendamentos" },
    { key: "config", label: "⚙ Configurações" },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA", fontFamily: "Inter, system-ui, sans-serif", fontSize: 14 }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>📅</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>AgendaFácil</div>
            {tenant && <div style={{ fontSize: 12, color: "#6B7280" }}>{tenant.nome}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {abas.map(a => (
            <button key={a.key} onClick={() => { setAba(a.key); setErro(""); }}
              style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: aba === a.key ? 600 : 400, background: aba === a.key ? "#EEF2FF" : "transparent", color: aba === a.key ? "#4338CA" : "#6B7280" }}>
              {a.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#9CA3AF" }}>{hoje}</div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>

        {erro && <div style={{ background: "#FEF2F2", color: "#DC2626", padding: "10px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13 }}>{erro}</div>}

        {/* DASHBOARD */}
        {aba === "dashboard" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Hoje", value: total, color: "#2563EB" },
                { label: "Confirmados", value: confirmados, color: "#059669" },
                { label: "Cancelados", value: cancelados, color: "#DC2626" },
                { label: "Taxa", value: `${taxa}%`, color: "#059669" },
              ].map(s => (
                <div key={s.label} style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px 20px" }}>
                  <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 600, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
              <div style={{ padding: "16px 22px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, color: "#111" }}>Agenda de hoje</span>
                <button onClick={() => setModalAgendamento(true)} style={{ background: "#4338CA", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>+ Novo agendamento</button>
              </div>
              {loading ? <div style={{ padding: 32, textAlign: "center", color: "#9CA3AF" }}>Carregando...</div> :
                agendamentos.length === 0
                  ? <div style={{ padding: "40px 24px", textAlign: "center", color: "#9CA3AF" }}><div style={{ fontSize: 30, marginBottom: 8 }}>📭</div>Nenhum agendamento para hoje.</div>
                  : agendamentos.map((a, i) => {
                    const st = statusStyle[a.status] ?? statusStyle.PENDENTE;
                    const ci = i % 5;
                    return (
                      <div key={a.id} style={{ padding: "13px 22px", borderBottom: "1px solid #F9FAFB", display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", width: 42, flexShrink: 0 }}>{formatHora(a.dataHora)}</span>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: colors[ci], color: textColors[ci], fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(a.cliente.nome)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, color: "#111" }}>{a.cliente.nome}</div>
                          <div style={{ fontSize: 12, color: "#6B7280" }}>{a.servico}</div>
                        </div>
                        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: st.bg, color: st.text, fontWeight: 500 }}>{st.label}</span>
                        {a.status === "PENDENTE" && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => atualizarStatus(a.id, "CONFIRMADO")} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, border: "1px solid #059669", background: "#fff", color: "#059669", cursor: "pointer" }}>Confirmar</button>
                            <button onClick={() => atualizarStatus(a.id, "CANCELADO")} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, border: "1px solid #DC2626", background: "#fff", color: "#DC2626", cursor: "pointer" }}>Cancelar</button>
                          </div>
                        )}
                      </div>
                    );
                  })
              }
            </div>
          </>
        )}

        {/* CLIENTES */}
        {aba === "clientes" && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, color: "#111" }}>Clientes ({clientes.length})</span>
              <button onClick={() => setModalCliente(true)} style={{ background: "#4338CA", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>+ Novo cliente</button>
            </div>
            {clientes.length === 0
              ? <div style={{ padding: "40px 24px", textAlign: "center", color: "#9CA3AF" }}><div style={{ fontSize: 30, marginBottom: 8 }}>👥</div>Nenhum cliente cadastrado.</div>
              : clientes.map((c, i) => {
                const ci = i % 5;
                return (
                  <div key={c.id} style={{ padding: "13px 22px", borderBottom: "1px solid #F9FAFB", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: colors[ci], color: textColors[ci], fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(c.nome)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: "#111" }}>{c.nome}</div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>{c.telefone}{c.servicoFavorito ? ` · ${c.servicoFavorito}` : ""}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>{c.totalVisitas} visita{c.totalVisitas !== 1 ? "s" : ""}</div>
                  </div>
                );
              })
            }
          </div>
        )}

        {/* AGENDAMENTOS */}
        {aba === "agendamentos" && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, color: "#111" }}>Agendamentos de hoje</span>
              <button onClick={() => setModalAgendamento(true)} style={{ background: "#4338CA", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>+ Novo agendamento</button>
            </div>
            {agendamentos.length === 0
              ? <div style={{ padding: "40px 24px", textAlign: "center", color: "#9CA3AF" }}>Nenhum agendamento hoje.</div>
              : agendamentos.map((a, i) => {
                const st = statusStyle[a.status] ?? statusStyle.PENDENTE;
                const ci = i % 5;
                return (
                  <div key={a.id} style={{ padding: "13px 22px", borderBottom: "1px solid #F9FAFB", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: colors[ci], color: textColors[ci], fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(a.cliente.nome)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: "#111" }}>{a.cliente.nome}</div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>{a.servico} · {formatData(a.dataHora)} às {formatHora(a.dataHora)}</div>
                    </div>
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: st.bg, color: st.text, fontWeight: 500 }}>{st.label}</span>
                  </div>
                );
              })
            }
          </div>
        )}

        {/* CONFIGURAÇÕES */}
        {aba === "config" && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 18 }}>Dados do negócio</h2>
            <form onSubmit={salvarConfig} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4, fontWeight: 500 }}>Nome do negócio</label>
                <input value={formConfig.nome} onChange={e => setFormConfig({...formConfig, nome: e.target.value})} placeholder="Salão Beleza & Arte" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4, fontWeight: 500 }}>WhatsApp do negócio (com DDD)</label>
                <input value={formConfig.whatsappNumber} onChange={e => setFormConfig({...formConfig, whatsappNumber: e.target.value})} placeholder="33999999999" style={inputStyle} />
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>O código do Brasil (55) é adicionado automaticamente.</p>
              </div>

              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 8, fontWeight: 500 }}>Modelos prontos — clique para usar</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {TEMPLATES.map((t, i) => (
                    <button key={i} type="button" onClick={() => selecionarTemplate(i)}
                      style={{ fontSize: 12, padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${templateSelecionado === i ? "#4338CA" : "#E5E7EB"}`, background: templateSelecionado === i ? "#EEF2FF" : "#fff", color: templateSelecionado === i ? "#4338CA" : "#374151", cursor: "pointer", fontWeight: templateSelecionado === i ? 600 : 400 }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4, fontWeight: 500 }}>Mensagem de confirmação</label>
                <textarea value={formConfig.msgTemplate} onChange={e => { setFormConfig({...formConfig, msgTemplate: e.target.value}); setTemplateSelecionado(null); }} rows={5} style={{ ...inputStyle, resize: "vertical" as const, lineHeight: 1.6 }} />
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Use <strong>{"{nome}"}</strong>, <strong>{"{servico}"}</strong> e <strong>{"{horario}"}</strong> para personalizar.</p>
              </div>

              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", border: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 8, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Preview</div>
                <div style={{ fontSize: 13, color: "#111", lineHeight: 1.7, whiteSpace: "pre-wrap" as const }}>
                  {formConfig.msgTemplate.replace(/{nome}/g, "Maria Silva").replace(/{servico}/g, "Corte e escova").replace(/{horario}/g, "14:00")}
                </div>
              </div>

              <button type="submit" disabled={salvandoConfig}
                style={{
                  border: "none",
                  borderRadius: 10,
                  padding: "12px",
                  fontSize: 14,
                  cursor: salvandoConfig ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  transition: "all 0.3s",
                  background: configSalvo ? "#059669" : salvandoConfig ? "#6B7280" : "#4338CA",
                  color: "#fff",
                }}>
                {salvandoConfig ? "Salvando..." : configSalvo ? "✓ Configurações salvas!" : "Salvar configurações"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* MODAL CLIENTE */}
      {modalCliente && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 420, margin: "0 16px" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: 20 }}>Novo cliente</h2>
            <form onSubmit={salvarCliente} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Nome completo</label>
                <input required value={formCliente.nome} onChange={e => setFormCliente({...formCliente, nome: e.target.value})} placeholder="Maria Silva" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>WhatsApp (com DDD)</label>
                <input required value={formCliente.telefone} onChange={e => setFormCliente({...formCliente, telefone: e.target.value})} placeholder="33999999999" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Serviço favorito</label>
                <input value={formCliente.servicoFavorito} onChange={e => setFormCliente({...formCliente, servicoFavorito: e.target.value})} placeholder="Corte, manicure, barba..." style={inputStyle} />
              </div>
              {erro && <p style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", padding: "8px 12px", borderRadius: 8 }}>{erro}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" onClick={() => { setModalCliente(false); setErro(""); }} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
                <button type="submit" disabled={salvandoCliente} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: salvandoCliente ? "#6B7280" : "#4338CA", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                  {salvandoCliente ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AGENDAMENTO */}
      {modalAgendamento && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 420, margin: "0 16px" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: 20 }}>Novo agendamento</h2>
            <form onSubmit={salvarAgendamento} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Cliente</label>
                <select required value={formAgend.clienteId} onChange={e => setFormAgend({...formAgend, clienteId: e.target.value})} style={inputStyle}>
                  <option value="">Selecione um cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                {clientes.length === 0 && <p style={{ fontSize: 11, color: "#F59E0B", marginTop: 4 }}>Cadastre um cliente primeiro.</p>}
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Serviço</label>
                <input required value={formAgend.servico} onChange={e => setFormAgend({...formAgend, servico: e.target.value})} placeholder="Corte, manicure, consulta..." style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Data e hora</label>
                <input required type="datetime-local" value={formAgend.dataHora} onChange={e => setFormAgend({...formAgend, dataHora: e.target.value})} style={inputStyle} />
              </div>
              {erro && <p style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", padding: "8px 12px", borderRadius: 8 }}>{erro}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" onClick={() => { setModalAgendamento(false); setErro(""); }} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
                <button type="submit" disabled={salvandoAgend} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: salvandoAgend ? "#6B7280" : "#4338CA", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                  {salvandoAgend ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
