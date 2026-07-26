-- Review before applying. This migration enables tenant isolation for the
-- church dues tables used by the React app.
--
-- If policies with these names already exist, adapt this file to match your
-- current Supabase project before running it.

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.dues enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;

alter table public.users
  add constraint users_role_check check (role in ('admin', 'student')) not valid;

alter table public.dues
  add constraint dues_amount_positive_check check (amount > 0) not valid,
  add constraint dues_status_check check (status in ('active', 'inactive')) not valid;

alter table public.payments
  add constraint payments_amount_paid_positive_check check (amount_paid > 0) not valid,
  add constraint payments_status_check check (status in ('completed', 'pending', 'failed')) not valid;

alter table public.refunds
  add constraint refunds_amount_positive_check check (amount > 0) not valid,
  add constraint refunds_status_check check (status in ('pending', 'approved', 'rejected')) not valid;

create unique index if not exists payments_paystack_reference_key
  on public.payments (paystack_reference)
  where paystack_reference is not null;

create unique index if not exists organizations_slug_key
  on public.organizations (slug);

create index if not exists users_organization_role_idx
  on public.users (organization_id, role);

create index if not exists dues_organization_idx
  on public.dues (organization_id);

create index if not exists payments_organization_student_due_idx
  on public.payments (organization_id, student_id, due_id);

create index if not exists refunds_organization_status_idx
  on public.refunds (organization_id, status);

create policy "users read own profile"
on public.users
for select
to authenticated
using (id = auth.uid());

create policy "admins read users in organization"
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

create policy "organizations read own organization"
on public.organizations
for select
to authenticated
using (
  exists (
    select 1
    from public.users app_user
    where app_user.id = auth.uid()
      and app_user.organization_id = organizations.id
  )
);

create policy "public read organizations by invite"
on public.organizations
for select
to anon, authenticated
using (true);

create policy "admins manage dues in organization"
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

create policy "students read dues in organization"
on public.dues
for select
to authenticated
using (
  exists (
    select 1
    from public.users app_user
    where app_user.id = auth.uid()
      and app_user.role = 'student'
      and app_user.organization_id = dues.organization_id
  )
);

create policy "admins read payments in organization"
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

create policy "students read own payments"
on public.payments
for select
to authenticated
using (student_id = auth.uid());

create policy "admins read refunds in organization"
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

create policy "admins update pending refunds in organization"
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

create policy "students create own pending refunds"
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
      and refunds.amount <= payment.amount_paid
  )
);

create policy "students read own refunds"
on public.refunds
for select
to authenticated
using (student_id = auth.uid());
