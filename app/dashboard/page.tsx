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

export default function DashboardPage() {
  const [aba, setAba] = useState<"dashboard"|"clientes"|"agendamentos">("dashboard");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);

  // Modais
  const [modalCliente, setModalCliente] = useState(false);
  const [modalAgendamento, setModalAgendamento] = useState(false);

  // Forms
  const [formCliente, setFormCliente] = useState({ nome: "", telefone: "", servicoFavorito: "" });
  const [formAgend, setFormAgend] = useState({ clienteId: "", servico: "", dataHora: "" });
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  async function carregarDados() {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([
        fetch("/api/clientes").then(r => r.json()),
        fetch(`/api/agendamentos?data=${new Date().toISOString().slice(0,10)}`).then(r => r.json()),
      ]);
      setClientes(c.data ?? []);
      setAgendamentos(a.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregarDados(); }, []);

  async function salvarCliente(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setSucesso("");
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formCliente, telefone: formCliente.telefone.replace(/\D/g,"") }),
    });
    const data = await res.json();
    if (!res.ok) { setErro(data.error ?? "Erro ao salvar"); return; }
    setSucesso("Cliente cadastrado!");
    setFormCliente({ nome: "", telefone: "", servicoFavorito: "" });
    setModalCliente(false);
    carregarDados();
  }

  async function salvarAgendamento(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setSucesso("");
    const res = await fetch("/api/agendamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formAgend, dataHora: new Date(formAgend.dataHora).toISOString() }),
    });
    const data = await res.json();
    if (!res.ok) { setErro(data.error ?? "Erro ao salvar"); return; }
    setSucesso("Agendamento criado!");
    setFormAgend({ clienteId: "", servico: "", dataHora: "" });
    setModalAgendamento(false);
    carregarDados();
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

  const s = { fontFamily: "Inter, system-ui, sans-serif", fontSize: 14 };

  return (
    <div style={{ ...s, minHeight: "100vh", background: "#F7F8FA" }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>📅</span>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#111" }}>AgendaFácil</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["dashboard","clientes","agendamentos"] as const).map(a => (
            <button key={a} onClick={() => setAba(a)} style={{ padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: aba === a ? 600 : 400, background: aba === a ? "#EEF2FF" : "transparent", color: aba === a ? "#4338CA" : "#6B7280" }}>
              {a === "dashboard" ? "Dashboard" : a === "clientes" ? "Clientes" : "Agendamentos"}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#9CA3AF" }}>{hoje}</div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>

        {sucesso && <div style={{ background: "#E1F5EE", color: "#085041", padding: "10px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13 }}>✓ {sucesso}</div>}

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
                agendamentos.length === 0 ? <div style={{ padding: "40px 24px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}><div style={{ fontSize: 30, marginBottom: 8 }}>📭</div>Nenhum agendamento para hoje.</div> :
                agendamentos.map((a, i) => {
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
            {clientes.length === 0 ? <div style={{ padding: "40px 24px", textAlign: "center", color: "#9CA3AF" }}><div style={{ fontSize: 30, marginBottom: 8 }}>👥</div>Nenhum cliente cadastrado.</div> :
              clientes.map((c, i) => {
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
              <span style={{ fontWeight: 600, color: "#111" }}>Todos os agendamentos</span>
              <button onClick={() => setModalAgendamento(true)} style={{ background: "#4338CA", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>+ Novo agendamento</button>
            </div>
            {agendamentos.length === 0 ? <div style={{ padding: "40px 24px", textAlign: "center", color: "#9CA3AF" }}>Nenhum agendamento hoje.</div> :
              agendamentos.map((a, i) => {
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
      </div>

      {/* MODAL CLIENTE */}
      {modalCliente && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 420, margin: "0 16px" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: 20 }}>Novo cliente</h2>
            <form onSubmit={salvarCliente} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Nome completo</label>
                <input required value={formCliente.nome} onChange={e => setFormCliente({...formCliente, nome: e.target.value})} placeholder="Maria Silva" style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>WhatsApp (com DDD)</label>
                <input required value={formCliente.telefone} onChange={e => setFormCliente({...formCliente, telefone: e.target.value})} placeholder="5533999999999" style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Serviço favorito</label>
                <input value={formCliente.servicoFavorito} onChange={e => setFormCliente({...formCliente, servicoFavorito: e.target.value})} placeholder="Corte, manicure, barba..." style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              {erro && <p style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", padding: "8px 12px", borderRadius: 8 }}>{erro}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" onClick={() => { setModalCliente(false); setErro(""); }} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: "#4338CA", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Salvar</button>
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
                <select required value={formAgend.clienteId} onChange={e => setFormAgend({...formAgend, clienteId: e.target.value})} style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 14, boxSizing: "border-box" }}>
                  <option value="">Selecione um cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                {clientes.length === 0 && <p style={{ fontSize: 11, color: "#F59E0B", marginTop: 4 }}>Cadastre um cliente primeiro.</p>}
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Serviço</label>
                <input required value={formAgend.servico} onChange={e => setFormAgend({...formAgend, servico: e.target.value})} placeholder="Corte, manicure, consulta..." style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Data e hora</label>
                <input required type="datetime-local" value={formAgend.dataHora} onChange={e => setFormAgend({...formAgend, dataHora: e.target.value})} style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              {erro && <p style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", padding: "8px 12px", borderRadius: 8 }}>{erro}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" onClick={() => { setModalAgendamento(false); setErro(""); }} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: "#4338CA", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
