import { NextResponse } from "next/server";

export async function GET() {
  try {
    const BASE = process.env.EVOLUTION_API_URL!;
    const KEY = process.env.EVOLUTION_API_KEY!;
    
    const res = await fetch(`${BASE}/send-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": KEY,
      },
      body: JSON.stringify({
        phone: "553398393101",
        message: "Teste AgendaFacil!",
      }),
    });
    
    const data = await res.json();
    return NextResponse.json({ status: res.status, data });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}