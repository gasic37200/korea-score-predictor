alter table public.matches
  add column if not exists actual_korea_score integer,
  add column if not exists actual_opponent_score integer;

alter table public.matches
  drop constraint if exists matches_actual_korea_score_range,
  add constraint matches_actual_korea_score_range
    check (actual_korea_score is null or actual_korea_score between 0 and 20);

alter table public.matches
  drop constraint if exists matches_actual_opponent_score_range,
  add constraint matches_actual_opponent_score_range
    check (actual_opponent_score is null or actual_opponent_score between 0 and 20);

comment on column public.matches.actual_korea_score is '관리자가 입력하는 실제 대한민국 경기 결과 점수.';
comment on column public.matches.actual_opponent_score is '관리자가 입력하는 실제 상대팀 경기 결과 점수.';
