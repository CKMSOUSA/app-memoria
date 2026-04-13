create extension if not exists pgcrypto;

create table if not exists public.help_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now(),
  status text not null default 'aberta' check (status in ('aberta', 'respondida'))
);

alter table public.help_requests enable row level security;

create policy "help_requests_select_own"
on public.help_requests
for select
to authenticated
using (auth.jwt() ->> 'email' = email);

create policy "help_requests_insert_own"
on public.help_requests
for insert
to authenticated
with check (auth.jwt() ->> 'email' = email);
