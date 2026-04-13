create table if not exists public.user_progress (
  email text not null,
  mode text not null check (mode in ('memoria', 'visual', 'atencao', 'comparacao', 'espacial', 'logica', 'especial')),
  challenge_id integer not null,
  attempts integer not null default 0,
  best_score integer not null default 0,
  last_score integer not null default 0,
  best_time_seconds integer null,
  completed boolean not null default false,
  last_played_at timestamptz null,
  last_variation_index integer null,
  primary key (email, mode, challenge_id)
);

alter table public.user_progress enable row level security;

create policy "user_progress_select_own"
on public.user_progress
for select
to authenticated
using (auth.jwt() ->> 'email' = email);

create policy "user_progress_insert_own"
on public.user_progress
for insert
to authenticated
with check (auth.jwt() ->> 'email' = email);

create policy "user_progress_update_own"
on public.user_progress
for update
to authenticated
using (auth.jwt() ->> 'email' = email)
with check (auth.jwt() ->> 'email' = email);
