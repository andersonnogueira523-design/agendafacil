const BASE = process.env.EVOLUTION_API_URL!;

export async function enviarMensagem(telefone: string, texto: string) {
  const res = await fetch(`${BASE}/send-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": process.env.EVOLUTION_API_KEY!,
    },
    body: JSON.stringify({
      phone: telefone,
      message: texto,
    }),
  });
  if (!res.ok) throw new Error(`Z-API error: ${res.status}`);
  return res.json();
}