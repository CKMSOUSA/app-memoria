create extension if not exists pgcrypto;

create table if not exists public.session_history (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  mode text not null check (mode in ('memoria', 'visual', 'atencao', 'comparacao', 'espacial', 'logica', 'especial')),
  challenge_id integer not null,
  score integer not null default 0,
  time_seconds integer not null default 0,
  completed boolean not null default false,
  played_at timestamptz not null default now()
);

alter table public.session_history enable row level security;

create policy "session_history_select_own"
on public.session_history
for select
to authenticated
using (auth.jwt() ->> 'email' = email);

create policy "session_history_insert_own"
on public.session_history
for insert
to authenticated
with check (auth.jwt() ->> 'email' = email);
