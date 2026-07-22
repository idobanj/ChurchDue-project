-- Diagnose the 500 on /auth/v1/signup.
-- This lists ALL triggers on auth.users (including BEFORE INSERT) and shows
-- the function bodies so we can find which one is raising the exception.

-- 1. All triggers on auth.users.
select
    tgname   as trigger_name,
    tgrelid::regclass as on_table,
    tgtype,
    tgenabled,
    pg_get_triggerdef(oid) as definition
from pg_trigger
where tgrelid = 'auth.users'::regclass
  and not tgisinternal
order by tgname;

-- 2. All public-schema functions that touch auth.users or public.users.
--    Wide search; replace nothing — just dump the definitions.
select
    p.proname        as function_name,
    pg_get_function_identity_arguments(p.oid) as args,
    pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;

-- 3. Recent auth audit log entries (Supabase-specific) — most useful
--    for spotting which trigger raised.
select
    id,
    instance_id,
    ip_address,
    payload->>'error'  as error_message,
    payload->>'action' as action,
    created_at
from auth.audit_log_entries
where created_at > now() - interval '1 day'
order by created_at desc
limit 20;
