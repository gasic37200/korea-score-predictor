create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  is_open boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  korea_team_name text not null default '대한민국',
  opponent_team_name text not null,
  match_at timestamptz,
  prediction_closes_at timestamptz,
  is_open boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint matches_display_order_non_negative check (display_order >= 0),
  constraint matches_event_display_order_unique unique (event_id, display_order)
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  nickname text not null,
  phone_hash text not null,
  phone_last4 text not null,
  encrypted_phone text,
  created_at timestamptz not null default now(),
  constraint participants_nickname_length check (char_length(nickname) between 1 and 30),
  constraint participants_phone_hash_length check (char_length(phone_hash) = 64),
  constraint participants_phone_last4_format check (phone_last4 ~ '^[0-9]{4}$'),
  constraint participants_event_phone_unique unique (event_id, phone_hash)
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  korea_score integer not null,
  opponent_score integer not null,
  created_at timestamptz not null default now(),
  constraint predictions_korea_score_range check (korea_score between 0 and 20),
  constraint predictions_opponent_score_range check (opponent_score between 0 and 20),
  constraint predictions_participant_match_unique unique (participant_id, match_id)
);

create index if not exists matches_event_order_idx
  on public.matches (event_id, display_order, match_at);

create index if not exists participants_event_created_idx
  on public.participants (event_id, created_at desc);

create index if not exists predictions_event_match_idx
  on public.predictions (event_id, match_id);

create index if not exists predictions_score_distribution_idx
  on public.predictions (match_id, korea_score, opponent_score);

create or replace view public.score_distribution as
select
  event_id,
  match_id,
  korea_score,
  opponent_score,
  count(*)::integer as prediction_count,
  round(
    count(*)::numeric * 100
    / nullif(sum(count(*)) over (partition by event_id, match_id), 0),
    2
  ) as percentage
from public.predictions
group by event_id, match_id, korea_score, opponent_score;

alter table public.events enable row level security;
alter table public.matches enable row level security;
alter table public.participants enable row level security;
alter table public.predictions enable row level security;

comment on table public.events is 'QR 이벤트 단위. MVP는 하나의 월드컵 이벤트를 기본으로 사용한다.';
comment on table public.matches is '이벤트에 포함된 대한민국 경기 목록과 예측 가능 상태.';
comment on table public.participants is '참여자 정보. 휴대폰 원본은 기본 저장하지 않고 phone_hash로 중복을 확인한다.';
comment on table public.predictions is '참여자별 경기 스코어 예측.';
comment on view public.score_distribution is '경기별 스코어 예측 개수와 비율 집계.';
