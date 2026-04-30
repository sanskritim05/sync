create table if not exists public.sessions (
  id text primary key,
  topic text not null check (char_length(topic) <= 60),
  status text not null check (status in ('waiting', 'voting', 'reveal')) default 'waiting',
  created_by uuid not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.options (
  id text not null,
  session_id text not null references public.sessions(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now(),
  primary key (session_id, id)
);

create table if not exists public.participants (
  session_id text not null references public.sessions(id) on delete cascade,
  user_id uuid not null,
  display_name text not null,
  has_voted boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create table if not exists public.votes (
  session_id text not null references public.sessions(id) on delete cascade,
  option_id text not null,
  user_id uuid not null,
  vote boolean not null,
  created_at timestamptz not null default now(),
  primary key (session_id, option_id, user_id),
  foreign key (session_id, option_id) references public.options(session_id, id) on delete cascade
);

alter table public.sessions enable row level security;
alter table public.options enable row level security;
alter table public.participants enable row level security;
alter table public.votes enable row level security;

create policy "authenticated users can read sessions"
  on public.sessions for select
  to authenticated
  using (true);

create policy "authenticated users can create sessions"
  on public.sessions for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "creators can update sessions"
  on public.sessions for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create policy "authenticated users can delete expired sessions"
  on public.sessions for delete
  to authenticated
  using (expires_at <= now());

create policy "authenticated users can read options"
  on public.options for select
  to authenticated
  using (true);

create policy "creators can create options"
  on public.options for insert
  to authenticated
  with check (
    exists (
      select 1 from public.sessions
      where sessions.id = options.session_id
      and sessions.created_by = auth.uid()
    )
  );

create policy "authenticated users can read participants"
  on public.participants for select
  to authenticated
  using (true);

create policy "users can join as themselves"
  on public.participants for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update themselves"
  on public.participants for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "creators can update session participants"
  on public.participants for update
  to authenticated
  using (
    exists (
      select 1 from public.sessions
      where sessions.id = participants.session_id
      and sessions.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.sessions
      where sessions.id = participants.session_id
      and sessions.created_by = auth.uid()
    )
  );

create policy "authenticated users can read votes"
  on public.votes for select
  to authenticated
  using (true);

create policy "users can cast their own votes"
  on public.votes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own votes"
  on public.votes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete votes in their sessions"
  on public.votes for delete
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.sessions
      where sessions.id = votes.session_id
      and sessions.created_by = auth.uid()
    )
  );

alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.options;
alter publication supabase_realtime add table public.participants;
alter publication supabase_realtime add table public.votes;
