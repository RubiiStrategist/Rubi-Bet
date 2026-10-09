-- Ruby Bet Hub | Supabase SQL Editor | Execute uma vez no projeto novo.
create extension if not exists pgcrypto;
create table if not exists public.admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table if not exists public.platforms (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(trim(name)) between 1 and 42),
 url text not null check (url ~ '^https://[^[:space:]]+$'),
 icon_url text,
 sort_order integer not null default 0 check (sort_order between 0 and 9999),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create or replace function public.is_hub_admin() returns boolean
 language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_hub_admin() from public;
grant execute on function public.is_hub_admin() to authenticated;
create or replace function public.hub_updated_at() returns trigger
 language plpgsql set search_path = '' as $$
 begin new.updated_at=now();return new;end;
$$;
drop trigger if exists platforms_updated_at on public.platforms;
create trigger platforms_updated_at before update on public.platforms
 for each row execute function public.hub_updated_at();
alter table public.admins enable row level security;
alter table public.platforms enable row level security;
drop policy if exists "Admin can read own role" on public.admins;
create policy "Admin can read own role" on public.admins for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "Everyone can list platforms" on public.platforms;
create policy "Everyone can list platforms" on public.platforms for select to anon,authenticated using (true);
drop policy if exists "Only admins insert platforms" on public.platforms;
create policy "Only admins insert platforms" on public.platforms for insert to authenticated with check ((select public.is_hub_admin()));
drop policy if exists "Only admins update platforms" on public.platforms;
create policy "Only admins update platforms" on public.platforms for update to authenticated using ((select public.is_hub_admin())) with check ((select public.is_hub_admin()));
drop policy if exists "Only admins delete platforms" on public.platforms;
create policy "Only admins delete platforms" on public.platforms for delete to authenticated using ((select public.is_hub_admin()));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('platform-icons','platform-icons',true,1048576,array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public=true,file_size_limit=1048576,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Admins upload icons" on storage.objects;
create policy "Admins upload icons" on storage.objects for insert to authenticated
with check(bucket_id='platform-icons' and (select public.is_hub_admin()));
-- A leitura pública dos arquivos em bucket público é feita pelo endpoint público de Storage.
-- Opção de atualização automática pelo Supabase Realtime (se habilitada no projeto):
do $$ begin
 if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='platforms') then
   alter publication supabase_realtime add table public.platforms;
 end if;
end $$;
-- DEPOIS de criar um usuário via Authentication > Users, promova apenas ele:
-- insert into public.admins(user_id) values ('UUID-DO-USUARIO');
