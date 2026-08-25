
import { NextResponse } from "next/server";

import { enviarMensagem } from "@/lib/whatsapp";

export async function GET() {

  try {

    await enviarMensagem("5533998393101", "Teste AgendaFacil funcionando!");

    return NextResponse.json({ ok: true });

  } catch (e: unknown) {

    return NextResponse.json({ error: String(e) }, { status: 500 });

  }

}
