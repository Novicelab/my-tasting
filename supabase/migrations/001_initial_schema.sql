-- =============================================
-- My Tasting - 주류 테이스팅 노트 서비스 스키마
-- =============================================

-- UUID 확장
create extension if not exists "uuid-ossp";

-- =============================================
-- profiles 테이블
-- =============================================
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name varchar(100),
  avatar_url text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "본인 프로필 조회" on public.profiles
  for select using (auth.uid() = id);

create policy "본인 프로필 수정" on public.profiles
  for update using (auth.uid() = id);

create policy "본인 프로필 생성" on public.profiles
  for insert with check (auth.uid() = id);

-- 새 사용자 가입 시 자동 프로필 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================
-- liquors 테이블 (AI 인식 결과 캐싱 + 대중 후기)
-- =============================================
create table public.liquors (
  id uuid primary key default uuid_generate_v4(),
  name varchar(300) not null,
  name_original varchar(300),
  category varchar(50) not null, -- wine, sake, traditional_korean, whisky, beer 등
  sub_category varchar(100),     -- red, white, junmai 등
  country varchar(100),
  region varchar(200),
  producer varchar(200),
  vintage integer,
  abv decimal(4,1),
  price_range varchar(50),
  description text,
  aroma_options text[] default '{}',
  taste_options text[] default '{}',
  finish_options text[] default '{}',
  overall_review text,
  food_pairing_options text[] default '{}',
  avg_rating decimal(2,1),
  image_url text,
  created_at timestamptz default now() not null
);

alter table public.liquors enable row level security;

-- 모든 인증된 사용자가 liquors 조회 가능
create policy "인증 사용자 liquors 조회" on public.liquors
  for select to authenticated using (true);

-- Edge Function (service_role)만 삽입/수정 가능
create policy "서비스 역할 liquors 삽입" on public.liquors
  for insert to service_role with check (true);

create policy "서비스 역할 liquors 수정" on public.liquors
  for update to service_role using (true);

-- =============================================
-- tasting_notes 테이블 (개인 전용)
-- =============================================
create table public.tasting_notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  liquor_id uuid not null references public.liquors on delete cascade,
  photo_urls text[] default '{}',
  rating decimal(2,1) check (rating >= 0 and rating <= 5),
  aroma text[] default '{}',
  taste text[] default '{}',
  finish text[] default '{}',
  food_pairing text[] default '{}',
  overall_notes text,
  tasting_date date default current_date,
  location varchar(300),
  purchase_price integer,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.tasting_notes enable row level security;

-- 본인 데이터만 CRUD
create policy "본인 노트 조회" on public.tasting_notes
  for select using (auth.uid() = user_id);

create policy "본인 노트 생성" on public.tasting_notes
  for insert with check (auth.uid() = user_id);

create policy "본인 노트 수정" on public.tasting_notes
  for update using (auth.uid() = user_id);

create policy "본인 노트 삭제" on public.tasting_notes
  for delete using (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasting_notes_updated_at
  before update on public.tasting_notes
  for each row execute function public.update_updated_at();

-- =============================================
-- 인덱스
-- =============================================
create index idx_tasting_notes_user_id on public.tasting_notes(user_id);
create index idx_tasting_notes_liquor_id on public.tasting_notes(liquor_id);
create index idx_tasting_notes_tasting_date on public.tasting_notes(tasting_date desc);
create index idx_liquors_name on public.liquors(name);
create index idx_liquors_category on public.liquors(category);

-- =============================================
-- Storage 버킷
-- =============================================
insert into storage.buckets (id, name, public)
values ('tasting-images', 'tasting-images', true);

create policy "인증 사용자 이미지 업로드" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'tasting-images');

create policy "이미지 공개 조회" on storage.objects
  for select using (bucket_id = 'tasting-images');

create policy "본인 이미지 삭제" on storage.objects
  for delete to authenticated
  using (bucket_id = 'tasting-images' and (storage.foldername(name))[1] = auth.uid()::text);
