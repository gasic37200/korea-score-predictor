insert into public.events (title, slug, is_open)
values ('대한민국 월드컵 스코어 예측 이벤트', 'world-cup-2026', true)
on conflict (slug) do update
set
  title = excluded.title,
  is_open = excluded.is_open;

with target_event as (
  select id
  from public.events
  where slug = 'world-cup-2026'
)
insert into public.matches (
  event_id,
  title,
  korea_team_name,
  opponent_team_name,
  is_open,
  display_order
)
select
  target_event.id,
  match_seed.title,
  '대한민국',
  match_seed.opponent_team_name,
  true,
  match_seed.display_order
from target_event
cross join (
  values
    ('대한민국 조별리그 1차전', '체코', 0)
) as match_seed(title, opponent_team_name, display_order)
on conflict (event_id, display_order) do update
set
  title = excluded.title,
  korea_team_name = excluded.korea_team_name,
  opponent_team_name = excluded.opponent_team_name,
  is_open = excluded.is_open;

with target_event as (
  select id
  from public.events
  where slug = 'world-cup-2026'
)
delete from public.matches
using target_event
where matches.event_id = target_event.id
  and matches.display_order > 0;
