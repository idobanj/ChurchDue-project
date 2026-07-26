-- Fix "500 Internal Server Error" on public.users profile reads caused by
-- recursive RLS policies that query public.users from policies on public.users.
--
-- Run this in the Supabase SQL editor.

create or replace function public.current_user_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.users
  where id = auth.uid()
  limit 1
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users
  where id = auth.uid()
  limit 1
$$;

create or replace function public.is_org_admin(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
      and organization_id = org_id
  )
$$;

revoke all on function public.current_user_organization_id() from public;
revoke all on function public.current_user_role() from public;
revoke all on function public.is_org_admin(uuid) from public;

grant execute on function public.current_user_organization_id() to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;

drop policy if exists "users admins read organization members" on public.users;
drop policy if exists "users read own profile" on public.users;
drop policy if exists "users update own profile" on public.users;
drop policy if exists "users insert own profile" on public.users;

create policy "users read own profile"
on public.users
for select
to authenticated
using (id = auth.uid());

create policy "users admins read organization members"
on public.users
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  and public.current_user_organization_id() = organization_id
);

create policy "users update own profile"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "users insert own profile"
on public.users
for insert
to authenticated
with check (id = auth.uid());

-- Replace policies on other tables too, so they do not depend on recursive
-- reads of public.users during permission checks.
drop policy if exists "dues admins manage organization dues" on public.dues;
drop policy if exists "dues members read organization dues" on public.dues;

create policy "dues admins manage organization dues"
on public.dues
for all
to authenticated
using (public.is_org_admin(organization_id))
with check (public.is_org_admin(organization_id));

create policy "dues members read organization dues"
on public.dues
for select
to authenticated
using (public.current_user_organization_id() = organization_id);

drop policy if exists "organizations admin update own organization" on public.organizations;

create policy "organizations admin update own organization"
on public.organizations
for update
to authenticated
using (public.is_org_admin(id))
with check (public.is_org_admin(id));

drop policy if exists "payments admins read organization payments" on public.payments;

create policy "payments admins read organization payments"
on public.payments
for select
to authenticated
using (public.is_org_admin(organization_id));

drop policy if exists "refunds admins read organization refunds" on public.refunds;
drop policy if exists "refunds admins update pending organization refunds" on public.refunds;

create policy "refunds admins read organization refunds"
on public.refunds
for select
to authenticated
using (public.is_org_admin(organization_id));

create policy "refunds admins update pending organization refunds"
on public.refunds
for update
to authenticated
using (
  status = 'pending'
  and public.is_org_admin(organization_id)
)
with check (
  status in ('approved', 'rejected')
  and public.is_org_admin(organization_id)
);
