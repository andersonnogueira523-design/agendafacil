# AgendaFacil — MVP Semana 1

## Stack
- Next.js 15 + TypeScript + Tailwind
- PostgreSQL via Supabase + Prisma ORM
- Autenticacao multi-tenant com Clerk
- WhatsApp via Evolution API (Docker)

## Setup rapido

1. Copie o .env.example para .env.local e preencha
2. npm install
3. npm run db:push        (cria as tabelas no Supabase)
4. npm run dev

## Estrutura

app/
  api/
    clientes/          GET, POST
    clientes/[id]/     PATCH, DELETE
    agendamentos/      GET, POST
    agendamentos/[id]/ PATCH, DELETE
    webhook/whatsapp/  POST (Evolution API)
    dashboard/         GET (stats do dia)
    onboarding/        POST (cria tenant)
  dashboard/           Pagina principal
  onboarding/          Onboarding do negocio

lib/
  prisma.ts    Singleton do Prisma
  tenant.ts    getTenant() + montarMensagem()
  whatsapp.ts  enviarMensagem() via Evolution API

## Proximos passos (Semana 2)
- Worker BullMQ + Redis para disparos automaticos
- Cron job para varrer mensagens PENDENTES
- Webhook completo de resposta do cliente
