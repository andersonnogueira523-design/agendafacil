const BASE = process.env.EVOLUTION_API_URL!;
const KEY  = process.env.EVOLUTION_API_KEY!;

export async function enviarMensagem(telefone: string, texto: string) {
  const res = await fetch(`${BASE}/message/sendText`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: KEY },
    body: JSON.stringify({ number: telefone, text: texto }),
  });
  if (!res.ok) throw new Error(`Evolution API error: ${res.status}`);
  return res.json();
}
