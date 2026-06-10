alter table public.participants
  add column if not exists match_id uuid references public.matches(id) on delete cascade;

update public.participants
set match_id = prediction_match.match_id
from (
  select distinct on (participant_id)
    participant_id,
    match_id
  from public.predictions
  order by participant_id, created_at asc
) as prediction_match
where participants.id = prediction_match.participant_id
  and participants.match_id is null;

delete from public.participants
where match_id is null;

alter table public.participants
  alter column match_id set not null;

alter table public.participants
  drop constraint if exists participants_event_phone_unique;

alter table public.participants
  add constraint participants_match_phone_unique unique (match_id, phone_hash);

create index if not exists participants_match_created_idx
  on public.participants (match_id, created_at desc);

comment on table public.participants is '경기별 참여자 정보. 휴대폰 원본은 기본 저장하지 않고 match_id와 phone_hash로 경기별 중복을 확인한다.';
