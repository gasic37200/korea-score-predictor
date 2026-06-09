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
  '대한민국 조별리그 1차전',
  '대한민국',
  '체코',
  true,
  0
from target_event
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
