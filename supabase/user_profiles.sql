create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nome text not null,
  avatar text not null,
  idade integer not null check (idade >= 6 and idade <= 120),
  role text not null default 'aluno' check (role in ('aluno', 'admin')),
  premium boolean not null default false,
  pontos integer not null default 0,
  criado_em timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "user_profiles_select_own"
on public.user_profiles
for select
to authenticated
using (auth.jwt() ->> 'email' = email);

create policy "user_profiles_insert_own"
on public.user_profiles
for insert
to authenticated
with check (auth.jwt() ->> 'email' = email);

create policy "user_profiles_update_own"
on public.user_profiles
for update
to authenticated
using (auth.jwt() ->> 'email' = email)
with check (auth.jwt() ->> 'email' = email);
