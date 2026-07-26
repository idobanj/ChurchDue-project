-- Tailored RLS cleanup based on the exported policy list.
-- Review, then run in the Supabase SQL editor.
--
-- Goal:
-- - keep RLS enabled
-- - remove overly permissive policies
-- - prevent direct browser-created payment records
-- - isolate all member, due, payment, and refund data by organization

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.dues enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;

-- Remove unsafe or duplicate policies from the current project.
drop policy if exists "Dues: Full Org Control" on public.dues;
drop policy if exists "Dues: Manual Organization Match" on public.dues;
drop policy if exists "Admins can manage dues" on public.dues;
drop policy if exists "Dues are viewable by organization members" on public.dues;

drop policy if exists "Allow public organization creation" on public.organizations;
drop policy if exists "Allow public read access to organizations" on public.organizations;
drop policy if exists "Enable insert for authenticated users" on public.organizations;
drop policy if exists "Organizations are viewable by members" on public.organizations;
drop policy if exists "Public organizations are viewable by everyone" on public.organizations;
drop policy if exists "Allow admins to update their own organization" on public.organizations;

drop policy if exists "Admins can view payments for their organization" on public.payments;
drop policy if exists "Admins view org payments" on public.payments;
drop policy if exists "Students can create payments" on public.payments;
drop policy if exists "Students can insert their own payments" on public.payments;
drop policy if exists "Students can view their own payments" on public.payments;
drop policy if exists "Students view own payments" on public.payments;
drop policy if exists "Users can view payments based on role" on public.payments;

drop policy if exists "Admins can update refund requests" on public.refunds;
drop policy if exists "Students can submit refund requests" on public.refunds;
drop policy if exists "Students create own refunds" on public.refunds;
drop policy if exists "Students view own refunds" on public.refunds;
drop policy if exists "Users can view refunds based on role" on public.refunds;

drop policy if exists "Allow admins to view students in their   organization" on public.users;
drop policy if exists "Allow profile creation on signup" on public.users;
drop policy if exists "Allow users to create their own profile" on public.users;
drop policy if exists "Users can update their own profile" on public.users;
drop policy if exists "Users can update their own profiles" on public.users;
drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Users can view their own profile" on public.users;
drop policy if exists "Users: Allow read for org members" on public.users;
drop policy if exists "Users: View own record" on public.users;

-- Organizations:
-- Public read is kept because invite/signup pages look up organizations by slug.
-- Do not select secret columns such as Paystack secret keys from the client.
create policy "organizations public read for invite"
on public.organizations
for select
to anon, authenticated
using (true);

create policy "organizations authenticated create"
on public.organizations
for insert
to authenticated
with check (auth.uid() is not null);

create policy "organizations admin update own organization"
on public.organizations
for update
to authenticated
using (
  exists (
    select 1
    from public.users admin_user
    where admin_user.id = auth.uid()
      and admin_user.role = 'admin'
      and admin_user.organization_id = organizations.id
  )
)
with check (
  exists (
    select 1
    from public.users admin_user
    where admin_user.id = auth.uid()
      and admin_user.role = 'admin'
      and admin_user.organization_id = organizations.id
  )
);

-- Users:
-- Avoid SELECT true. Users can read themselves; admins can read users in their org.
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
  exists (
    select 1
    from public.users admin_user
    where admin_user.id = auth.uid()
      and admin_user.role = 'admin'
      and admin_user.organization_id = users.organization_id
  )
);

create policy "users update own profile"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Keep this only if your signup trigger/client creates public.users rows directly.
-- Prefer a SECURITY DEFINER auth.users trigger for profile creation.
create policy "users insert own profile"
on public.users
for insert
to authenticated
with check (id = auth.uid());

-- Dues:
create policy "dues admins manage organization dues"
on public.dues
for all
to authenticated
using (
  exists (
    select 1
    from public.users admin_user
    where admin_user.id = auth.uid()
      and admin_user.role = 'admin'
      and admin_user.organization_id = dues.organization_id
  )
)
with check (
  exists (
    select 1
    from public.users admin_user
    where admin_user.id = auth.uid()
      and admin_user.role = 'admin'
      and admin_user.organization_id = dues.organization_id
  )
);

create policy "dues members read organization dues"
on public.dues
for select
to authenticated
using (
  exists (
    select 1
    from public.users app_user
    where app_user.id = auth.uid()
      and app_user.organization_id = dues.organization_id
  )
);

-- Payments:
-- No client INSERT policy. Payments should be written only by the Edge Function
-- with the service role after Paystack verification.
create policy "payments admins read organization payments"
on public.payments
for select
to authenticated
using (
  exists (
    select 1
    from public.users admin_user
    where admin_user.id = auth.uid()
      and admin_user.role = 'admin'
      and admin_user.organization_id = payments.organization_id
  )
);

create policy "payments students read own payments"
on public.payments
for select
to authenticated
using (student_id = auth.uid());

-- Refunds:
create policy "refunds admins read organization refunds"
on public.refunds
for select
to authenticated
using (
  exists (
    select 1
    from public.users admin_user
    where admin_user.id = auth.uid()
      and admin_user.role = 'admin'
      and admin_user.organization_id = refunds.organization_id
  )
);

create policy "refunds students read own refunds"
on public.refunds
for select
to authenticated
using (student_id = auth.uid());

create policy "refunds students create own pending refunds"
on public.refunds
for insert
to authenticated
with check (
  student_id = auth.uid()
  and status = 'pending'
  and exists (
    select 1
    from public.payments payment
    where payment.id = refunds.payment_id
      and payment.student_id = auth.uid()
      and payment.organization_id = refunds.organization_id
      and payment.status = 'completed'
      and refunds.amount > 0
      and refunds.amount <= payment.amount_paid
  )
);

create policy "refunds admins update pending organization refunds"
on public.refunds
for update
to authenticated
using (
  status = 'pending'
  and exists (
    select 1
    from public.users admin_user
    where admin_user.id = auth.uid()
      and admin_user.role = 'admin'
      and admin_user.organization_id = refunds.organization_id
  )
)
with check (
  status in ('approved', 'rejected')
  and exists (
    select 1
    from public.users admin_user
    where admin_user.id = auth.uid()
      and admin_user.role = 'admin'
      and admin_user.organization_id = refunds.organization_id
  )
);
