create extension if not exists "pgcrypto";

create table if not exists public.users (
  id text primary key,
  created_at timestamp with time zone default now(),
  full_name text,
  email text,
  avatar_url text,
  points integer not null default 0,
  level integer not null default 1,
  rank_name text not null default 'Wanderer'
);

alter table public.users disable row level security;

create or replace function public.atlas_rank_for_points(points integer)
returns table(level integer, rank_name text)
language sql
immutable
as $$
  select
    case
      when points >= 10000 then 10
      when points >= 6500 then 9
      when points >= 4000 then 8
      when points >= 2500 then 7
      when points >= 1500 then 6
      when points >= 900 then 5
      when points >= 500 then 4
      when points >= 250 then 3
      when points >= 100 then 2
      else 1
    end as level,
    case
      when points >= 10000 then 'Atlas'
      when points >= 6500 then 'Compass'
      when points >= 4000 then 'Expedition'
      when points >= 2500 then 'Correspondent'
      when points >= 1500 then 'Cartographer'
      when points >= 900 then 'Voyager'
      when points >= 500 then 'Roamer'
      when points >= 250 then 'Scout'
      when points >= 100 then 'Pathfinder'
      else 'Wanderer'
    end as rank_name;
$$;

create or replace function public.set_user_rank_from_points()
returns trigger
language plpgsql
as $$
declare
  rank_record record;
begin
  select * into rank_record from public.atlas_rank_for_points(greatest(new.points, 0));
  new.points = greatest(new.points, 0);
  new.level = rank_record.level;
  new.rank_name = rank_record.rank_name;
  return new;
end;
$$;

drop trigger if exists set_user_rank_from_points_trigger on public.users;

create trigger set_user_rank_from_points_trigger
before insert or update of points on public.users
for each row
execute function public.set_user_rank_from_points();

create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  title text not null,
  body text not null,
  teaser text,
  location_name text,
  zone_name text,
  category text,
  journey_mode boolean not null default false,
  stickers text[] not null default '{}',
  photo_url text,
  author_id text,
  author_name text,
  author_rank text,
  hearts integer not null default 0,
  comments_count integer not null default 0,
  saves integer not null default 0,
  read_time integer
);

alter table public.journals enable row level security;

create policy "Anyone can read journals"
  on public.journals
  for select
  using (true);

create policy "Anyone can publish journals before auth is connected"
  on public.journals
  for insert
  with check (true);

create policy "Anyone can update journal engagement"
  on public.journals
  for update
  using (true)
  with check (true);

create or replace function public.delete_journal_for_author(
  journal_uuid uuid,
  clerk_user_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.journals
  where id = journal_uuid
    and author_id = clerk_user_id;

  get diagnostics deleted_count = row_count;
  return deleted_count > 0;
end;
$$;

grant execute on function public.delete_journal_for_author(uuid, text) to anon, authenticated;

create index if not exists journals_created_at_idx on public.journals (created_at desc);
create index if not exists journals_category_idx on public.journals (category);
create index if not exists journals_author_id_idx on public.journals (author_id);

create table if not exists public.journal_hearts (
  journal_id uuid not null references public.journals(id) on delete cascade,
  user_id text not null,
  created_at timestamp with time zone not null default now(),
  primary key (journal_id, user_id)
);

create table if not exists public.journal_saves (
  journal_id uuid not null references public.journals(id) on delete cascade,
  user_id text not null,
  created_at timestamp with time zone not null default now(),
  primary key (journal_id, user_id)
);

alter table public.journal_hearts disable row level security;
alter table public.journal_saves disable row level security;

create index if not exists journal_hearts_user_id_idx on public.journal_hearts (user_id);
create index if not exists journal_saves_user_id_idx on public.journal_saves (user_id);

insert into storage.buckets (id, name, public)
values ('journal-photos', 'journal-photos', true)
on conflict (id) do update set public = true;

create policy "Anyone can view journal photos"
  on storage.objects
  for select
  using (bucket_id = 'journal-photos');

create policy "Anyone can upload journal photos before auth is connected"
  on storage.objects
  for insert
  with check (bucket_id = 'journal-photos');

create policy "Anyone can update journal photos before auth is connected"
  on storage.objects
  for update
  using (bucket_id = 'journal-photos')
  with check (bucket_id = 'journal-photos');
