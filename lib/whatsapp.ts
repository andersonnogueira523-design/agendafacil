const BASE = process.env.EVOLUTION_API_URL!;
const KEY = process.env.EVOLUTION_API_KEY!;

function formatarTelefone(telefone: string): string {
  let num = telefone.replace(/\D/g, "");
  if (!num.startsWith("55")) num = "55" + num;
  if (num.length === 13 && num.startsWith("55")) {
    num = num.slice(0, 4) + num.slice(5);
  }
  return num;
}

export async function enviarMensagem(telefone: string, texto: string) {
  const res = await fetch(`${BASE}/send-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": KEY,
    },
    body: JSON.stringify({
      phone: formatarTelefone(telefone),
      message: texto,
    }),
  });
  if (!res.ok) throw new Error(`Z-API error: ${res.status}`);
  return res.json();
}