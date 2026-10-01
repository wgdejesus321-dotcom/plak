-- Persistência dos documentos criados no editor livre PLAK Studio.
create table if not exists public.studio_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name varchar(160) not null default 'Meu projeto',
  document jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists studio_projects_owner_updated_idx on public.studio_projects(owner_id, updated_at desc);
alter table public.studio_projects enable row level security;
drop policy if exists studio_projects_admin_read on public.studio_projects;
create policy studio_projects_admin_read on public.studio_projects for select using (public.is_admin() and owner_id = auth.uid());
drop policy if exists studio_projects_admin_insert on public.studio_projects;
create policy studio_projects_admin_insert on public.studio_projects for insert with check (public.is_admin() and owner_id = auth.uid());
drop policy if exists studio_projects_admin_update on public.studio_projects;
create policy studio_projects_admin_update on public.studio_projects for update using (public.is_admin() and owner_id = auth.uid()) with check (public.is_admin() and owner_id = auth.uid());
drop policy if exists studio_projects_admin_delete on public.studio_projects;
create policy studio_projects_admin_delete on public.studio_projects for delete using (public.is_admin() and owner_id = auth.uid());
drop trigger if exists studio_projects_touch_updated_at on public.studio_projects;
create trigger studio_projects_touch_updated_at before update on public.studio_projects for each row execute procedure public.touch_updated_at();
