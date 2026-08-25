"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: "", whatsappNumber: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.push("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-md">
        <div className="text-3xl mb-4">📅</div>
        <h1 className="text-xl font-medium text-gray-900 mb-1">Configure seu negocio</h1>
        <p className="text-sm text-gray-500 mb-6">Duas informacoes e voce ja esta pronto.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nome do negocio</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.nome} onChange={e => setForm({...form, nome: e.target.value})}
              placeholder="Salao Beleza & Arte" required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">WhatsApp (com DDI+DDD)</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.whatsappNumber} onChange={e => setForm({...form, whatsappNumber: e.target.value})}
              placeholder="5511999999999" required />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button disabled={loading}
            className="bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 mt-2">
            {loading ? "Salvando..." : "Comecar →"}
          </button>
        </form>
      </div>
    </div>
  );
}
