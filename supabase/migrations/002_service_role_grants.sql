grant usage on schema public to service_role;

grant select, insert, update, delete on table public.events to service_role;
grant select, insert, update, delete on table public.matches to service_role;
grant select, insert, update, delete on table public.participants to service_role;
grant select, insert, update, delete on table public.predictions to service_role;

grant select on table public.score_distribution to service_role;
